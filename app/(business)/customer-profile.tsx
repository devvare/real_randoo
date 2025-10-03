import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Crown, Phone, Mail, Calendar, MessageCircle, Edit3, Trash2, Star, BarChart3 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  added_date: string;
  last_contact_date: string | null;
  total_appointments: number;
  cancelled_appointments: number;
  is_vip: boolean;
  customer_notes: string | null;
}

export default function CustomerProfile() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingVip, setUpdatingVip] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomerProfile();
    }
  }, [id]);

  // Müşteri profil bilgilerini getir
  const fetchCustomerProfile = async () => {
    if (!user?.id || !id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('business_customers')
        .select(`
          id,
          customer_name,
          customer_phone,
          customer_email,
          customer_birthday,
          added_date,
          last_contact_date,
          total_appointments,
          cancelled_appointments,
          customer_notes,
          is_vip
        `)
        .eq('business_id', user.id)
        .eq('id', id)
        .single();

      if (!error && data) {
        // VIP durumunu ayrıca kontrol et
        const { data: vipData } = await supabase
          .from('business_vip_customers')
          .select('id')
          .eq('business_id', user.id)
          .eq('customer_id', id)
          .single();

        // Müşteri verilerini uygun formata çevir
        const customerProfile = {
          id: data.id,
          name: data.customer_name,
          phone: data.customer_phone,
          email: data.customer_email,
          birthday: data.customer_birthday,
          added_date: data.added_date,
          last_contact_date: data.last_contact_date,
          total_appointments: data.total_appointments,
          cancelled_appointments: data.cancelled_appointments,
          customer_notes: data.customer_notes,
          is_vip: !!vipData
        };

        setCustomer(customerProfile);
        console.log('Müşteri profili:', customerProfile);
        return;
      }

      if (error) {
        console.error('Müşteri profili getirilemedi:', error);
        Alert.alert('Hata', 'Müşteri profili yüklenemedi');
        router.back();
        return;
      }

      setCustomer(data);
      console.log('Müşteri profili:', data);

    } catch (error) {
      console.error('Müşteri profili hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // VIP durumunu güncelle
  const toggleVipStatus = async () => {
    if (!customer || !user?.id) return;

    try {
      setUpdatingVip(true);

      if (customer.is_vip) {
        // VIP durumunu kaldır
        const { error } = await supabase
          .from('business_vip_customers')
          .delete()
          .eq('business_id', user.id)
          .eq('customer_id', customer.id);

        if (error) {
          console.error('VIP kaldırma hatası:', error);
          Alert.alert('Hata', 'VIP durumu kaldırılamadı');
          return;
        }
      } else {
        // VIP yap
        const { error } = await supabase
          .from('business_vip_customers')
          .insert([
            {
              business_id: user.id,
              customer_id: customer.id
            }
          ]);

        if (error) {
          console.error('VIP ekleme hatası:', error);
          Alert.alert('Hata', 'VIP durumu eklenemedi');
          return;
        }
      }

      // Müşteri bilgilerini yenile
      await fetchCustomerProfile();
      
      Alert.alert(
        'Başarılı',
        customer.is_vip ? 'Müşteri VIP listesinden çıkarıldı' : 'Müşteri VIP listesine eklendi'
      );

    } catch (error) {
      console.error('VIP güncelleme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setUpdatingVip(false);
    }
  };

  // Müşteriyi sil
  const deleteCustomer = async () => {
    if (!customer || !user?.id) return;

    Alert.alert(
      'Müşteriyi Sil',
      `${customer.name} adlı müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('business_customers')
                .delete()
                .eq('business_id', user.id)
                .eq('id', customer.id);

              if (error) {
                console.error('Müşteri silme hatası:', error);
                Alert.alert('Hata', 'Müşteri silinemedi');
                return;
              }

              Alert.alert('Başarılı', 'Müşteri başarıyla silindi');
              router.back();

            } catch (error) {
              console.error('Müşteri silme hatası:', error);
              Alert.alert('Hata', 'Bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  // Tarih formatlama
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // Telefon arama
  const callCustomer = () => {
    if (!customer?.phone) {
      Alert.alert('Uyarı', 'Bu müşterinin telefon numarası kayıtlı değil');
      return;
    }

    const phoneNumber = customer.phone.replace(/\s+/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // WhatsApp mesajı
  const sendWhatsApp = () => {
    if (!customer?.phone) {
      Alert.alert('Uyarı', 'Bu müşterinin telefon numarası kayıtlı değil');
      return;
    }

    const phoneNumber = customer.phone.replace(/\s+/g, '').replace('+', '');
    const url = `https://wa.me/${phoneNumber}`;
    
    Alert.alert(
      'WhatsApp',
      `${customer.name} ile WhatsApp üzerinden iletişime geçmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Mesaj Gönder',
          onPress: () => {
            if (typeof window !== 'undefined') {
              window.open(url, '_blank');
            } else {
              Linking.openURL(url);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Müşteri profili yükleniyor...</Text>
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
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Müşteri Profili</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/(business)/_edit-customer?id=${customer.id}`)}
        >
          <Edit3 size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Müşteri Bilgileri */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              {customer.is_vip && (
                <View style={styles.vipBadge}>
                  <Crown size={16} color="#F59E0B" />
                  <Text style={styles.vipText}>VIP</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.vipToggle, customer.is_vip && styles.vipToggleActive]}
              onPress={toggleVipStatus}
              disabled={updatingVip}
            >
              <Star size={16} color={customer.is_vip ? "#F59E0B" : "#6B7280"} />
              <Text style={[styles.vipToggleText, customer.is_vip && styles.vipToggleTextActive]}>
                {updatingVip ? 'Güncelleniyor...' : (customer.is_vip ? 'VIP Kaldır' : 'VIP Yap')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Phone size={16} color="#6B7280" />
              <Text style={styles.contactText}>{customer.phone || 'Telefon yok'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Mail size={16} color="#6B7280" />
              <Text style={styles.contactText}>{customer.email || 'Email yok'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.contactText}>Doğum tarihi: {formatDate(customer.birthday)}</Text>
            </View>
          </View>
        </View>

        {/* İletişim Butonları */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={callCustomer}>
            <Phone size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Ara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={sendWhatsApp}>
            <MessageCircle size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>İstatistikler</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customer.total_appointments}</Text>
              <Text style={styles.statLabel}>Toplam Randevu</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customer.cancelled_appointments}</Text>
              <Text style={styles.statLabel}>İptal Edilen</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {customer.total_appointments > 0 
                  ? Math.round(((customer.total_appointments - customer.cancelled_appointments) / customer.total_appointments) * 100)
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>Başarı Oranı</Text>
            </View>
          </View>
        </View>

        {/* Notlar */}
        {customer.customer_notes && (
          <View style={styles.notesCard}>
            <Text style={styles.cardTitle}>Notlar</Text>
            <Text style={styles.notesText}>{customer.customer_notes}</Text>
          </View>
        )}

        {/* Tehlikeli İşlemler */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Tehlikeli İşlemler</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteCustomer}>
            <Trash2 size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Müşteriyi Sil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontFamily: 'Inter-Medium',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  vipText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  vipToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 4,
  },
  vipToggleActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  vipToggleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  vipToggleTextActive: {
    color: '#F59E0B',
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  notesCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  dangerZone: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
});
