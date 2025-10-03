import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';

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
    // Staff fields
    invitationCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  // Mevcut kullanıcı bilgilerini kontrol et
  useEffect(() => {
    const checkExistingUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Existing user found, pre-filling email:', user.email);
        setIsExistingUser(true);
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    };
    
    checkExistingUser();
  }, []);

  // Staff signup fonksiyonu - invitation code validation ile
  const handleStaffSignup = async () => {
    console.log('Staff signup başlatılıyor...');
    
    try {
      // 1. Email + invitation code eşleşmesi kontrol et
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('email', formData.email.trim())
        .eq('invitation_code', formData.invitationCode.trim())
        .eq('status', 'pending')
        .single();
      
      if (staffError || !staffData) {
        console.error('Staff validation error:', staffError);
        Alert.alert(
          '❌ Geçersiz Bilgiler',
          'Email veya bağlantı kodu hatalı. Lütfen işletmenizden aldığınız bilgileri kontrol edin.'
        );
        return;
      }
      
      console.log('Staff validation başarılı:', staffData.name);
      
      // 2. Supabase Auth hesabı oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            user_type: 'staff',
            name: staffData.name,
            phone: staffData.phone || ''
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (authError) {
        console.error('Auth signup error:', authError);
        Alert.alert('❌ Hesap Oluşturulamadı', authError.message);
        return;
      }
      
      console.log('Auth hesabı oluşturuldu:', authData.user?.id);
      console.log('Email confirmed:', authData.user?.email_confirmed_at);
      console.log('Confirmation sent at:', authData.user?.confirmation_sent_at);
      console.log('Email confirmation required:', !authData.user?.email_confirmed_at);
      
      // Email confirmation durumunu kontrol et
      if (!authData.user?.email_confirmed_at) {
        console.log('📧 Confirmation email gönderilmeli, kontrol edin!');
      } else {
        console.log('✅ Email zaten onaylanmış');
      }
      
      // 3. Manuel olarak users tablosuna kayıt ekle (trigger olmadığı için)
      const { error: userInsertError } = await supabase
        .from('users')
        .insert({
          id: authData.user?.id,
          email: formData.email.trim(),
          user_type: 'staff',
          name: staffData.name,
          phone: staffData.phone || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (userInsertError) {
        console.error('Users table insert error:', userInsertError);
        // Devam et, bu kritik değil (RLS policy nedeniyle hata olabilir)
        console.log('Users table insert failed, continuing with staff activation...');
      } else {
        console.log('Users table kayıt eklendi');
      }
      
      // 4. Staff kaydını active yap ve user_id'yi güncelle
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          status: 'active',
          user_id: authData.user?.id
        })
        .eq('id', staffData.id);
      
      if (updateError) {
        console.error('Staff update error:', updateError);
        Alert.alert('⚠️ Uyarı', 'Hesap oluşturuldu ancak aktivasyon tamamlanamadı.');
        return;
      }
      
      console.log('Staff kaydı aktifleştirildi');
      
      // 5. Email confirmation durumuna göre işlem yap
      if (!authData.user?.email_confirmed_at) {
        // Email confirmation gerekli
        console.log('📧 Email confirmation gerekli, login atlanıyor');
        Alert.alert(
          '🎉 Hesap Oluşturuldu!',
          `Merhaba ${staffData.name}!\n\n📧 Lütfen email adresinizi kontrol edin ve onay linkine tıklayın.\n\nOnay sonrası giriş yapabilirsiniz.`,
          [
            {
              text: 'Tamam',
              onPress: () => {
                router.replace('/auth/login');
              }
            }
          ]
        );
      } else {
        // Email zaten onaylanmış, auto-login yap
        console.log('✅ Email zaten onaylanmış, auto-login yapılıyor...');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password
        });
        
        if (signInError) {
          console.error('Auto login error:', signInError);
          Alert.alert(
            '🎉 Hesap Oluşturuldu!',
            `Merhaba ${staffData.name}!\n\nHesabınız başarıyla oluşturuldu. Lütfen giriş yapın.`,
            [
              {
                text: 'Giriş Yap',
                onPress: () => {
                  router.replace('/auth/login');
                }
              }
            ]
          );
        } else {
          // Login başarılı - Staff dashboard'a yönlendir
          console.log('Staff auto login başarılı, staff dashboard\'a yönlendiriliyor...');
          Alert.alert(
            '🎉 Hoş Geldiniz!',
            `Merhaba ${staffData.name}!\n\nHesabınız başarıyla oluşturuldu ve giriş yaptınız.`,
            [
              {
                text: 'Devam Et',
                onPress: () => {
                  // Staff dashboard'a yönlendir (business değil)
                  router.replace('/staff');
                }
              }
            ]
          );
        }
      }
      
    } catch (error: any) {
      console.error('Staff signup error:', error);
      Alert.alert('❌ Hata', `Kayıt sırasında bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
    }
  };

  // Mevcut kullanıcı için profil oluşturma fonksiyonu
  const createProfileForExistingUser = async (userData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    console.log('Creating profile for existing user:', user.id);

    // User profili oluştur
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        user_type: userData.user_type,
        name: userData.name,
        phone: userData.phone,
      });

    if (userError) {
      console.error('User profile creation error:', userError);
      throw userError;
    }

    console.log('User profile created successfully');

    // Tip-spesifik profil oluştur
    if (userData.user_type === 'customer') {
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          id: user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          birthday: userData.birthday,
        });

      if (customerError) {
        console.error('Customer profile creation error:', customerError);
        throw customerError;
      }
      console.log('Customer profile created successfully');
    } else if (userData.user_type === 'business') {
      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          id: user.id,
          name: userData.business_name,
          address: userData.address,
          phone: userData.phone,
          category: userData.category,
        });

      if (businessError) {
        console.error('Business profile creation error:', businessError);
        throw businessError;
      }
      console.log('Business profile created successfully');
    }

    // Profil oluşturduktan sonra ana sayfaya yönlendir
    if (userData.user_type === 'customer') {
      router.replace('/');
    } else {
      router.replace('/(business)');
    }
  };

  const handleRegister = async () => {
    // Mevcut kullanıcı için şifre kontrolü yapmayız
    if (!isExistingUser && (!formData.email || !formData.password)) {
      Alert.alert('Hata', 'Lütfen gerekli alanları doldurun');
      return;
    }

    if (!isExistingUser && formData.password !== formData.confirmPassword) {
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

    if (type === 'staff' && (!formData.email || !formData.invitationCode || !formData.password)) {
      Alert.alert('Hata', 'Lütfen email, bağlantı kodu ve şifre alanlarını doldurun');
      return;
    }

    setIsLoading(true);
    try {
      // Staff için özel signup akışı
      if (type === 'staff') {
        await handleStaffSignup();
        return;
      }

      const userData = {
        email: formData.email,
        password: formData.password,
        user_type: type as 'customer' | 'business' | 'staff',
        phone: type === 'customer' ? formData.phone : formData.businessPhone,
        name: type === 'customer' 
          ? `${formData.firstName} ${formData.lastName}`
          : formData.businessName,
        ...(type === 'customer' && {
          first_name: formData.firstName,
          last_name: formData.lastName,
          birthday: formData.birthday,
        }),
        ...(type === 'business' && {
          business_name: formData.businessName,
          address: formData.address,
          category: 'berber',
        }),
      };

      if (isExistingUser) {
        // Mevcut kullanıcı için sadece profil oluştur
        await createProfileForExistingUser(userData);
      } else {
        // Yeni kullanıcı için tam kayıt işlemi
        await register(userData);
      }
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      Alert.alert('Hata', `Kayıt olurken bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
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

          {!isExistingUser && (
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
          )}

          {!isExistingUser && (
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
          )}

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

          {type === 'staff' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bağlantı Kodu *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.invitationCode}
                  onChangeText={(value) => updateFormData('invitationCode', value)}
                  placeholder="İşletmenizden aldığınız bağlantı kodu"
                  autoCapitalize="characters"
                />
              </View>
              
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  📝 Bağlantı kodunuzu işletmenizden alabilirsiniz.
                </Text>
                <Text style={styles.infoText}>
                  🔐 Hesabınız oluşturduktan sonra direkt giriş yapabilirsiniz.
                </Text>
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
  infoBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#1e40af',
    lineHeight: 18,
    marginBottom: 4,
  },
});