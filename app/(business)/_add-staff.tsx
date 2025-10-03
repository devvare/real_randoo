import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Image, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Mail, Phone, Info, Tag, Briefcase } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function AddStaff() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('');
  const [canTakeAppointments, setCanTakeAppointments] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Gerçek hizmet verileri
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetchBusinessAndServices();
  }, [user]);

  const fetchBusinessAndServices = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 1. İşletme ID'sini al
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (businessError) {
        console.error('Business fetch error:', businessError);
        Alert.alert('Hata', 'İşletme bilgileri alınamadı.');
        return;
      }

      setBusinessId(businessData.id);

      // 2. İşletmenin hizmetlerini al
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('business_id', businessData.id)
        .eq('is_active', true)
        .order('name');

      if (servicesError) {
        console.error('Services fetch error:', servicesError);
        Alert.alert('Hata', 'Hizmetler alınamadı.');
        return;
      }

      // Hizmetleri selected: false ile işaretle
      const servicesWithSelection = (servicesData || []).map(service => ({
        ...service,
        selected: false
      }));

      setServices(servicesWithSelection);

    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImagePicker = () => {
    // Burada resim seçme işlemi yapılacak
    console.log('Resim seçme işlemi');
  };
  
  const toggleService = (id) => {
    setServices(services.map(service => 
      service.id === id ? { ...service, selected: !service.selected } : service
    ));
  };
  
  const handleSaveAndInvite = async () => {
    // Validasyon
    if (!name.trim()) {
      Alert.alert('Hata', 'Personel adı zorunludur.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Hata', 'E-mail adresi zorunludur.');
      return;
    }
    if (!position.trim()) {
      Alert.alert('Hata', 'Pozisyon bilgisi zorunludur.');
      return;
    }
    if (!businessId) {
      Alert.alert('Hata', 'İşletme bilgisi bulunamadı.');
      return;
    }

    // E-mail format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Hata', 'Geçerli bir e-mail adresi giriniz.');
      return;
    }

    try {
      setSaving(true);
      console.log('Staff oluşturma başlatılıyor...');

      // 1. Geçici şifre sistemi kaldırıldı - Staff self-signup sırasında kendi şifresi ile Auth'a kayıt olacak
      console.log('Staff invitation oluşturuluyor - Auth signup staff self-signup sırasında yapılacak');

      // 4. Invitation code oluştur (5 haneli rastgele sayı)
      const generateInvitationCode = () => {
        return Math.floor(10000 + Math.random() * 90000).toString(); // 10000-99999 arası
      };
      
      const invitationCode = generateInvitationCode();
      console.log('Invitation code oluşturuldu:', invitationCode);

      // 2. Seçilen hizmet ID'lerini hazırla
      const selectedServiceIds = services.filter(service => service.selected).map(service => service.id);
      
      // 3. İşletme ID'sini al
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (businessError) {
        console.error('Business fetch error:', businessError);
        Alert.alert('Hata', 'İşletme bilgileri alınamadı.');
        return;
      }

      console.log('İşletme ID:', businessData.id);

      // 4. Yeni UUID oluştur
      const newUserId = crypto.randomUUID();
      console.log('Yeni user ID:', newUserId);

      // 5. Users tablosuna ekle
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          email: email.trim(),
          user_type: 'staff',
          name: name.trim(),
          phone: phone.trim() || null
        });

      if (userError) {
        console.error('User insert error:', userError);
        Alert.alert('Hata', 'Kullanıcı kaydı oluşturulamadı: ' + userError.message);
        return;
      }

      console.log('User başarıyla eklendi');

      // 6. Staff tablosuna kaydet (invitation_code ile)
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .insert({
          user_id: newUserId,
          business_id: businessId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          position: position.trim(),
          can_take_appointments: canTakeAppointments,
          invitation_code: invitationCode,
          status: 'pending'
        })
        .select()
        .single();

      if (staffError) {
        console.error('Staff insert error:', staffError);
        Alert.alert('Hata', 'Staff kaydı oluşturulamadı: ' + staffError.message);
        return;
      }

      console.log('Staff başarıyla eklendi:', staffData.id);

      // 7. Hizmet atamalarını ekle
      if (selectedServiceIds.length > 0) {
        const serviceInserts = selectedServiceIds.map(serviceId => ({
          staff_id: staffData.id,
          service_id: serviceId
        }));

        const { error: servicesError } = await supabase
          .from('staff_services')
          .insert(serviceInserts);

        if (servicesError) {
          console.error('Staff services insert error:', servicesError);
          Alert.alert('Uyarı', 'Staff eklendi ancak hizmet ataması yapılamadı.');
        } else {
          console.log('Hizmet atamaları başarıyla eklendi');
        }
      }

      console.log('Staff oluşturma işlemi tamamlandı');

      // 8. Auth signup kaldırıldı - Staff self-signup sırasında kendi şifresi ile Auth'a kayıt olacak
      console.log('Staff database kaydı tamamlandı. Auth signup staff self-signup sırasında yapılacak.');
      
      const instructionText = 'Personele davet kodunu gönderin. Staff kendi şifresi ile kayıt olacak!';
      
      // Başarı sayfasına yönlendir
      router.push({
        pathname: '/(business)/staff-success',
        params: {
          name: name,
          email: email,
          invitationCode: invitationCode
        }
      });

    } catch (error) {
      console.error('Save staff error:', error);
      Alert.alert('Hata', 'Personel kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personel Ekle</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Hizmetler yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personel Ekle</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Randevu Alabilir</Text>
          <Switch
            value={canTakeAppointments}
            onValueChange={setCanTakeAppointments}
            trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
            thumbColor={canTakeAppointments ? '#6366f1' : '#94a3b8'}
          />
        </View>
        
        <View style={styles.profileImageContainer}>
          <TouchableOpacity style={styles.profileImageWrapper} onPress={handleImagePicker}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Camera size={32} color="#94a3b8" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Camera size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileImageText}>Personel Fotoğrafı</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>İsim Soyisim</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="İsim ve soyisim girin"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefon Numarası</Text>
            <View style={styles.inputWithIcon}>
              <Phone size={18} color="#64748b" />
              <TextInput
                style={styles.inputIcon}
                value={phone}
                onChangeText={setPhone}
                placeholder="Telefon numarası girin"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-posta Adresi</Text>
            <View style={styles.inputWithIcon}>
              <Mail size={18} color="#64748b" />
              <TextInput
                style={styles.inputIcon}
                value={email}
                onChangeText={setEmail}
                placeholder="E-posta adresi girin"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pozisyon</Text>
            <View style={styles.inputWithIcon}>
              <Briefcase size={18} color="#64748b" />
              <TextInput
                style={styles.inputIcon}
                value={position}
                onChangeText={setPosition}
                placeholder="Pozisyon girin"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Açıklama</Text>
            <View style={styles.inputWithIcon}>
              <Info size={18} color="#64748b" />
              <TextInput
                style={[styles.inputIcon, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Personel hakkında kısa açıklama"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Hizmetler</Text>
          <Text style={styles.sectionDescription}>
            Bu personelin sunabileceği hizmetleri seçin
          </Text>
          
          <View style={styles.servicesList}>
            {services.map((service) => (
              <TouchableOpacity 
                key={service.id} 
                style={[
                  styles.serviceItem, 
                  service.selected && styles.serviceItemSelected
                ]}
                onPress={() => toggleService(service.id)}
              >
                <Text 
                  style={[
                    styles.serviceItemText,
                    service.selected && styles.serviceItemTextSelected
                  ]}
                >
                  {service.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSaveAndInvite}
          disabled={saving}
        >
          {saving ? (
            <View style={styles.saveButtonContent}>
              <ActivityIndicator size="small" color="#ffffff" style={styles.saveButtonLoader} />
              <Text style={styles.saveButtonText}>Kaydediliyor...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Kaydet ve Davet Et</Text>
          )}
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileImageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  servicesSection: {
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 16,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  serviceItem: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serviceItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  serviceItemText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  serviceItemTextSelected: {
    color: '#3b82f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonLoader: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
});
