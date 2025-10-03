import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Phone, MessageCircle, Calendar, Trash2, Save, Star } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function CustomerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [isVip, setIsVip] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Müşteri verilerini yükle
  useEffect(() => {
    const loadCustomerData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      
      try {
        // Gerçek uygulamada burada Supabase sorgusu yapılacak
        // Şu an için mock veri kullanıyoruz
        const mockCustomer = {
          id: id,
          firstName: 'Ayşe',
          lastName: 'Kaya',
          phone: '+90 555 123 45 67',
          email: 'ayse.kaya@example.com',
          isVip: true,
          notes: 'Saç boyası alerjisi var. Organik ürünler tercih ediyor.',
          stats: {
            visitCount: 12,
            cancelledCount: 1,
            totalSpent: 2450,
            lastVisit: '2023-11-15'
          }
        };
        
        setCustomer(mockCustomer);
        setIsVip(mockCustomer.isVip);
        setNotes(mockCustomer.notes);
      } catch (error) {
        console.error('Müşteri bilgileri yüklenirken hata:', error);
        Alert.alert('Hata', 'Müşteri bilgileri yüklenemedi.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCustomerData();
  }, [id]);

  // Müşteri bilgilerini kaydet
  const saveCustomer = async () => {
    if (!customer) return;
    
    setIsSaving(true);
    
    try {
      // Gerçek uygulamada burada Supabase güncellemesi yapılacak
      // Şu an için sadece başarılı olduğunu varsayıyoruz
      
      // Örnek Supabase güncelleme kodu:
      // const { error } = await supabase
      //   .from('business_customers')
      //   .update({ is_vip: isVip, notes: notes })
      //   .eq('id', id);
      
      // if (error) throw error;
      
      Alert.alert('Başarılı', 'Müşteri bilgileri güncellendi.');
    } catch (error) {
      console.error('Müşteri bilgileri kaydedilirken hata:', error);
      Alert.alert('Hata', 'Müşteri bilgileri kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Müşteri silme onayı
  const confirmDeleteCustomer = () => {
    Alert.alert(
      'Müşteri Sil',
      'Bu müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: deleteCustomer }
      ]
    );
  };

  // Müşteri sil
  const deleteCustomer = async () => {
    if (!customer) return;
    
    try {
      // Gerçek uygulamada burada Supabase silme işlemi yapılacak
      // Şu an için sadece başarılı olduğunu varsayıyoruz
      
      // Örnek Supabase silme kodu:
      // const { error } = await supabase
      //   .from('business_customers')
      //   .delete()
      //   .eq('id', id);
      
      // if (error) throw error;
      
      Alert.alert('Başarılı', 'Müşteri silindi.');
      router.back();
    } catch (error) {
      console.error('Müşteri silinirken hata:', error);
      Alert.alert('Hata', 'Müşteri silinemedi.');
    }
  };

  // WhatsApp mesajı gönder
  const sendWhatsAppMessage = () => {
    if (!customer) return;
    
    const phoneNumber = customer.phone.replace(/\s+/g, '');
    const url = `https://wa.me/${phoneNumber}`;
    router.push(url);
  };

  // Telefon ara
  const callCustomer = () => {
    if (!customer) return;
    
    const phoneNumber = customer.phone.replace(/\s+/g, '');
    const url = `tel:${phoneNumber}`;
    router.push(url);
  };

  // Randevu oluştur
  const createAppointment = () => {
    if (!customer) return;
    
    router.push(`/_new-appointment?customerId=${customer.id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Müşteri bulunamadı</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Müşteri Profili</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDeleteCustomer}>
          <Trash2 size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Müşteri Bilgileri */}
        <View style={styles.customerInfoCard}>
          <Text style={styles.customerName}>
            {customer.firstName} {customer.lastName}
          </Text>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
          {customer.email && (
            <Text style={styles.customerEmail}>{customer.email}</Text>
          )}
          
          {/* VIP Durumu */}
          <View style={styles.vipContainer}>
            <View style={styles.vipLabelContainer}>
              <Star size={18} color={isVip ? '#fbbf24' : '#94a3b8'} />
              <Text style={styles.vipLabel}>VIP Müşteri</Text>
            </View>
            <Switch
              value={isVip}
              onValueChange={setIsVip}
              trackColor={{ false: '#e5e7eb', true: '#c7d2fe' }}
              thumbColor={isVip ? '#6366f1' : '#f3f4f6'}
            />
          </View>
          
          <Text style={styles.vipDescription}>
            VIP müşteriler randevu onayı beklemeden doğrudan randevu alabilirler.
          </Text>
        </View>
        
        {/* İletişim Kısayolları */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={callCustomer}>
            <Phone size={24} color="#6366f1" />
            <Text style={styles.actionText}>Ara</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={sendWhatsAppMessage}>
            <MessageCircle size={24} color="#6366f1" />
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={createAppointment}>
            <Calendar size={24} color="#6366f1" />
            <Text style={styles.actionText}>Randevu</Text>
          </TouchableOpacity>
        </View>
        
        {/* İstatistikler */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>İstatistikler</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customer.stats.visitCount}</Text>
              <Text style={styles.statLabel}>Randevu</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customer.stats.cancelledCount}</Text>
              <Text style={styles.statLabel}>İptal</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customer.stats.totalSpent} ₺</Text>
              <Text style={styles.statLabel}>Toplam</Text>
            </View>
          </View>
          
          <Text style={styles.lastVisit}>
            Son ziyaret: {new Date(customer.stats.lastVisit).toLocaleDateString('tr-TR')}
          </Text>
        </View>
        
        {/* Notlar */}
        <View style={styles.notesCard}>
          <Text style={styles.cardTitle}>Notlar</Text>
          
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Müşteri hakkında notlar..."
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
      
      {/* Kaydet Butonu */}
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={saveCustomer}
        disabled={isSaving}
      >
        <Save size={20} color="#ffffff" />
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
    marginBottom: 16,
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
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  customerInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  customerName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  customerPhone: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 16,
  },
  vipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vipLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginLeft: 8,
  },
  vipDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  lastVisit: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
  },
  notesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notesInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  saveButton: {
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
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6366f1',
  },
});
