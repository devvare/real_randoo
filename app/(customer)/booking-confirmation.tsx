import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle, Calendar, Home, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function BookingConfirmation() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevu Onayı</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Başarı İkonu */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <CheckCircle size={80} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Randevu Talebiniz Alındı!</Text>
          <Text style={styles.successSubtitle}>
            İşletme randevunuzu onayladığında size bildirim gönderilecektir.
          </Text>
        </View>

        {/* Bilgilendirme */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Ne Olacak?</Text>
          <Text style={styles.infoText}>
            • İşletme randevu talebinizi inceleyecek
          </Text>
          <Text style={styles.infoText}>
            • Onaylandığında size bildirim gelecek
          </Text>
          <Text style={styles.infoText}>
            • Randevularım sekmesinden durumu takip edebilirsiniz
          </Text>
          <Text style={styles.infoText}>
            • Sorularınız için işletmeyi arayabilirsiniz
          </Text>
        </View>

        {/* Aksiyon Butonları */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={() => router.push('/(customer)/calendar')}
          >
            <Calendar size={20} color="#6366f1" />
            <Text style={styles.calendarButtonText}>Randevularım</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push('/')}
          >
            <Home size={20} color="#ffffff" />
            <Text style={styles.homeButtonText}>Ana Sayfa</Text>
          </TouchableOpacity>
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
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    gap: 8,
  },
  calendarButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6366f1',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});