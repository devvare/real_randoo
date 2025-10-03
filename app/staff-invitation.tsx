import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock, Key, User, CheckCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function StaffInvitation() {
  const [invitationCode, setInvitationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAcceptInvitation = async () => {
    // Validasyon
    if (!invitationCode.trim()) {
      Alert.alert('Hata', 'Davet kodu boş olamaz.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Hata', 'Şifre boş olamaz.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    try {
      setLoading(true);
      console.log('Davet kabul ediliyor...', { invitationCode });

      // Davet kabul et
      const { data, error } = await supabase.rpc('accept_staff_invitation', {
        p_invitation_code: invitationCode.trim().toUpperCase(),
        p_password: password
      });

      if (error) {
        console.error('Invitation acceptance error:', error);
        Alert.alert('Hata', 'Davet kabul edilemedi: ' + error.message);
        return;
      }

      if (!data.success) {
        Alert.alert('Hata', data.error || 'Davet kabul edilemedi.');
        return;
      }

      console.log('Davet başarıyla kabul edildi:', data);

      Alert.alert(
        'Hoş Geldiniz! 🎉',
        `Hesabınız başarıyla oluşturuldu!\n\nArtık staff hesabınızla giriş yapabilirsiniz.`,
        [
          {
            text: 'Giriş Yap',
            onPress: () => router.replace('/auth/login')
          }
        ]
      );

    } catch (error) {
      console.error('Accept invitation error:', error);
      Alert.alert('Hata', 'Davet kabul edilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Daveti</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Mail size={32} color="#3b82f6" />
          </View>
          <Text style={styles.heroTitle}>Staff Hesabı Oluştur</Text>
          <Text style={styles.heroDescription}>
            İşletmenizden aldığınız davet kodu ile hesabınızı aktifleştirin.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Davet Kodu *</Text>
            <View style={styles.inputWithIcon}>
              <Key size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={invitationCode}
                onChangeText={setInvitationCode}
                placeholder="ABC12345"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                maxLength={8}
              />
            </View>
            <Text style={styles.inputHint}>
              İşletmenizden aldığınız 8 haneli davet kodunu girin.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Yeni Şifre *</Text>
            <View style={styles.inputWithIcon}>
              <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={password}
                onChangeText={setPassword}
                placeholder="En az 6 karakter"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre Tekrar *</Text>
            <View style={styles.inputWithIcon}>
              <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Şifrenizi tekrar girin"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <CheckCircle size={20} color="#059669" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Hesap Oluşturulduktan Sonra</Text>
            <Text style={styles.infoDescription}>
              • Staff paneline erişim sağlayacaksınız{'\n'}
              • Randevu takvimini görüntüleyebileceksiniz{'\n'}
              • Müşteri bilgilerine erişebileceksiniz{'\n'}
              • Atanmış hizmetleri yönetebileceksiniz
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleAcceptInvitation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <User size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Hesabı Aktifleştir</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.loginLink} 
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.loginLinkText}>
            Zaten hesabınız var mı? <Text style={styles.loginLinkBold}>Giriş Yapın</Text>
          </Text>
        </TouchableOpacity>
      </View>
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
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  inputWithIconText: {
    paddingLeft: 48,
  },
  inputHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#047857',
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  loginLinkBold: {
    fontFamily: 'Inter-SemiBold',
    color: '#3b82f6',
  },
});
