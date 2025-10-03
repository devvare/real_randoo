import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Saat formatını düzenle (HH:MM:SS -> HH:MM)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Eğer saat formatı HH:MM:SS ise, sadece HH:MM kısmını al
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    
    return timeString;
  };

  // Tarih formatını düzenle
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Randevu detaylarını çek
  const fetchAppointmentDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (name, duration, price)
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Randevu detayları çekilemedi:', error);
        Alert.alert('Hata', 'Randevu detayları yüklenemedi');
        return;
      }
      
      // Müşteri bilgilerini işle
      let customerInfo: Record<string, any> = {};
      
      if (data.customer_info) {
        if (typeof data.customer_info === 'string') {
          try {
            customerInfo = JSON.parse(data.customer_info);
          } catch (e) {
            console.error('Customer info JSON parse error:', e);
          }
        } else {
          customerInfo = data.customer_info as Record<string, any>;
        }
      }
      
      // Müşteri adı için alternatif alanları kontrol et
      let customerName = customerInfo?.name || customerInfo?.full_name || customerInfo?.fullName;
      
      // Müşteri ID'si varsa ve adı yoksa, müşteri tablosundan çekmeyi dene
      if (!customerName && data.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id, name, email, phone')
          .eq('id', data.customer_id)
          .single();
          
        if (customerData) {
          customerName = customerData.name;
          customerInfo = {
            ...customerInfo,
            email: customerData.email || customerInfo?.email,
            phone: customerData.phone || customerInfo?.phone
          };
        } else {
          customerName = `Müşteri #${data.customer_id.substring(0, 8)}`;
        }
      }
      
      setAppointment({
        ...data,
        customer: {
          name: customerName || 'Müşteri',
          email: customerInfo?.email || '',
          phone: customerInfo?.phone || customerInfo?.phoneNumber || ''
        }
      });
    } catch (error) {
      console.error('Randevu detayları çekme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Randevuyu onayla
  const confirmAppointment = async () => {
    if (!appointment?.id) return;
    
    try {
      setConfirmLoading(true);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointment.id);
        
      if (error) {
        console.error('Randevu onaylama hatası:', error);
        Alert.alert('Hata', 'Randevu onaylanamadı');
        return;
      }
      
      // Randevu durumunu güncelle
      setAppointment({
        ...appointment,
        status: 'confirmed'
      });
      
      Alert.alert('Başarılı', 'Randevu onaylandı');
    } catch (error) {
      console.error('Randevu onaylama hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Randevuyu iptal et
  const cancelAppointment = async () => {
    if (!appointment?.id) return;
    
    Alert.alert(
      'Randevu İptali',
      'Bu randevuyu iptal etmek istediğinize emin misiniz?',
      [
        {
          text: 'Vazgeç',
          style: 'cancel'
        },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelLoading(true);
              
              const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', appointment.id);
                
              if (error) {
                console.error('Randevu iptal hatası:', error);
                Alert.alert('Hata', 'Randevu iptal edilemedi');
                return;
              }
              
              // Randevu durumunu güncelle
              setAppointment({
                ...appointment,
                status: 'cancelled'
              });
              
              Alert.alert('Başarılı', 'Randevu iptal edildi', [
                { 
                  text: 'Tamam', 
                  onPress: () => {
                    // Ana sayfaya dön ve takvimi yenile
                    router.replace('/');
                  }
                }
              ]);
            } catch (error) {
              console.error('Randevu iptal hatası:', error);
              Alert.alert('Hata', 'Bir hata oluştu');
            } finally {
              setCancelLoading(false);
            }
          }
        }
      ]
    );
  };

  // Randevuyu yeniden planla
  const rescheduleAppointment = () => {
    if (!appointment) return;
    
    // Yeni randevu sayfasına yönlendir ve mevcut randevu bilgilerini aktar
    router.push({
      pathname: '/_new-appointment',
      params: {
        isRescheduling: 'true',
        originalAppointmentId: appointment.id,
        customerId: appointment.customer_id,
        customerName: appointment.customer?.name,
        serviceId: appointment.service_id,
        serviceName: appointment.service_name,
        date: appointment.appointment_date,
        startTime: appointment.start_time,
        endTime: appointment.end_time
      }
    });
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Randevu detayları yükleniyor...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Randevu bulunamadı</Text>
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
        <Text style={styles.headerTitle}>Randevu Detayı</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Durum Göstergesi */}
        <View style={styles.statusContainer}>
          {appointment.status === 'pending' && (
            <View style={[styles.statusBadge, styles.pendingBadge]}>
              <AlertCircle size={16} color="#f59e0b" />
              <Text style={styles.pendingText}>Onay Bekliyor</Text>
            </View>
          )}
          {appointment.status === 'confirmed' && (
            <View style={[styles.statusBadge, styles.confirmedBadge]}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.confirmedText}>Onaylandı</Text>
            </View>
          )}
          {appointment.status === 'cancelled' && (
            <View style={[styles.statusBadge, styles.cancelledBadge]}>
              <XCircle size={16} color="#ef4444" />
              <Text style={styles.cancelledText}>İptal Edildi</Text>
            </View>
          )}
        </View>
        
        {/* Randevu Bilgileri */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Randevu Bilgileri</Text>
          
          <View style={styles.infoRow}>
            <Calendar size={20} color="#6366f1" />
            <Text style={styles.infoText}>{formatDate(appointment.appointment_date)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Clock size={20} color="#6366f1" />
            <Text style={styles.infoText}>
              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.serviceIcon}>
              <Text style={styles.serviceIconText}>S</Text>
            </View>
            <Text style={styles.infoText}>{appointment.services?.name || 'Hizmet'}</Text>
          </View>
          
          {appointment.services?.price && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Ücret:</Text>
              <Text style={styles.priceValue}>{appointment.services.price} ₺</Text>
            </View>
          )}
        </View>
        
        {/* Müşteri Bilgileri */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Müşteri Bilgileri</Text>
          
          <View style={styles.infoRow}>
            <User size={20} color="#6366f1" />
            <Text style={styles.infoText}>{appointment.customer?.name}</Text>
          </View>
          
          {appointment.customer?.phone && (
            <View style={styles.infoRow}>
              <Phone size={20} color="#6366f1" />
              <Text style={styles.infoText}>{appointment.customer.phone}</Text>
            </View>
          )}
          
          {appointment.customer?.email && (
            <View style={styles.infoRow}>
              <Mail size={20} color="#6366f1" />
              <Text style={styles.infoText}>{appointment.customer.email}</Text>
            </View>
          )}
        </View>
        
        {/* Notlar */}
        {appointment.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notlar</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        )}
        
        {/* İşlem Butonları */}
        <View style={styles.actionsContainer}>
          {appointment.status === 'pending' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.confirmButton]}
              onPress={confirmAppointment}
              disabled={confirmLoading}
            >
              {confirmLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Onayla</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {appointment.status !== 'cancelled' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={rescheduleAppointment}
            >
              <Edit size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Yeniden Planla</Text>
            </TouchableOpacity>
          )}
          
          {appointment.status !== 'cancelled' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={cancelAppointment}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Trash2 size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>İptal Et</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Inter-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    fontFamily: 'Inter-Medium',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  confirmedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  pendingText: {
    color: '#f59e0b',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  confirmedText: {
    color: '#10b981',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  cancelledText: {
    color: '#ef4444',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#334155',
    flex: 1,
  },
  serviceIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIconText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  priceValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  notesText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#334155',
    lineHeight: 22,
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  rescheduleButton: {
    backgroundColor: '#6366f1',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});
