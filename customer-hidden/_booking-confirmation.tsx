import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle, Calendar, Clock, MapPin, User, Phone } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function BookingConfirmation() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Randevu detaylarını çek
  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (
            id,
            name,
            duration,
            price,
            description
          ),
          businesses (
            id,
            business_name,
            address,
            interior_photo,
            rating
          ),
          staff (
            id,
            position
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error) {
        console.error('Appointment fetch error:', error);
        Alert.alert('Hata', 'Randevu bilgileri alınamadı');
        return;
      }

      setAppointment(data);
      console.log('Randevu detayları:', data);

    } catch (error) {
      console.error('Fetch appointment details error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${days[date.getDay()]}`;
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Onay Bekliyor';
      case 'confirmed':
        return 'Onaylandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'completed':
        return 'Tamamlandı';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'confirmed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      case 'completed':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Randevu bulunamadı</Text>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/(customer)')}>
          <Text style={styles.homeButtonText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Success Icon */}
      <View style={styles.successContainer}>
        <CheckCircle size={80} color="#10b981" />
        <Text style={styles.successTitle}>Randevu Oluşturuldu!</Text>
        <Text style={styles.successSubtitle}>
          Randevunuz başarıyla oluşturuldu. İşletme tarafından onaylandıktan sonra size bildirim gönderilecektir.
        </Text>
      </View>

      {/* Appointment Details */}
      <View style={styles.appointmentCard}>
        <View style={styles.businessHeader}>
          <Image 
            source={{ 
              uri: appointment.businesses.interior_photo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop'
            }} 
            style={styles.businessImage} 
          />
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{appointment.businesses.business_name}</Text>
            <View style={styles.addressContainer}>
              <MapPin size={14} color="#6b7280" />
              <Text style={styles.address}>{appointment.businesses.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color="#3b82f6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Tarih</Text>
              <Text style={styles.detailValue}>{formatDate(appointment.appointment_date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Clock size={20} color="#3b82f6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Saat</Text>
              <Text style={styles.detailValue}>
                {formatTimeRange(appointment.start_time, appointment.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <User size={20} color="#3b82f6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Hizmet</Text>
              <Text style={styles.detailValue}>{appointment.services.name}</Text>
            </View>
          </View>

          {appointment.staff && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={20} color="#3b82f6" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Personel</Text>
                <Text style={styles.detailValue}>{appointment.staff.position}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Text style={styles.priceIcon}>₺</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Fiyat</Text>
              <Text style={styles.detailValue}>₺{appointment.services.price}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Durum</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
              {getStatusText(appointment.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={() => router.push('/(customer)')}
        >
          <Text style={styles.homeButtonText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.calendarButton} 
          onPress={() => router.push('/(customer)/calendar')}
        >
          <Text style={styles.calendarButtonText}>Randevularım</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    paddingTop: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
    marginBottom: 24,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  businessImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  businessInfo: {
    flex: 1,
    marginLeft: 16,
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
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
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  appointmentDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  priceIcon: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#3b82f6',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  homeButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  calendarButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  calendarButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});
