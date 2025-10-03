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
import { Star, MapPin, Clock, ArrowLeft, Phone } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function BusinessDetail() {
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

      // Hizmetler (en popüler 4 tanesi)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', id)
        .eq('is_active', true)
        .order('price', { ascending: false })
        .limit(4);

      if (!servicesError && servicesData) {
        setServices(servicesData);
      }

      // Çalışma saatleri
      const { data: hoursData, error: hoursError } = await supabase
        .from('working_hours')
        .select('*')
        .eq('business_id', id)
        .order('day_of_week');

      if (!hoursError && hoursData) {
        setWorkingHours(hoursData);
      }

    } catch (error) {
      console.error('Fetch business details error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessDetails();
  }, [id]);

  const handleServicePress = (service: any) => {
    console.log('Hizmet detayına git:', service.name);
    router.push(`/(customer)/service/${service.id}`);
  };

  const handleBookAppointment = () => {
    console.log('Randevu al:', business?.business_name);
    // İşletme detayından randevu al - ilk hizmeti seç
    if (services.length > 0) {
      router.push(`/(customer)/booking?serviceId=${services[0].id}&businessId=${business?.id}`);
    } else {
      // Eğer hizmet yoksa genel booking sayfasına git
      router.push(`/(customer)/booking?businessId=${business?.id}`);
    }
  };

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
              <Text style={styles.sectionTitle}>Popüler Hizmetler</Text>
              <TouchableOpacity onPress={() => console.log('Tüm hizmetleri göster')}>
                <Text style={styles.seeAllText}>Hepsini Gör</Text>
              </TouchableOpacity>
            </View>
            
            {services.map((service) => (
              <TouchableOpacity 
                key={service.id} 
                style={styles.serviceCard}
                onPress={() => handleServicePress(service)}
              >
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
                <TouchableOpacity style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Seç</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Working Hours */}
        {workingHours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Çalışma Saatleri</Text>
            {workingHours.map((hour) => (
              <View key={hour.day_of_week} style={styles.workingHourRow}>
                <Text style={styles.dayName}>{getDayName(hour.day_of_week)}</Text>
                <Text style={styles.hourText}>
                  {hour.is_open 
                    ? `${hour.open_time} - ${hour.close_time}`
                    : 'Kapalı'
                  }
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hakkında</Text>
          <Text style={styles.aboutText}>
            {business.description || 'Bu işletme hakkında henüz bilgi eklenmemiş.'}
          </Text>
        </View>

        {/* Bottom Spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleBookAppointment}>
        <Text style={styles.fabText}>Randevu Al</Text>
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
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  headerImage: {
    width: width,
    height: width * 0.6,
    resizeMode: 'cover',
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  businessInfo: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginBottom: 12,
  },
  businessName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3b82f6',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDetailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#059669',
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  selectButtonText: {
    color: '#ffffff',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  workingHourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  hourText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  aboutText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});
