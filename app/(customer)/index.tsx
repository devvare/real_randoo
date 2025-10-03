import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Star, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Mock veriler kaldırıldı - artık gerçek Supabase verileri kullanılıyor

const categories = [
  { 
    name: 'Saç Styling', 
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center',
    searchQuery: 'saç'
  },
  { 
    name: 'Tırnak Bakımı', 
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop&crop=center',
    searchQuery: 'tırnak'
  },
  { 
    name: 'Berber', 
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop&crop=center',
    searchQuery: 'berber'
  },
  { 
    name: 'Kaş Kirpik', 
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=300&fit=crop&crop=center',
    searchQuery: 'kaş'
  },
  { 
    name: 'Makyaj', 
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop&crop=center',
    searchQuery: 'makyaj'
  },
  { 
    name: 'Cilt Bakımı', 
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop&crop=center',
    searchQuery: 'cilt'
  },
];

export default function CustomerHome() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<any[]>([]);
  const [recommendedBusinesses, setRecommendedBusinesses] = useState<any[]>([]);
  const [newBusinesses, setNewBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Veri çekme fonksiyonu
  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      
      // Tüm işletmeleri çek
      const { data: allBusinesses, error } = await supabase
        .from('businesses')
        .select(`
          id,
          business_name,
          address,
          category,
          rating,
          interior_photo,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Businesses fetch error:', error);
        return;
      }

      if (allBusinesses) {
        setBusinesses(allBusinesses);
        
        // Son görülenler (şimdilik random)
        setRecentBusinesses(allBusinesses.slice(0, 5));
        
        // Tavsiye edilenler (rating'e göre)
        const recommended = [...allBusinesses]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5);
        setRecommendedBusinesses(recommended);
        
        // Yeni katılanlar (created_at'e göre)
        setNewBusinesses(allBusinesses.slice(0, 5));
      }
    } catch (error) {
      console.error('Fetch businesses error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const renderBusinessCard = (business: any) => (
    <TouchableOpacity 
      key={business.id} 
      style={styles.businessCard}
      onPress={() => {
        console.log('İşletme detayına git:', business.business_name);
        router.push(`/(customer)/business/${business.id}`);
      }}
    >
      <Image 
        source={{ 
          uri: business.interior_photo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center'
        }} 
        style={styles.businessImage} 
      />
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{business.business_name}</Text>
        <View style={styles.ratingContainer}>
          <Star size={14} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.rating}>{business.rating?.toFixed(1) || '0.0'}</Text>
        </View>
        <View style={styles.addressContainer}>
          <MapPin size={12} color="#6b7280" />
          <Text style={styles.address}>{business.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = (category: any, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={styles.categoryCard}
      onPress={() => {
        // Arama sayfasına git ve kategori filtresini uygula
        router.push({
          pathname: '/(customer)/search',
          params: { category: category.searchQuery }
        });
      }}
    >
      <Image source={{ uri: category.image }} style={styles.categoryImage} />
      <View style={styles.categoryOverlay}>
        <Text style={styles.categoryName}>{category.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Merhaba!</Text>
          <Text style={styles.headerSubtitle}>Size en yakın hizmetleri keşfedin</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : (
          <>
            {recentBusinesses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Son Görülenler</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {recentBusinesses.map(renderBusinessCard)}
                </ScrollView>
              </View>
            )}

            {recommendedBusinesses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tavsiye Edilenler</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {recommendedBusinesses.map(renderBusinessCard)}
                </ScrollView>
              </View>
            )}

            {newBusinesses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Yeni Katılanlar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {newBusinesses.map(renderBusinessCard)}
                </ScrollView>
              </View>
            )}
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <View style={styles.categoriesGrid}>
            {categories.map(renderCategory)}
          </View>
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
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  horizontalScroll: {
    paddingLeft: 24,
  },
  businessCard: {
    width: 180,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  businessInfo: {
    padding: 12,
  },
  businessName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginLeft: 4,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: 80,
    resizeMode: 'cover',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
});