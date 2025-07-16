import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { User, Store } from 'lucide-react-native';

export default function RegisterType() {
  const router = useRouter();

  const handleCustomerRegister = () => {
    router.push('/auth/register?type=customer');
  };

  const handleBusinessRegister = () => {
    router.push('/auth/register?type=business');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Hesap Türü Seçin</Text>
          <Text style={styles.subtitle}>Hangi tür hesap oluşturmak istiyorsunuz?</Text>
        </View>

        <View style={styles.options}>
          <TouchableOpacity style={styles.option} onPress={handleCustomerRegister}>
            <View style={styles.optionIcon}>
              <User size={32} color="#6366f1" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Müşteri Hesabı</Text>
              <Text style={styles.optionDescription}>
                Randevu alabilir, işletmeleri keşfedebilir ve favorilerinizi takip edebilirsiniz
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleBusinessRegister}>
            <View style={styles.optionIcon}>
              <Store size={32} color="#6366f1" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>İşletme Hesabı</Text>
              <Text style={styles.optionDescription}>
                İşletmenizi yönetebilir, randevuları takip edebilir ve müşterilerinizle iletişim kurabilirsiniz
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  options: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  optionIcon: {
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 20,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 32,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});