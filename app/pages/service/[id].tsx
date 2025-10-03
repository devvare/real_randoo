import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Dimensions,
  ScrollView 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Star, MapPin, Clock, ArrowLeft, Calendar } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function ServiceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [service, setService] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Hizmet ve işletme bilgilerini çek
  const fetchServiceDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Hizmet bilgileri
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select(`
          *,
          businesses (
            id,
            business_name,
            address,
            rating,
            interior_photo,
            description
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (serviceError) {
        console.error('Service fetch error:', serviceError);
        return;
      }

      if (serviceData) {
        setService(serviceData);
        setBusiness(serviceData.businesses);
      }

    } catch (error) {
      console.error('Fetch service details error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const handleBookAppointment = () => {
    if (!service || !business) return;
    
    console.log('Randevu oluşturma sayfasına git:', {
      serviceId: service.id,
      serviceName: service.name,
      businessId: business.id,
      businessName: business.business_name
    });
    
    router.push(`/(customer)/booking?serviceId=${service.id}&businessId=${business.id}`);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} dk`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} saat`;
      } else {
        return `${hours} saat ${remainingMinutes} dk`;
      }
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

  if (!service || !business) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Hizmet bulunamadı</Text>
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

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          
          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetail}>
              <Clock size={16} color="#6b7280" />
              <Text style={styles.serviceDetailText}>{formatDuration(service.duration)}</Text>
            </View>
            <Text style={styles.servicePrice}>₺{service.price}</Text>
          </View>

          {service.description && (
            <Text style={styles.serviceDescription}>{service.description}</Text>
          )}
        </View>

        {/* Business Info */}
        <View style={styles.businessInfo}>
          <Text style={styles.sectionTitle}>İşletme Bilgileri</Text>
          
          <TouchableOpacity 
            style={styles.businessCard}
            onPress={() => router.push(`/(customer)/_business/${business.id}`)}
          >
            <Image 
              source={{ 
                uri: business.interior_photo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop'
              }} 
              style={styles.businessImage} 
            />
            <View style={styles.businessDetails}>
              <Text style={styles.businessName}>{business.business_name}</Text>
              
              <View style={styles.ratingContainer}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.rating}>{business.rating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.reviewCount}>(24 değerlendirme)</Text>
              </View>

              <View style={styles.addressContainer}>
                <MapPin size={14} color="#6b7280" />
                <Text style={styles.address}>{business.address}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Service Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Hizmet Özellikleri</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Clock size={16} color="#3b82f6" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Süre</Text>
                <Text style={styles.featureText}>{formatDuration(service.duration)}</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Calendar size={16} color="#3b82f6" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Rezervasyon</Text>
                <Text style={styles.featureText}>Online randevu alabilirsiniz</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Star size={16} color="#3b82f6" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Kalite</Text>
                <Text style={styles.featureText}>Profesyonel hizmet garantisi</Text>
              </View>
            </View>
          </View>
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
    height: width * 0.5,
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
  serviceInfo: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDetailText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginLeft: 8,
  },
  servicePrice: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#059669',
  },
  serviceDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
    lineHeight: 24,
  },
  businessInfo: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  businessCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  businessImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  businessDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  featuresSection: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginBottom: 12,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 2,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
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
