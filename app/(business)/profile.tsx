import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { Edit2, Share2, Settings, ChartBar as BarChart3 } from 'lucide-react-native';
import { router } from 'expo-router';

export default function BusinessProfile() {
  const { user } = useAuth();
  
  const navigateToEditProfile = () => {
    // İşletme profil düzenleme sayfasına yönlendir
    router.push('/_edit-profile');
  };
  
  const navigateToShareProfile = () => {
    // Paylaş sayfasına yönlendir
    router.push('/_share');
  };
  
  const navigateToSettings = () => {
    // Ayarlar sayfasına yönlendir
    router.push('/_settings');
  };

  const statsData = [
    { title: 'Bugünkü Gelir', value: '₺1,250', color: '#10b981' },
    { title: 'Tamamlanan Randevu', value: '8', color: '#3b82f6' },
    { title: 'Yeni Müşteri', value: '3', color: '#f59e0b' },
    { title: 'Müdavim', value: '12', color: '#8b5cf6' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.content}>
        <View style={styles.businessCard}>
          <View style={styles.cardHeader}>
            <TouchableOpacity style={styles.editButton} onPress={navigateToEditProfile}>
              <Edit2 size={20} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={navigateToShareProfile}>
              <Share2 size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.businessInfo}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400' }}
              style={styles.businessImage}
            />
            <Text style={styles.businessName}>Salon Güzellik</Text>
            <Text style={styles.businessAddress}>Kadıköy, İstanbul</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>4.8</Text>
              <Text style={styles.ratingText}>⭐ (124 değerlendirme)</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsPeriod}>
            <Text style={styles.statsPeriodText}>Bugün</Text>
            <TouchableOpacity>
              <Text style={styles.changePeriodText}>Değiştir</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            {statsData.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chartContainer}>
            <BarChart3 size={48} color="#6b7280" />
            <Text style={styles.chartText}>Grafikler burada gösterilecek</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.settingsButton} onPress={navigateToSettings}>
        <Settings size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingTop: 50,
  },
  businessCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  businessInfo: {
    alignItems: 'center',
  },
  businessImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  businessName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  statsSection: {
    margin: 16,
  },
  statsPeriod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsPeriodText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  changePeriodText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366f1',
  },
  statsScroll: {
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
  settingsButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});