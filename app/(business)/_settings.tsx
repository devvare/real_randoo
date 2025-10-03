import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { 
  Settings as SettingsIcon, 
  Clock, 
  Briefcase, 
  Calendar, 
  LogOut,
  Scissors
} from 'lucide-react-native';

export default function BusinessSettings() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const settingsItems = [
    { 
      icon: Scissors, 
      label: 'Hizmet Ayarları', 
      onPress: () => router.push('/_service-settings'),
      description: 'Sunulan hizmetleri düzenle'
    },
    { 
      icon: Calendar, 
      label: 'Takvim Ayarları', 
      onPress: () => router.push('/_calendar-settings'),
      description: 'Çalışma saatlerini düzenle'
    },
    { 
      icon: Briefcase, 
      label: 'İşletme Ayarları', 
      onPress: () => router.push('/_business-settings'),
      description: 'İşletme profili ve personel ayarları'
    },
    { 
      icon: Clock, 
      label: 'Randevu Ayarları', 
      onPress: () => router.push('/_appointment-settings'),
      description: 'Randevu kurallarını düzenle'
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.settingsSection}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.settingsItem}
              onPress={item.onPress}
            >
              <View style={styles.settingsItemIcon}>
                <item.icon size={24} color="#6366f1" />
              </View>
              <View style={styles.settingsItemContent}>
                <Text style={styles.settingsItemTitle}>{item.label}</Text>
                <Text style={styles.settingsItemDescription}>{item.description}</Text>
              </View>
              <Text style={styles.settingsItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ffffff" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
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
    padding: 16,
  },
  settingsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingsItemDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  settingsItemArrow: {
    fontSize: 24,
    color: '#94a3b8',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
});
