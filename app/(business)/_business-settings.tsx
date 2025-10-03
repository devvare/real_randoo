import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Building2, Users } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function BusinessSettings() {
  const { user } = useAuth();
  
  const settingsItems = [
    { 
      icon: Building2, 
      label: 'İşletme Profil Ayarları', 
      onPress: () => router.push('/_business-profile-settings'),
      description: 'İşletme adı, iletişim bilgileri ve diğer detaylar'
    },
    { 
      icon: Users, 
      label: 'Personel Ayarları', 
      onPress: () => router.push('/_staff-settings'),
      description: 'Personel listesi ve yönetimi'
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İşletme Ayarları</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
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
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
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
});
