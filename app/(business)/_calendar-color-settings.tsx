import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';

export default function CalendarColorSettings() {
  // Renk şemaları
  const colorSchemes = [
    { id: 'pastel', name: 'Pastel Renkler', primary: '#dbeafe', accent: '#3b82f6' },
    { id: 'vibrant', name: 'Canlı Renkler', primary: '#c7d2fe', accent: '#6366f1' },
    { id: 'green', name: 'Yeşil Tonları', primary: '#d1fae5', accent: '#10b981' },
    { id: 'warm', name: 'Sıcak Tonlar', primary: '#fef3c7', accent: '#f59e0b' },
    { id: 'cool', name: 'Soğuk Tonlar', primary: '#e0e7ff', accent: '#4f46e5' },
  ];

  // Görünüm ayarları
  const [selectedColorScheme, setSelectedColorScheme] = useState('pastel');
  const [showQuarterLines, setShowQuarterLines] = useState(true);
  const [showClosedTimes, setShowClosedTimes] = useState(true);
  const [compactView, setCompactView] = useState(false);

  const handleSave = () => {
    // Burada ayarlar kaydedilecek
    console.log('Takvim ayarları kaydedildi');
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Takvim Görünüm Ayarları</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Renk Şeması</Text>
          <Text style={styles.sectionDescription}>
            Takviminizin görünümünü kişiselleştirmek için bir renk şeması seçin
          </Text>
          
          <View style={styles.colorSchemeList}>
            {colorSchemes.map((scheme) => (
              <TouchableOpacity
                key={scheme.id}
                style={[
                  styles.colorSchemeItem,
                  selectedColorScheme === scheme.id && styles.colorSchemeItemSelected
                ]}
                onPress={() => setSelectedColorScheme(scheme.id)}
              >
                <View style={[styles.colorSwatch, { backgroundColor: scheme.primary }]}>
                  <View style={[styles.colorAccent, { backgroundColor: scheme.accent }]} />
                </View>
                <Text style={styles.colorSchemeName}>{scheme.name}</Text>
                {selectedColorScheme === scheme.id && (
                  <View style={styles.colorSchemeCheck}>
                    <Check size={16} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görünüm Ayarları</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>15 Dakikalık Çizgileri Göster</Text>
              <Text style={styles.settingDescription}>
                Takvimde 15 dakikalık aralıkları kesikli çizgilerle göster
              </Text>
            </View>
            <Switch
              value={showQuarterLines}
              onValueChange={setShowQuarterLines}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={showQuarterLines ? '#6366f1' : '#94a3b8'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Kapalı Saatleri Göster</Text>
              <Text style={styles.settingDescription}>
                İşletmenin kapalı olduğu saatleri taralı olarak göster
              </Text>
            </View>
            <Switch
              value={showClosedTimes}
              onValueChange={setShowClosedTimes}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={showClosedTimes ? '#6366f1' : '#94a3b8'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Kompakt Görünüm</Text>
              <Text style={styles.settingDescription}>
                Daha fazla içerik görmek için saat aralıklarını daralt
              </Text>
            </View>
            <Switch
              value={compactView}
              onValueChange={setCompactView}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={compactView ? '#6366f1' : '#94a3b8'}
            />
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
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  colorSchemeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorSchemeItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  colorSchemeItemSelected: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorAccent: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorSchemeName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    textAlign: 'center',
  },
  colorSchemeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
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
