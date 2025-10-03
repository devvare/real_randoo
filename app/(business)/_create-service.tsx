import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function CreateService() {
  const { user } = useAuth();
  
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSave = async () => {
    // Form validasyonu
    if (!serviceName.trim()) {
      Alert.alert('Hata', 'Hizmet adı gereklidir');
      return;
    }
    
    if (!price.trim() || isNaN(Number(price))) {
      Alert.alert('Hata', 'Geçerli bir fiyat girin');
      return;
    }
    
    if (!duration.trim() || isNaN(Number(duration))) {
      Alert.alert('Hata', 'Geçerli bir süre girin');
      return;
    }

    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      console.log('Hizmet kaydediliyor:', {
        business_id: user.id,
        name: serviceName.trim(),
        price: Number(price),
        duration: Number(duration),
        description: description.trim()
      });

      // Supabase'e hizmet kaydet
      const { data, error } = await supabase
        .from('services')
        .insert({
          business_id: user.id,
          name: serviceName.trim(),
          price: Number(price),
          duration: Number(duration),
          description: description.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Hizmet kaydetme hatası:', error);
        Alert.alert('Hata', `Hizmet kaydedilemedi: ${error.message}`);
        return;
      }

      console.log('Hizmet başarıyla kaydedildi:', data);
      Alert.alert('Başarılı', 'Hizmet başarıyla eklendi', [
        {
          text: 'Tamam',
          onPress: () => router.back()
        }
      ]);

    } catch (error: any) {
      console.error('Hizmet kaydetme genel hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Hizmet Oluştur</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hizmet Adı</Text>
            <TextInput
              style={styles.input}
              value={serviceName}
              onChangeText={setServiceName}
              placeholder="Hizmet adını girin"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fiyat (₺)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Fiyat girin"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Süre (dakika)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="Süre girin"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Hizmet açıklaması girin"
              multiline
              numberOfLines={4}
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
  formSection: {
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
