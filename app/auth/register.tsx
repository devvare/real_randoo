import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Register() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    // Customer fields
    firstName: '',
    lastName: '',
    phone: '',
    birthday: '',
    // Business fields
    businessName: '',
    address: '',
    businessPhone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Hata', 'Lütfen gerekli alanları doldurun');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (type === 'customer' && (!formData.firstName || !formData.lastName || !formData.phone)) {
      Alert.alert('Hata', 'Lütfen tüm gerekli alanları doldurun');
      return;
    }

    if (type === 'business' && (!formData.businessName || !formData.address || !formData.businessPhone)) {
      Alert.alert('Hata', 'Lütfen tüm gerekli alanları doldurun');
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        type,
        phone: type === 'customer' ? formData.phone : formData.businessPhone,
        name: type === 'customer' 
          ? `${formData.firstName} ${formData.lastName}`
          : formData.businessName,
        ...(type === 'customer' && {
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthday: formData.birthday,
        }),
        ...(type === 'business' && {
          businessName: formData.businessName,
          address: formData.address,
          category: 'berber',
          rating: 0,
          workingHours: {},
          services: [],
          staff: [],
        }),
      };

      await register(userData);
    } catch (error) {
      Alert.alert('Hata', 'Kayıt olurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {type === 'customer' ? 'Müşteri Hesabı' : 'İşletme Hesabı'}
          </Text>
          <Text style={styles.subtitle}>Hesap bilgilerinizi girin</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              placeholder="E-posta adresiniz"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              placeholder="Şifreniz"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre Tekrar *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              placeholder="Şifrenizi tekrar girin"
              secureTextEntry
            />
          </View>

          {type === 'customer' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ad *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', value)}
                  placeholder="Adınız"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Soyad *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                  placeholder="Soyadınız"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefon *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  placeholder="+90 555 123 45 67"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Doğum Günü</Text>
                <TextInput
                  style={styles.input}
                  value={formData.birthday}
                  onChangeText={(value) => updateFormData('birthday', value)}
                  placeholder="GG.AA.YYYY"
                />
              </View>
            </>
          )}

          {type === 'business' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>İşletme Adı *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.businessName}
                  onChangeText={(value) => updateFormData('businessName', value)}
                  placeholder="İşletmenizin adı"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adres *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(value) => updateFormData('address', value)}
                  placeholder="İşletmenizin adresi"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefon *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.businessPhone}
                  onChangeText={(value) => updateFormData('businessPhone', value)}
                  placeholder="+90 555 123 45 67"
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
            <Text style={styles.linkText}>Zaten hesabınız var mı? Giriş yapın</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#f9fafb',
  },
  button: {
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#6366f1',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});