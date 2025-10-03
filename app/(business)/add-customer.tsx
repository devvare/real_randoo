import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, User, Phone, Mail, Calendar, FileText, Save } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AddCustomer() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthday: '',
    notes: ''
  });

  // Form validasyonu
  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'Müşteri adı zorunludur');
      return false;
    }
    
    if (!formData.phone.trim()) {
      Alert.alert('Hata', 'Telefon numarası zorunludur');
      return false;
    }
    
    // Telefon numarası formatı kontrolü
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası giriniz');
      return false;
    }
    
    // Email formatı kontrolü (opsiyonel)
    if (formData.email && !formData.email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir email adresi giriniz');
      return false;
    }
    
    return true;
  };

  // Müşteri ekleme
  const handleAddCustomer = async () => {
    if (!validateForm()) return;
    if (!user?.id) return;

    try {
      setLoading(true);

      // Önce aynı telefon numarasıyla müşteri var mı kontrol et
      const { data: existingCustomer, error: checkError } = await supabase
        .from('business_customers')
        .select('*')
        .eq('business_id', user.id)
        .eq('customer_phone', formData.phone.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Müşteri kontrol hatası:', checkError);
        Alert.alert('Hata', 'Müşteri kontrolü yapılamadı');
        return;
      }

      if (existingCustomer) {
        Alert.alert('Uyarı', 'Bu telefon numarasıyla zaten bir müşteri kayıtlı');
        return;
      }

      // Yeni müşteri ekle
      const { data, error } = await supabase
        .from('business_customers')
        .insert([
          {
            business_id: user.id,
            customer_name: formData.name.trim(),
            customer_phone: formData.phone.trim(),
            customer_email: formData.email.trim() || null,
            customer_birthday: formData.birthday.trim() || null,
            customer_notes: formData.notes.trim() || null,
            is_vip: false,
            total_appointments: 0,
            cancelled_appointments: 0,
            last_contact_date: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('Müşteri ekleme hatası:', error);
        Alert.alert('Hata', 'Müşteri eklenemedi');
        return;
      }

      console.log('Müşteri eklendi:', data);
      
      Alert.alert(
        'Başarılı',
        'Müşteri başarıyla eklendi',
        [
          {
            text: 'Tamam',
            onPress: () => {
              router.back();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Müşteri ekleme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Müşteri Ekle</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Ad Soyad */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad *</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Müşteri adı ve soyadı"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
            </View>
          </View>

          {/* Telefon */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon *</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="+90 555 123 45 67"
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Doğum Tarihi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doğum Tarihi</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.birthday}
                onChangeText={(text) => setFormData({...formData, birthday: text})}
              />
            </View>
          </View>

          {/* Notlar */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notlar</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <FileText size={20} color="#6b7280" style={styles.textAreaIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Müşteri hakkında notlar..."
                value={formData.notes}
                onChangeText={(text) => setFormData({...formData, notes: text})}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Kaydet Butonu */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleAddCustomer}
            disabled={loading}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              {loading ? 'Kaydediliyor...' : 'Müşteri Ekle'}
            </Text>
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
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
