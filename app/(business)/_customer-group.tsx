import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Search, Check, MessageCircle, X, ChevronDown, Star } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

interface Customer {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  isVip: boolean;
  visitCount: number;
  cancelledCount: number;
  selected?: boolean;
}

export default function CustomerGroup() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [customMessage, setCustomMessage] = useState('');
  const [groupName, setGroupName] = useState('');

  // Mesaj şablonları
  const messageTemplates = [
    'Merhaba! Yaklaşan randevunuzu hatırlatmak isteriz.',
    'Merhaba! Bu hafta özel indirimlerimizden yararlanmak ister misiniz?',
    'Merhaba! Uzun süredir sizi görmüyoruz. Yeni hizmetlerimiz hakkında bilgi almak ister misiniz?',
    'Özel mesaj...'
  ];

  // Grup adını belirle
  useEffect(() => {
    if (group === 'all') {
      setGroupName('Tüm Müşteriler');
    } else if (group === 'vip') {
      setGroupName('VIP Müşteriler');
    } else if (group === 'regular') {
      setGroupName('Düzenli Müşteriler');
    } else if (group === 'inactive') {
      setGroupName('Aktif Olmayan Müşteriler');
    } else if (group === 'new') {
      setGroupName('Yeni Müşteriler');
    }
  }, [group]);

  // Müşterileri yükle
  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true);
      
      try {
        // Gerçek uygulamada burada Supabase sorgusu yapılacak
        // Şu an için mock veri kullanıyoruz
        
        // Örnek Supabase sorgusu:
        // let query = supabase
        //   .from('business_customers')
        //   .select(`
        //     id,
        //     is_vip,
        //     notes,
        //     last_visit_date,
        //     visit_count,
        //     cancelled_count,
        //     customers (
        //       id,
        //       first_name,
        //       last_name,
        //       phone
        //     )
        //   `)
        //   .eq('business_id', 'current-business-id');
        
        // Gruba göre filtreleme
        // if (group === 'vip') {
        //   query = query.eq('is_vip', true);
        // } else if (group === 'regular') {
        //   query = query.gte('visit_count', 5);
        // } else if (group === 'inactive') {
        //   // Son ziyareti 3 aydan eski olanlar
        //   const threeMonthsAgo = new Date();
        //   threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        //   query = query.lt('last_visit_date', threeMonthsAgo.toISOString());
        // } else if (group === 'new') {
        //   // Son 1 ayda eklenen müşteriler
        //   const oneMonthAgo = new Date();
        //   oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        //   query = query.gte('created_at', oneMonthAgo.toISOString());
        // }
        
        // const { data, error } = await query;
        // if (error) throw error;
        
        // Verileri formatlama
        // const formattedCustomers = data.map(item => ({
        //   id: item.id,
        //   name: `${item.customers.first_name} ${item.customers.last_name}`,
        //   phone: item.customers.phone,
        //   lastVisit: item.last_visit_date ? new Date(item.last_visit_date).toLocaleDateString('tr-TR') : 'Henüz ziyaret yok',
        //   isVip: item.is_vip,
        //   visitCount: item.visit_count,
        //   cancelledCount: item.cancelled_count
        // }));
        
        // Mock veri
        const mockCustomers: Customer[] = [
          { 
            id: '1', 
            name: 'Ayşe Kaya', 
            phone: '+90 555 123 45 67', 
            lastVisit: '2 gün önce',
            isVip: true,
            visitCount: 12,
            cancelledCount: 1
          },
          { 
            id: '2', 
            name: 'Mehmet Yılmaz', 
            phone: '+90 555 234 56 78', 
            lastVisit: '1 hafta önce',
            isVip: false,
            visitCount: 5,
            cancelledCount: 0
          },
          { 
            id: '3', 
            name: 'Fatma Demir', 
            phone: '+90 555 345 67 89', 
            lastVisit: '3 gün önce',
            isVip: false,
            visitCount: 8,
            cancelledCount: 2
          },
          { 
            id: '4', 
            name: 'Ali Yıldız', 
            phone: '+90 555 456 78 90', 
            lastVisit: '1 ay önce',
            isVip: true,
            visitCount: 20,
            cancelledCount: 0
          },
          { 
            id: '5', 
            name: 'Zeynep Şahin', 
            phone: '+90 555 567 89 01', 
            lastVisit: '2 hafta önce',
            isVip: false,
            visitCount: 3,
            cancelledCount: 1
          },
        ];
        
        // Gruba göre filtreleme (mock veri için)
        let filteredMockCustomers = [...mockCustomers];
        
        if (group === 'vip') {
          filteredMockCustomers = mockCustomers.filter(c => c.isVip);
        } else if (group === 'regular') {
          filteredMockCustomers = mockCustomers.filter(c => c.visitCount >= 5);
        } else if (group === 'inactive') {
          filteredMockCustomers = mockCustomers.filter(c => c.lastVisit.includes('ay'));
        } else if (group === 'new') {
          filteredMockCustomers = mockCustomers.filter(c => c.visitCount <= 3);
        }
        
        setCustomers(filteredMockCustomers);
        setFilteredCustomers(filteredMockCustomers);
      } catch (error) {
        console.error('Müşteriler yüklenirken hata:', error);
        Alert.alert('Hata', 'Müşteriler yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCustomers();
  }, [group]);

  // Müşterileri ara
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  // Müşteri seçme
  const toggleCustomerSelection = (customer: Customer) => {
    if (!isSelectionMode) {
      // Seçim modu değilse müşteri profiline git
      router.push(`/_customer-profile?id=${customer.id}`);
      return;
    }
    
    const isSelected = selectedCustomers.some(c => c.id === customer.id);
    
    if (isSelected) {
      setSelectedCustomers(selectedCustomers.filter(c => c.id !== customer.id));
    } else {
      setSelectedCustomers([...selectedCustomers, customer]);
    }
  };

  // Tüm müşterileri seç/kaldır
  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers([...filteredCustomers]);
    }
  };

  // Seçim modunu aç/kapat
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedCustomers([]);
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
  const sendWhatsAppMessage = async (customer: Customer) => {
    // Telefon numarasını formatla (sadece rakamlar)
    const phoneNumber = customer.phone.replace(/\D/g, '');
    
    // Mesajı belirle
    let message = selectedTemplate === messageTemplates.length - 1
      ? customMessage
      : messageTemplates[selectedTemplate];
    
    // URL encode
    message = encodeURIComponent(message);
    
    // WhatsApp deep link oluştur
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // URL'yi aç
    router.push(whatsappUrl);
  };

  // Toplu mesaj gönder
  const sendBulkMessages = async () => {
    if (selectedCustomers.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir müşteri seçin.');
      return;
    }
    
    // Mesaj içeriğini kontrol et
    if (selectedTemplate === messageTemplates.length - 1 && !customMessage.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir mesaj yazın.');
      return;
    }
    
    setShowMessageModal(false);
    
    Alert.alert(
      'Mesaj Gönder',
      `${selectedCustomers.length} müşteriye mesaj göndermek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Gönder', 
          onPress: async () => {
            for (const customer of selectedCustomers) {
              await sendWhatsAppMessage(customer);
            }
            // Mesaj gönderildikten sonra seçim modunu kapat
            setIsSelectionMode(false);
            setSelectedCustomers([]);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName}</Text>
        <TouchableOpacity 
          style={styles.selectionButton} 
          onPress={toggleSelectionMode}
        >
          <Text style={styles.selectionButtonText}>
            {isSelectionMode ? 'İptal' : 'Seç'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Arama */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Müşteri ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Seçim Modu Araç Çubuğu */}
      {isSelectionMode && (
        <View style={styles.selectionToolbar}>
          <TouchableOpacity 
            style={styles.selectAllButton}
            onPress={toggleSelectAll}
          >
            <Text style={styles.selectAllText}>
              {selectedCustomers.length === filteredCustomers.length 
                ? 'Tümünü Kaldır' 
                : 'Tümünü Seç'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.selectedCount}>
            {selectedCustomers.length} müşteri seçildi
          </Text>
          
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => setShowMessageModal(true)}
            disabled={selectedCustomers.length === 0}
          >
            <MessageCircle size={20} color={selectedCustomers.length > 0 ? '#6366f1' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Müşteri Listesi */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Müşteriler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          style={styles.customersList}
          renderItem={({ item }) => {
            const isSelected = selectedCustomers.some(c => c.id === item.id);
            return (
              <TouchableOpacity 
                style={[
                  styles.customerItem, 
                  isSelected && styles.customerItemSelected
                ]}
                onPress={() => toggleCustomerSelection(item)}
              >
                {isSelectionMode && (
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected
                  ]}>
                    {isSelected && <Check size={16} color="#ffffff" />}
                  </View>
                )}
                
                <View style={styles.customerInfo}>
                  <View style={styles.customerNameContainer}>
                    <Text style={styles.customerName}>{item.name}</Text>
                    {item.isVip && (
                      <View style={styles.vipBadge}>
                        <Text style={styles.vipText}>VIP</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.customerPhone}>{item.phone}</Text>
                  <Text style={styles.customerLastVisit}>Son ziyaret: {item.lastVisit}</Text>
                  <View style={styles.customerStats}>
                    <Text style={styles.statText}>Randevu: {item.visitCount}</Text>
                    <Text style={styles.statText}>İptal: {item.cancelledCount}</Text>
                  </View>
                </View>
                
                {!isSelectionMode && (
                  <TouchableOpacity 
                    style={styles.messageIcon}
                    onPress={() => {
                      // WhatsApp mesajı gönderme işlemi
                      const phoneNumber = item.phone.replace(/\s+/g, '');
                      const url = `https://wa.me/${phoneNumber}`;
                      router.push(url);
                    }}
                  >
                    <MessageCircle size={20} color="#6366f1" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aranan müşteri bulunamadı.' : 'Bu grupta müşteri bulunamadı.'}
              </Text>
            </View>
          )}
        />
      )}
      
      {/* Mesaj Modal */}
      <Modal
        visible={showMessageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>WhatsApp Mesajı</Text>
              <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                <X size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              {selectedCustomers.length} müşteriye mesaj gönder
            </Text>
            
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
                placeholder="Özel mesajınızı yazın..."
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
            
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={sendBulkMessages}
            >
              <MessageCircle size={20} color="#ffffff" />
              <Text style={styles.sendButtonText}>Mesaj Gönder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  selectionButton: {
    padding: 8,
  },
  selectionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6366f1',
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
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectAllButton: {
    padding: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366f1',
  },
  selectedCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  messageButton: {
    padding: 8,
  },
  customersList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  customerItemSelected: {
    backgroundColor: '#eff6ff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  customerInfo: {
    flex: 1,
  },
  customerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  vipBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  vipText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  customerPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  customerLastVisit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginBottom: 4,
  },
  customerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  messageIcon: {
    padding: 8,
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
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  messagePreview: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 16,
  },
  messagePreviewText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  sendButton: {
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
  sendButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
});
