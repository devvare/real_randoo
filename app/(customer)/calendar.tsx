import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock, MapPin, Crown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Appointment {
  id: string;
  business_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer_info: {
    name: string;
    phone?: string;
    email?: string;
    is_vip?: boolean;
  };
  service: {
    name: string;
    price: number;
    duration: number;
  };
  business: {
    business_name: string;
    address?: string;
  };
  is_vip_appointment: boolean;
}

export default function CustomerCalendar() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCustomerAppointments();
    }
  }, [user?.id]);

  const fetchCustomerAppointments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Müşteri randevuları çekiliyor, user_id:', user.id);
      
      // Müşteri için iki türlü randevu var:
      // 1. Müşterinin kendisinin oluşturduğu (customer_id = user.id)
      // 2. İşletme tarafından müşteri için oluşturulan (customer_info içinde müşteri bilgisi)
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          business_id,
          appointment_date,
          start_time,
          end_time,
          status,
          customer_info,
          is_vip_appointment,
          service:services(name, price, duration),
          business:businesses(business_name, address)
        `)
        .or(`customer_id.eq.${user.id},customer_info->>email.eq.${user.email}`)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Randevu çekme hatası:', error);
        setError('Randevular yüklenemedi');
        return;
      }
      
      console.log('Çekilen randevular:', data);
      setAppointments(data || []);
      
    } catch (err) {
      console.error('Randevu çekme exception:', err);
      setError('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const isUpcoming = (appointmentDate: string, startTime: string) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${startTime}`);
    return appointmentDateTime > now;
  };

  const getTimeUntilAppointment = (appointmentDate: string, startTime: string) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${startTime}`);
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Geçmiş';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} gün sonra`;
    } else if (diffHours > 0) {
      return `${diffHours} saat sonra`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} dakika sonra`;
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    isUpcoming(apt.appointment_date, apt.start_time)
  );
  
  const pastAppointments = appointments.filter(apt => 
    !isUpcoming(apt.appointment_date, apt.start_time)
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Randevularım</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Randevular yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Randevularım</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCustomerAppointments}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Randevularım</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Yaklaşan Randevular */}
        {upcomingAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yaklaşan Randevular ({upcomingAppointments.length})</Text>
            {upcomingAppointments.map((appointment) => (
              <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.businessInfo}>
                    <View style={styles.businessNameRow}>
                      <Text style={styles.businessName}>{appointment.business?.business_name || 'İşletme'}</Text>
                      {appointment.is_vip_appointment && (
                        <Crown size={16} color="#f59e0b" style={styles.vipIcon} />
                      )}
                    </View>
                    {appointment.business?.address && (
                      <View style={styles.addressContainer}>
                        <MapPin size={14} color="#6b7280" />
                        <Text style={styles.address}>{appointment.business.address}</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.timeContainer, 
                    appointment.status === 'confirmed' ? styles.confirmedTimeContainer : 
                    appointment.status === 'pending' ? styles.pendingTimeContainer : styles.cancelledTimeContainer
                  ]}>
                    <Text style={[styles.timeText,
                      appointment.status === 'confirmed' ? styles.confirmedTimeText : 
                      appointment.status === 'pending' ? styles.pendingTimeText : styles.cancelledTimeText
                    ]}>
                      {getTimeUntilAppointment(appointment.appointment_date, appointment.start_time)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#6366f1" />
                    <Text style={styles.detailText}>
                      {new Date(appointment.appointment_date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color="#6366f1" />
                    <Text style={styles.detailText}>
                      {appointment.start_time} - {appointment.end_time}
                    </Text>
                  </View>
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceName}>{appointment.service?.name || 'Hizmet'}</Text>
                    <Text style={styles.servicePrice}>{appointment.service?.price || 0}₺</Text>
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={[
                      styles.statusText,
                      appointment.status === 'confirmed' ? styles.confirmedStatus :
                      appointment.status === 'pending' ? styles.pendingStatus : styles.cancelledStatus
                    ]}>
                      {appointment.status === 'confirmed' ? '✅ Onaylandı' :
                       appointment.status === 'pending' ? '⏳ Beklemede' : '❌ İptal Edildi'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Geçmiş Randevular */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geçmiş Randevular ({pastAppointments.length})</Text>
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <TouchableOpacity key={appointment.id} style={[styles.appointmentCard, styles.pastAppointmentCard]}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.businessInfo}>
                    <View style={styles.businessNameRow}>
                      <Text style={styles.businessName}>{appointment.business?.business_name || 'İşletme'}</Text>
                      {appointment.is_vip_appointment && (
                        <Crown size={16} color="#f59e0b" style={styles.vipIcon} />
                      )}
                    </View>
                    {appointment.business?.address && (
                      <View style={styles.addressContainer}>
                        <MapPin size={14} color="#6b7280" />
                        <Text style={styles.address}>{appointment.business.address}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#9ca3af" />
                    <Text style={styles.pastDetailText}>
                      {new Date(appointment.appointment_date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color="#9ca3af" />
                    <Text style={styles.pastDetailText}>
                      {appointment.start_time} - {appointment.end_time}
                    </Text>
                  </View>
                  <View style={styles.serviceRow}>
                    <Text style={styles.pastServiceName}>{appointment.service?.name || 'Hizmet'}</Text>
                    <Text style={styles.pastServicePrice}>{appointment.service?.price || 0}₺</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>Henüz geçmiş randevu bulunmuyor</Text>
            </View>
          )}
        </View>
        
        {/* Hiç randevu yoksa */}
        {appointments.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>Henüz randevu bulunmuyor</Text>
            <Text style={styles.emptyStateSubtext}>İşletmelerden randevu alabilirsiniz</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 4,
  },
  timeContainer: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#92400e',
  },
  appointmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipIcon: {
    marginLeft: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  serviceName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  servicePrice: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#059669',
  },
  statusRow: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  confirmedStatus: {
    color: '#059669',
  },
  pendingStatus: {
    color: '#d97706',
  },
  cancelledStatus: {
    color: '#dc2626',
  },
  confirmedTimeContainer: {
    backgroundColor: '#d1fae5',
  },
  pendingTimeContainer: {
    backgroundColor: '#fef3c7',
  },
  cancelledTimeContainer: {
    backgroundColor: '#fee2e2',
  },
  confirmedTimeText: {
    color: '#065f46',
  },
  pendingTimeText: {
    color: '#92400e',
  },
  cancelledTimeText: {
    color: '#991b1b',
  },
  pastAppointmentCard: {
    opacity: 0.7,
    backgroundColor: '#f9fafb',
  },
  pastDetailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 8,
  },
  pastServiceName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
  },
  pastServicePrice: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#9ca3af',
  },
});