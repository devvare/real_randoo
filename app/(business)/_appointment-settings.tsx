import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Clock, Calendar, Users, CheckCircle2 } from 'lucide-react-native';
import Slider from '@react-native-community/slider';

export default function AppointmentSettings() {
  // Randevu onay seçenekleri
  const [approvalOption, setApprovalOption] = useState('manual'); // manual, automatic, vip
  
  // Diğer ayarlar
  const [preventGaps, setPreventGaps] = useState(true);
  const [minBeforeAppointment, setMinBeforeAppointment] = useState(60); // dakika
  const [maxDaysAhead, setMaxDaysAhead] = useState(30); // gün
  const [minBeforeChange, setMinBeforeChange] = useState(120); // dakika
  
  const handleSave = () => {
    // Burada ayarlar kaydedilecek
    console.log('Randevu ayarları kaydedildi');
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevu Ayarları</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Randevu Onay Seçenekleri</Text>
          
          <TouchableOpacity 
            style={[
              styles.optionItem, 
              approvalOption === 'manual' && styles.optionItemSelected
            ]}
            onPress={() => setApprovalOption('manual')}
          >
            <View style={styles.optionIcon}>
              <CheckCircle2 size={20} color={approvalOption === 'manual' ? '#6366f1' : '#94a3b8'} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Sadece Ben</Text>
              <Text style={styles.optionDescription}>
                Müşteri tarafından yapılan randevu talepleri işletme onaylamadıkça randevu talebi olarak kalacak
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.optionItem, 
              approvalOption === 'automatic' && styles.optionItemSelected
            ]}
            onPress={() => setApprovalOption('automatic')}
          >
            <View style={styles.optionIcon}>
              <CheckCircle2 size={20} color={approvalOption === 'automatic' ? '#6366f1' : '#94a3b8'} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Otomatik Onay</Text>
              <Text style={styles.optionDescription}>
                Müşteriler tarafından yapılan bütün randevu talepleri otomatik olarak onaylanacak
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.optionItem, 
              approvalOption === 'vip' && styles.optionItemSelected
            ]}
            onPress={() => setApprovalOption('vip')}
          >
            <View style={styles.optionIcon}>
              <CheckCircle2 size={20} color={approvalOption === 'vip' ? '#6366f1' : '#94a3b8'} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>VIP</Text>
              <Text style={styles.optionDescription}>
                VIP olarak tanımlanan müşteri talepleri otomatik onaylanacak, normal müşterilerin ki işletme onayı bekleyecek
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingsSection}>
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Randevu Arası Boşluk Önleme</Text>
              <Text style={styles.switchDescription}>
                Müşteri randevu talebi oluştururken, talep ettiği hizmetin süresine göre randevular arası boşluk olmaması için önlem alınacak
              </Text>
            </View>
            <Switch
              value={preventGaps}
              onValueChange={setPreventGaps}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={preventGaps ? '#6366f1' : '#94a3b8'}
            />
          </View>
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={styles.sliderTitle}>
            En az {minBeforeAppointment} dakika önce randevu al
          </Text>
          <Text style={styles.sliderDescription}>
            Müşteriler randevudan en az bu kadar süre önce randevu alabilecek
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={15}
            maximumValue={240}
            step={15}
            value={minBeforeAppointment}
            onValueChange={setMinBeforeAppointment}
            minimumTrackTintColor="#6366f1"
            maximumTrackTintColor="#e2e8f0"
            thumbTintColor="#6366f1"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>15 dk</Text>
            <Text style={styles.sliderLabel}>4 saat</Text>
          </View>
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={styles.sliderTitle}>
            En fazla {maxDaysAhead} gün sonrasına randevu al
          </Text>
          <Text style={styles.sliderDescription}>
            Müşteriler en fazla bu kadar ileri bir tarihe randevu alabilecek
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={7}
            maximumValue={90}
            step={1}
            value={maxDaysAhead}
            onValueChange={setMaxDaysAhead}
            minimumTrackTintColor="#6366f1"
            maximumTrackTintColor="#e2e8f0"
            thumbTintColor="#6366f1"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1 hafta</Text>
            <Text style={styles.sliderLabel}>3 ay</Text>
          </View>
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={styles.sliderTitle}>
            En az {minBeforeChange} dakika öncesine randevu değişikliğine izin ver
          </Text>
          <Text style={styles.sliderDescription}>
            Müşteriler randevudan en az bu kadar süre önce değişiklik veya iptal yapabilecek
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={60}
            maximumValue={1440}
            step={30}
            value={minBeforeChange}
            onValueChange={setMinBeforeChange}
            minimumTrackTintColor="#6366f1"
            maximumTrackTintColor="#e2e8f0"
            thumbTintColor="#6366f1"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1 saat</Text>
            <Text style={styles.sliderLabel}>24 saat</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
  settingsSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionItemSelected: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  optionIcon: {
    width: 24,
    marginRight: 16,
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchContent: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  sliderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  sliderDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
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
