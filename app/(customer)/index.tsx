import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Star, MapPin } from 'lucide-react-native';

const mockBusinesses = [
  {
    id: '1',
    name: 'Salon Güzellik',
    rating: 4.8,
    address: 'Kadıköy, İstanbul',
    image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Güzellik Merkezi'
  },
  {
    id: '2',
    name: 'Berber Ahmet',
    rating: 4.9,
    address: 'Beşiktaş, İstanbul',
    image: 'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Berber'
  },
  {
    id: '3',
    name: 'Kuaför Elif',
    rating: 4.7,
    address: 'Şişli, İstanbul',
    image: 'https://images.pexels.com/photos/3993207/pexels-photo-3993207.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Kuaför'
  }
];

const categories = [
  { name: 'Saç Styling', icon: '💇‍♀️' },
  { name: 'Tırnak Bakımı', icon: '💅' },
  { name: 'Berber', icon: '✂️' },
  { name: 'Kaş Kirpik', icon: '👁️' },
  { name: 'Makyaj', icon: '💄' },
  { name: 'Cilt Bakımı', icon: '✨' },
];

export default function CustomerHome() {
  const renderBusinessCard = (business: any) => (
    <TouchableOpacity key={business.id} style={styles.businessCard}>
      <Image source={{ uri: business.image }} style={styles.businessImage} />
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{business.name}</Text>
        <View style={styles.ratingContainer}>
          <Star size={14} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.rating}>{business.rating}</Text>
        </View>
        <View style={styles.addressContainer}>
          <MapPin size={12} color="#6b7280" />
          <Text style={styles.address}>{business.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = (category: any, index: number) => (
    <TouchableOpacity key={index} style={styles.categoryCard}>
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={styles.categoryName}>{category.name}</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Görülenler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {mockBusinesses.map(renderBusinessCard)}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tavsiye Edilenler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {mockBusinesses.map(renderBusinessCard)}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yeni Katılanlar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {mockBusinesses.map(renderBusinessCard)}
          </ScrollView>
        </View>

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
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    textAlign: 'center',
  },
});