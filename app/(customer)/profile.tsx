import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { User, Heart, Settings, Bell, Shield, FileText, Trash2, LogOut } from 'lucide-react-native';

export default function CustomerProfile() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const profileItems = [
    { icon: User, label: 'Profil Bilgileri', onPress: () => {} },
    { icon: Heart, label: 'Favoriler', onPress: () => {} },
  ];

  const settingsItems = [
    { icon: Bell, label: 'Bildirim Ayarları', onPress: () => {} },
    { icon: Shield, label: 'Gizlilik Politikası', onPress: () => {} },
    { icon: FileText, label: 'Hizmet Şartları', onPress: () => {} },
    { icon: FileText, label: 'Kullanım Koşulları', onPress: () => {} },
    { icon: Trash2, label: 'Hesabı Sil', onPress: () => {}, isDestructive: true },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={32} color="#6366f1" />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <View style={styles.card}>
            {profileItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.listItem} onPress={item.onPress}>
                <View style={styles.listItemLeft}>
                  <item.icon size={20} color="#6366f1" />
                  <Text style={styles.listItemText}>{item.label}</Text>
                </View>
                <Text style={styles.listItemArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          <View style={styles.card}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.listItem} onPress={item.onPress}>
                <View style={styles.listItemLeft}>
                  <item.icon size={20} color={item.isDestructive ? '#ef4444' : '#6366f1'} />
                  <Text style={[
                    styles.listItemText,
                    item.isDestructive && styles.listItemTextDestructive
                  ]}>
                    {item.label}
                  </Text>
                </View>
                <Text style={styles.listItemArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  profileHeader: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginLeft: 12,
  },
  listItemTextDestructive: {
    color: '#ef4444',
  },
  listItemArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});