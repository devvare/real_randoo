import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, User, Phone, Mail, Lock, LogOut, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function StaffProfile() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  
  // Form state - Şifre değiştirme için
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Staff bilgilerini çek
  const fetchStaffProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Staff bilgilerini çek
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (staffError) {
        console.error('Staff bilgileri çekilemedi:', staffError);
        Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
        return;
      }

      // İşletme bilgilerini ayrı olarak çek
      let businessData = null;
      if (staffData.business_id) {
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('business_name, address, description, category')
          .eq('id', staffData.business_id)
          .single();

        if (businessError) {
          console.error('İşletme bilgileri çekilemedi:', businessError);
        } else {
          businessData = business;
        }
      }

      setStaffInfo(staffData);
      setBusinessInfo(businessData);
      
      console.log('Staff profil bilgileri yüklendi:', staffData.name);

    } catch (error) {
      console.error('Staff profile fetch error:', error);
      Alert.alert('Hata', 'Profil yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffProfile();
  }, [user?.id]);

  // Profil güncelle (sadece ek bilgiler)
  const handleSaveProfile = async () => {
    if (!staffInfo?.id) return;

    try {
      setSaving(true);
      
      // Staff tablosunda sadece mevcut kolonları güncelle
      const { error: staffUpdateError } = await supabase
        .from('staff')
        .update({
          position: staffInfo.position // Sadece position güncellenebilir, diğer alanlar şimdilik kaldırıldı
        })
        .eq('id', staffInfo.id);

      if (staffUpdateError) {
        console.error('Staff update error:', staffUpdateError);
        Alert.alert('Hata', 'Profil güncellenemedi.');
        return;
      }

      Alert.alert('✅ Başarılı', 'Ek bilgileriniz güncellendi.');
      await fetchStaffProfile(); // Refresh data

    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert('Hata', 'Profil kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Şifre değiştir
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Tüm şifre alanlarını doldurun.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      setSaving(true);

      // Önce mevcut şifre ile giriş dene (doğrulama için)
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyError) {
        Alert.alert('Hata', 'Mevcut şifreniz yanlış.');
        return;
      }

      // Şifre güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        Alert.alert('Hata', 'Şifre güncellenemedi.');
        return;
      }

      Alert.alert('✅ Başarılı', 'Şifreniz güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Hata', 'Şifre değiştirilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Logout
  const handleLogout = () => {
    console.log('Logout butonuna tıklandı - TouchableOpacity');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      console.log('Profile çıkış onaylandı - Çıkış yapılıyor...');
      setShowLogoutModal(false);
      await logout();
      console.log('Profile çıkış başarılı');
    } catch (error) {
      console.error('Profile çıkış hatası:', error);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu: ' + error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Profil yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Ayarları</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* İşletme Bilgileri (Salt Okunur) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İşletme Bilgileri</Text>
          <Text style={styles.sectionSubtitle}>Bu bilgiler işletme tarafından belirlenir</Text>
          <View style={styles.readOnlyCard}>
            <TouchableOpacity 
              style={styles.readOnlyItem}
              onPress={() => {
                if (staffInfo?.business_id) {
                  console.log('İşletme profiline yönlendiriliyor:', staffInfo.business_id);
                  // Staff için özel business profile sayfası (müşteri olarak değil)
                  router.push(`/(staff)/business-profile/${staffInfo.business_id}`);
                }
              }}
            >
              <Text style={styles.readOnlyLabel}>İşletme</Text>
              <View style={styles.businessLinkContainer}>
                <Text style={styles.readOnlyValue}>{businessInfo?.business_name || 'Bilinmiyor'}</Text>
                <Text style={styles.businessLinkText}>Profili Görüntüle →</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>İsim</Text>
              <Text style={styles.readOnlyValue}>{staffInfo?.name || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>Pozisyon</Text>
              <Text style={styles.readOnlyValue}>{staffInfo?.position || 'Personel'}</Text>
            </View>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>İş Telefonu</Text>
              <Text style={styles.readOnlyValue}>{staffInfo?.phone || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>İş Email</Text>
              <Text style={styles.readOnlyValue}>{staffInfo?.email || user.email}</Text>
            </View>
          </View>
        </View>

        {/* Not: Ek bilgiler özelliği için staff tablosuna yeni kolonlar eklenmesi gerekiyor */}

        {/* Password Change */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mevcut Şifre</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Mevcut şifreniz"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Yeni Şifre</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Yeni şifreniz"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Yeni Şifre Tekrar</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Yeni şifrenizi tekrar girin"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.passwordButton}
              onPress={handleChangePassword}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Lock size={20} color="#ffffff" />
                  <Text style={styles.passwordButtonText}>Şifre Değiştir</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContainer}>
            <Text style={styles.logoutModalTitle}>Çıkış Yap</Text>
            <Text style={styles.logoutModalText}>
              Hesabınızdan çıkmak istediğinizden emin misiniz?
            </Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity 
                style={styles.logoutCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.logoutCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutConfirmButton}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutConfirmButtonText}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  passwordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  // Yeni stiller
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  readOnlyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  readOnlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  readOnlyLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  readOnlyValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  businessLinkContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  businessLinkText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: 2,
  },
  // Logout Modal Styles
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  logoutModalText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  logoutCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  logoutCancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  logoutConfirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
