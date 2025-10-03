import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Star, MapPin, Clock, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';

const { width } = Dimensions.get('window');

export default function StaffBusinessProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // İşletme bilgilerini çek
  const fetchBusinessDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // İşletme bilgileri
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (businessError) {
        console.error('Business fetch error:', businessError);
        return;
      }

      setBusiness(businessData);

      // Hizmetler (tüm hizmetler)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', id)
        .eq('status', 'active')
        .order('name');

      if (servicesError) {
        console.error('Services fetch error:', servicesError);
      } else {
        setServices(servicesData || []);
      }

      // Çalışma saatleri
      const { data: hoursData, error: hoursError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', id)
        .order('day_of_week');

      if (hoursError) {
        console.error('Working hours fetch error:', hoursError);
      } else {
        setWorkingHours(hoursData || []);
      }

    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessDetails();
  }, [id]);

  // Gün adlarını çevir
  const getDayName = (dayNum: number) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[dayNum];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>İşletme bulunamadı</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: business.interior_photo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop'
            }} 
            style={styles.headerImage} 
          />
          <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          
          {/* Staff Badge */}
          <View style={styles.staffBadge}>
            <Text style={styles.staffBadgeText}>Staff Görünümü</Text>
          </View>
        </View>

        {/* Business Info */}
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{business.business_name}</Text>
          
          <View style={styles.ratingContainer}>
            <Star size={16} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.rating}>{business.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.reviewCount}>(24 değerlendirme)</Text>
          </View>

          <View style={styles.addressContainer}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.address}>{business.address}</Text>
          </View>

          {business.description && (
            <Text style={styles.description}>{business.description}</Text>
          )}
        </View>

        {/* Services Section */}
        {services.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hizmetler</Text>
              <Text style={styles.serviceCount}>{services.length} hizmet</Text>
            </View>
            
            {services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  <View style={styles.serviceDetails}>
                    <View style={styles.serviceDetail}>
                      <Clock size={14} color="#6b7280" />
                      <Text style={styles.serviceDetailText}>{service.duration} dk</Text>
                    </View>
                    <Text style={styles.servicePrice}>₺{service.price}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Working Hours */}
        {workingHours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Çalışma Saatleri</Text>
            <View style={styles.workingHoursContainer}>
              {workingHours.map((hour) => (
                <View key={hour.day_of_week} style={styles.workingHourRow}>
                  <Text style={styles.dayText}>{getDayName(hour.day_of_week)}</Text>
                  <Text style={styles.hourText}>
                    {hour.is_closed ? 'Kapalı' : `${hour.open_time} - ${hour.close_time}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Staff Info Note */}
        <View style={styles.staffNote}>
          <Text style={styles.staffNoteText}>
            Bu sayfayı staff olarak görüntülüyorsunuz. Randevu alma işlemleri müşteri uygulamasından yapılabilir.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
  staffBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  staffBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  businessInfo: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  address: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  serviceCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  serviceCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  workingHoursContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  workingHourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  hourText: {
    fontSize: 16,
    color: '#6b7280',
  },
  staffNote: {
    backgroundColor: '#fef3c7',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  staffNoteText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 20,
  },
});
