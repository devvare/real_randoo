import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Save, Star } from 'lucide-react-native';
import { DateTimePickerCross } from '../../components/DateTimePickerCross';
import { supabase } from '../../lib/supabase';

export default function AddCustomer() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Telefon numarası formatı kontrolü
  const isValidPhone = (phone: string) => {
    // Basit bir telefon numarası doğrulama
    return /^\+?[0-9\s]{10,15}$/.test(phone);
  };

  // Email formatı kontrolü
  const isValidEmail = (email: string) => {
    if (!email) return true; // Email zorunlu değil
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Form doğrulama
  const isFormValid = () => {
    if (!firstName.trim()) {
      Alert.alert('Hata', 'Ad alanı boş olamaz.');
      return false;
    }
    
    if (!lastName.trim()) {
      Alert.alert('Hata', 'Soyad alanı boş olamaz.');
      return false;
    }
    
    if (!phone.trim()) {
      Alert.alert('Hata', 'Telefon alanı boş olamaz.');
      return false;
    }
    
    if (!isValidPhone(phone)) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası giriniz.');
      return false;
    }
    
    if (email && !isValidEmail(email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi giriniz.');
      return false;
    }
    
    return true;
  };

  // Müşteri kaydetme
  const saveCustomer = async () => {
    if (!isFormValid()) return;
    
    setIsSaving(true);
    
    try {
      // Gerçek uygulamada burada Supabase'e kayıt yapılacak
      // Şu an için sadece başarılı olduğunu varsayıyoruz
      
      // Örnek Supabase kayıt kodu:
      // 1. Önce customers tablosuna kayıt
      // const { data: customerData, error: customerError } = await supabase
      //   .from('customers')
      //   .insert({
      //     user_id: 'current-user-id', // Mevcut kullanıcının ID'si
      //     first_name: firstName,
      //     last_name: lastName,
      //     email: email || null,
      //     phone: phone,
      //     birthday: birthday ? birthday.toISOString().split('T')[0] : null,
      //   })
      //   .select('id')
      //   .single();
      
      // if (customerError) throw customerError;
      
      // 2. Sonra business_customers tablosuna kayıt
      // const { error: businessCustomerError } = await supabase
      //   .from('business_customers')
      //   .insert({
      //     business_id: 'current-business-id', // Mevcut işletmenin ID'si
      //     customer_id: customerData.id,
      //     is_vip: isVip,
      //     notes: notes || null,
      //     visit_count: 0,
      //     cancelled_count: 0,
      //   });
      
      // if (businessCustomerError) throw businessCustomerError;
      
      Alert.alert(
        'Başarılı', 
        'Müşteri başarıyla eklendi.',
        [
          { 
            text: 'Tamam', 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      console.error('Müşteri eklenirken hata:', error);
      Alert.alert('Hata', 'Müşteri eklenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Müşteri</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Kişisel Bilgiler */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ad *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Müşteri adı"
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Soyad *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Müşteri soyadı"
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefon *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+90 555 123 45 67"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Doğum Tarihi</Text>
            <DateTimePickerCross
              value={birthday}
              onChange={(date) => setBirthday(date)}
              mode="date"
              display="default"
              placeholder="Doğum tarihi seçin"
              style={styles.dateInput}
            />
          </View>
        </View>
        
        {/* İşletme Ayarları */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>İşletme Ayarları</Text>
          
          {/* VIP Durumu */}
          <View style={styles.vipContainer}>
            <View style={styles.vipLabelContainer}>
              <Star size={18} color={isVip ? '#fbbf24' : '#94a3b8'} />
              <Text style={styles.vipLabel}>VIP Müşteri</Text>
            </View>
            <Switch
              value={isVip}
              onValueChange={setIsVip}
              trackColor={{ false: '#e5e7eb', true: '#c7d2fe' }}
              thumbColor={isVip ? '#6366f1' : '#f3f4f6'}
            />
          </View>
          
          <Text style={styles.vipDescription}>
            VIP müşteriler randevu onayı beklemeden doğrudan randevu alabilirler.
          </Text>
          
          {/* Notlar */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notlar</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Müşteri hakkında notlar..."
              multiline
              textAlignVertical="top"
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>
      
      {/* Kaydet Butonu */}
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={saveCustomer}
        disabled={isSaving}
      >
        <Save size={20} color="#ffffff" />
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </Text>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    height: 48,
  },
  textArea: {
    height: 100,
  },
  vipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vipLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginLeft: 8,
  },
  vipDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginBottom: 16,
  },
  saveButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
});
