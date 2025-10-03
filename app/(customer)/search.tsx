import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Filter, MapPin, Search, Star } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface Business {
  id: string;
  business_name: string;
  address: string;
  category: string;
  rating: number;
  interior_photo: string;
  created_at: string;
}

export default function CustomerSearch() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [sortBy, setSortBy] = useState('recommended');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Ana sayfadan kategori parametresi gelirse filtreyi ayarla
  useEffect(() => {
    if (params.category && typeof params.category === 'string') {
      setFilterBy(params.category);
      setSearchQuery(params.category);
    }
  }, [params.category]);

  const sortOptions = [
    { key: 'recommended', label: 'Tavsiye Edilen' },
    { key: 'rating', label: 'En Çok Puan Alan' },
    { key: 'distance', label: 'En Yakın' },
  ];

  const filterOptions = [
    { key: 'all', label: 'Tümü' },
    { key: 'saç', label: 'Saç Styling' },
    { key: 'tırnak', label: 'Tırnak Bakımı' },
    { key: 'berber', label: 'Berber' },
    { key: 'kaş', label: 'Kaş Kirpik' },
    { key: 'makyaj', label: 'Makyaj' },
    { key: 'cilt', label: 'Cilt Bakımı' },
  ];

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    filterAndSortBusinesses();
  }, [businesses, sortBy, filterBy, searchQuery]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          business_name,
          address,
          category,
          rating,
          interior_photo,
          created_at
        `);

      if (error) {
        console.error('İşletmeler çekilemedi:', error);
        return;
      }

      setBusinesses(data || []);
    } catch (error) {
      console.error('İşletme çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBusinesses = () => {
    let filtered = [...businesses];

    // Arama filtresi
    if (searchQuery.trim()) {
      filtered = filtered.filter(business => 
        business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Kategori filtresi
    if (filterBy !== 'all') {
      filtered = filtered.filter(business => 
        business.category.toLowerCase().includes(filterBy.toLowerCase())
      );
    }

    // Sıralama
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
        // Şimdilik rastgele sıralama (gerçek mesafe hesabı için konum gerekli)
        filtered.sort(() => Math.random() - 0.5);
        break;
      case 'recommended':
      default:
        // Rating ve yenilik kombinasyonu
        filtered.sort((a, b) => {
          const aScore = b.rating * 0.7 + (new Date(b.created_at).getTime() * 0.3);
          const bScore = a.rating * 0.7 + (new Date(a.created_at).getTime() * 0.3);
          return aScore - bScore;
        });
        break;
    }

    setFilteredBusinesses(filtered);
  };

  const handleBusinessPress = (businessId: string) => {
    router.push(`/customer/business/${businessId}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>İşletme Arama</Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="İşletme, hizmet veya konum ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <MapPin size={48} color="#6b7280" />
          <Text style={styles.mapText}>Harita yüklenecek</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Sıralama</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  sortBy === option.key && styles.filterChipActive
                ]}
                onPress={() => setSortBy(option.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  sortBy === option.key && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Tip</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  filterBy === option.key && styles.filterChipActive
                ]}
                onPress={() => setFilterBy(option.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterBy === option.key && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {searchQuery ? `"${searchQuery}" için sonuçlar` : 'Tüm İşletmeler'}
          </Text>
          <Text style={styles.resultsCount}>
            {filteredBusinesses.length} işletme bulundu
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>İşletmeler yükleniyor...</Text>
          </View>
        ) : filteredBusinesses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Search size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Arama kriterlerinizi değiştirmeyi deneyin' : 'Henüz kayıtlı işletme bulunmuyor'}
            </Text>
          </View>
        ) : (
          <View style={styles.businessList}>
            {filteredBusinesses.map((business) => (
              <TouchableOpacity
                key={business.id}
                style={styles.businessCard}
                onPress={() => handleBusinessPress(business.id)}
              >
                <Image
                  source={{ uri: business.interior_photo }}
                  style={styles.businessImage}
                  defaultSource={{ uri: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center' }}
                />
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName}>{business.business_name}</Text>
                  <Text style={styles.businessCategory}>{business.category}</Text>
                  <View style={styles.businessMeta}>
                    <View style={styles.ratingContainer}>
                      <Star size={16} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.ratingText}>{business.rating.toFixed(1)}</Text>
                    </View>
                    <View style={styles.locationContainer}>
                      <MapPin size={14} color="#6b7280" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {business.address}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    marginBottom: 16,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginTop: 8,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  filterScroll: {
    paddingLeft: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  businessList: {
    gap: 16,
  },
  businessCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  businessImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f1f5f9',
  },
  businessInfo: {
    padding: 16,
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6366f1',
    marginBottom: 12,
  },
  businessMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
});