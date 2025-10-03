import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Search, Check, Send, X, ChevronDown } from 'lucide-react-native';
// Web için mock implementasyon
const mockContacts = {
  getPermissionsAsync: async () => ({ status: 'granted' }),
  getContactsAsync: async () => ({
    data: [
      {
        id: '1',
        name: 'Ahmet Yılmaz',
        phoneNumbers: [{ id: '1-1', label: 'mobile', number: '+905551234567' }]
      },
      {
        id: '2',
        name: 'Ayşe Kaya',
        phoneNumbers: [{ id: '2-1', label: 'mobile', number: '+905559876543' }]
      },
      {
        id: '3',
        name: 'Mehmet Demir',
        phoneNumbers: [{ id: '3-1', label: 'mobile', number: '+905553456789' }]
      }
    ]
  })
};

// Platform'a göre doğru modülü kullan
const Contacts = Platform.OS === 'web' ? mockContacts : require('expo-contacts');
const Linking = Platform.OS === 'web' ? { openURL: (url: string) => window.open(url, '_blank') } : require('expo-linking');

interface Contact {
  id: string;
  name: string;
  phoneNumbers: {
    id: string;
    label: string;
    number: string;
  }[];
  selected?: boolean;
}

export default function InviteCustomer() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [customMessage, setCustomMessage] = useState('');

  // Mesaj şablonları
  const messageTemplates = [
    'Merhaba! Sizi işletmemize davet etmek istiyoruz. Randevu almak için uygulamamızı kullanabilirsiniz.',
    'Merhaba! Sizi VIP müşterimiz olarak işletmemize davet ediyoruz. İlk randevunuzda %10 indirim!',
    'Merhaba! Yeni açılan işletmemize sizi davet ediyoruz. Hizmetlerimiz hakkında bilgi almak için uygulamamızı ziyaret edin.',
    'Özel mesaj...'
  ];

  // Kişilere erişim izni iste
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        loadContacts();
      } else {
        setIsLoading(false);
      }
    })();
  }, []);

  // Kişileri yükle
  const loadContacts = async () => {
    setIsLoading(true);
    
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName
      });
      
      if (data.length > 0) {
        // Sadece telefon numarası olan kişileri filtrele
        const contactsWithPhone = data
          .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
          .map(contact => ({
            id: contact.id,
            name: contact.name || 'İsimsiz Kişi',
            phoneNumbers: contact.phoneNumbers?.map(phone => ({
              id: phone.id || '',
              label: phone.label || '',
              number: phone.number || ''
            })) || [],
            selected: false
          }));
        
        setContacts(contactsWithPhone);
        setFilteredContacts(contactsWithPhone);
      }
    } catch (error) {
      console.error('Kişiler yüklenirken hata:', error);
      Alert.alert('Hata', 'Kişiler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Kişileri ara
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phoneNumbers.some(phone => 
          phone.number.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  // Kişi seçme
  const toggleContactSelection = (contact: Contact) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  // Şablon seçme
  const selectTemplate = (index: number) => {
    setSelectedTemplate(index);
    setShowTemplateOptions(false);
    
    if (index < messageTemplates.length - 1) {
      setCustomMessage('');
    }
  };

  // WhatsApp mesajı gönder
  const sendWhatsAppInvitation = async (contact: Contact) => {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return;
    }
    
    // Telefon numarasını formatla (sadece rakamlar)
    const phoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
    
    // Mesajı belirle
    let message = selectedTemplate === messageTemplates.length - 1
      ? customMessage
      : messageTemplates[selectedTemplate];
    
    // URL encode
    message = encodeURIComponent(message);
    
    // WhatsApp deep link oluştur
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // URL'yi aç
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      Alert.alert('Hata', 'WhatsApp uygulaması bulunamadı.');
    }
  };

  // Toplu davet gönder
  const sendBulkInvitations = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir kişi seçin.');
      return;
    }
    
    Alert.alert(
      'Davet Gönder',
      `${selectedContacts.length} kişiye davet göndermek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Gönder', 
          onPress: async () => {
            for (const contact of selectedContacts) {
              await sendWhatsAppInvitation(contact);
            }
          }
        }
      ]
    );
  };

  // İzin yoksa
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Müşteri Davet Et</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Kişilere Erişim İzni Gerekli</Text>
          <Text style={styles.permissionText}>
            Kişilerinize erişim izni vermeden davet gönderemezsiniz. Lütfen ayarlardan uygulamamıza kişilere erişim izni verin.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.permissionButtonText}>Ayarlara Git</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Müşteri Davet Et</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Arama */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Kişi ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Seçilen Kişiler */}
      {selectedContacts.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Seçilen Kişiler ({selectedContacts.length})
          </Text>
          <FlatList
            data={selectedContacts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.selectedContact}
                onPress={() => toggleContactSelection(item)}
              >
                <Text style={styles.selectedContactName} numberOfLines={1}>
                  {item.name}
                </Text>
                <X size={16} color="#ffffff" />
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      
      {/* Mesaj Şablonu */}
      <View style={styles.templateContainer}>
        <Text style={styles.templateTitle}>Davet Mesajı</Text>
        
        <TouchableOpacity 
          style={styles.templateSelector}
          onPress={() => setShowTemplateOptions(!showTemplateOptions)}
        >
          <Text style={styles.templateSelectorText}>
            {selectedTemplate === messageTemplates.length - 1 
              ? 'Özel Mesaj' 
              : `Şablon ${selectedTemplate + 1}`}
          </Text>
          <ChevronDown size={20} color="#6b7280" />
        </TouchableOpacity>
        
        {showTemplateOptions && (
          <View style={styles.templateOptions}>
            {messageTemplates.map((template, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.templateOption}
                onPress={() => selectTemplate(index)}
              >
                <Text style={styles.templateOptionText}>
                  {index === messageTemplates.length - 1 
                    ? template 
                    : `Şablon ${index + 1}`}
                </Text>
                {selectedTemplate === index && (
                  <Check size={20} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {selectedTemplate === messageTemplates.length - 1 ? (
          <TextInput
            style={styles.customMessageInput}
            placeholder="Özel davet mesajınızı yazın..."
            value={customMessage}
            onChangeText={setCustomMessage}
            multiline
            textAlignVertical="top"
            numberOfLines={4}
          />
        ) : (
          <View style={styles.messagePreview}>
            <Text style={styles.messagePreviewText}>
              {messageTemplates[selectedTemplate]}
            </Text>
          </View>
        )}
      </View>
      
      {/* Kişi Listesi */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Kişiler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          style={styles.contactsList}
          renderItem={({ item }) => {
            const isSelected = selectedContacts.some(c => c.id === item.id);
            return (
              <TouchableOpacity 
                style={[styles.contactItem, isSelected && styles.contactItemSelected]}
                onPress={() => toggleContactSelection(item)}
              >
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                    <Text style={styles.contactPhone}>
                      {item.phoneNumbers[0].number}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected
                ]}>
                  {isSelected && <Check size={16} color="#ffffff" />}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aranan kişi bulunamadı.' : 'Kişi bulunamadı.'}
              </Text>
            </View>
          )}
        />
      )}
      
      {/* Davet Gönder Butonu */}
      {selectedContacts.length > 0 && (
        <TouchableOpacity 
          style={styles.inviteButton}
          onPress={sendBulkInvitations}
        >
          <Send size={20} color="#ffffff" />
          <Text style={styles.inviteButtonText}>
            {selectedContacts.length} Kişiyi Davet Et
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    marginLeft: 8,
    padding: 4,
  },
  selectedContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 8,
  },
  selectedContact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  selectedContactName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginRight: 8,
    maxWidth: 100,
  },
  templateContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  templateTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  templateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  templateSelectorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  templateOptions: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  templateOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  customMessageInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    height: 100,
    textAlignVertical: 'top',
  },
  messagePreview: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  messagePreviewText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  contactsList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contactItemSelected: {
    backgroundColor: '#eff6ff',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  inviteButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  inviteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
