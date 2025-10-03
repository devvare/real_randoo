import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';

export default function CalendarSettings() {
  // Hafta günleri için başlangıç verileri
  const [workingHours, setWorkingHours] = useState([
    { day: 'Pazartesi', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Salı', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Çarşamba', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Perşembe', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Cuma', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Cumartesi', isOpen: true, openTime: '10:00', closeTime: '16:00' },
    { day: 'Pazar', isOpen: false, openTime: '10:00', closeTime: '16:00' },
  ]);

  // Çalışma saati değişikliği
  const toggleDayStatus = (index) => {
    const updatedHours = [...workingHours];
    updatedHours[index].isOpen = !updatedHours[index].isOpen;
    setWorkingHours(updatedHours);
  };

  // Saat seçimi için modal açma (gerçek uygulamada time picker kullanılacak)
  const openTimePicker = (index, timeType) => {
    // Burada time picker açılacak
    // Şimdilik sadece log yazıyoruz
    console.log(`${index} günü için ${timeType} seçimi yapılacak`);
  };

  // Ayarları kaydetme
  const saveSettings = () => {
    // Burada ayarlar kaydedilecek
    console.log('Çalışma saatleri kaydedildi:', workingHours);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Takvim Ayarları</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Çalışma Saatleri</Text>
        <Text style={styles.sectionDescription}>
          İşletmenizin çalışma saatlerini ayarlayın. Müşteriler sadece bu saatler içinde randevu alabilecekler.
        </Text>
        
        <View style={styles.workingHoursContainer}>
          {workingHours.map((item, index) => (
            <View key={index} style={styles.dayRow}>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{item.day}</Text>
                <Switch
                  value={item.isOpen}
                  onValueChange={() => toggleDayStatus(index)}
                  trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
                  thumbColor={item.isOpen ? '#6366f1' : '#94a3b8'}
                />
              </View>
              
              {item.isOpen && (
                <View style={styles.hoursContainer}>
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => openTimePicker(index, 'openTime')}
                  >
                    <Clock size={16} color="#64748b" />
                    <Text style={styles.timeText}>{item.openTime}</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.timeSeparator}>-</Text>
                  
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => openTimePicker(index, 'closeTime')}
                  >
                    <Clock size={16} color="#64748b" />
                    <Text style={styles.timeText}>{item.closeTime}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Kaydet</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 16,
  },
  workingHoursContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  dayRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dayInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginLeft: 6,
  },
  timeSeparator: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginHorizontal: 12,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
});
