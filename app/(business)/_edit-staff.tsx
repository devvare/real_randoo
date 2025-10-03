import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Save, Trash2, Mail, Phone, MapPin } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function EditStaff() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Staff bilgileri
  const [staffData, setStaffData] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('');
  const [canTakeAppointments, setCanTakeAppointments] = useState(true);
  const [isActive, setIsActive] = useState(true);
  
  // Hizmetler
  const [allServices, setAllServices] = useState<any[]>([]);
  const [staffServices, setStaffServices] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchStaffData();
    }
  }, [id]);

  const fetchStaffData = async () => {
    if (!user || !id) return;

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

      // 2. Staff detaylarını al
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .eq('business_id', businessData.id)
        .single();

      if (staffError) {
        console.error('Staff fetch error:', staffError);
        Alert.alert('Hata', 'Personel bilgileri alınamadı.');
        router.back();
        return;
      }

      // 3. Staff bilgilerini state'e aktar
      setStaffData(staff);
      setName(staff.name || '');
      setEmail(staff.email || '');
      setPhone(staff.phone || '');
      setPosition(staff.position || '');
      setDescription(staff.description || '');
      setCanTakeAppointments(staff.can_book_appointments ?? true);
      setIsActive(staff.is_active ?? true);

      // 4. Tüm hizmetleri al
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('business_id', businessData.id)
        .eq('is_active', true)
        .order('name');

      if (servicesError) {
        console.error('Services fetch error:', servicesError);
      } else {
        setAllServices(services || []);
      }

      // 5. Staff'ın atanmış hizmetlerini al
      const { data: assignedServices, error: assignedError } = await supabase
        .from('staff_services')
        .select('service_id')
        .eq('staff_id', id);

      if (assignedError) {
        console.error('Assigned services fetch error:', assignedError);
      } else {
        setStaffServices(assignedServices?.map(s => s.service_id) || []);
      }

    } catch (error) {
      console.error('Fetch staff data error:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setStaffServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Personel adı boş olamaz.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Hata', 'E-mail adresi boş olamaz.');
      return;
    }

    try {
      setSaving(true);

      // 1. Staff bilgilerini güncelle
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          position: position.trim(),
          description: description.trim() || null,
          can_book_appointments: canTakeAppointments,
          is_active: isActive
        })
        .eq('id', id);

      if (updateError) {
        console.error('Staff update error:', updateError);
        Alert.alert('Hata', 'Personel bilgileri güncellenemedi: ' + updateError.message);
        return;
      }

      // 2. Mevcut hizmet atamalarını sil
      const { error: deleteError } = await supabase
        .from('staff_services')
        .delete()
        .eq('staff_id', id);

      if (deleteError) {
        console.error('Staff services delete error:', deleteError);
      }

      // 3. Yeni hizmet atamalarını ekle
      if (staffServices.length > 0) {
        const serviceInserts = staffServices.map(serviceId => ({
          staff_id: id,
          service_id: serviceId
        }));

        const { error: insertError } = await supabase
          .from('staff_services')
          .insert(serviceInserts);

        if (insertError) {
          console.error('Staff services insert error:', insertError);
          Alert.alert('Uyarı', 'Personel güncellendi ancak hizmet ataması yapılamadı.');
        }
      }

      Alert.alert(
        'Başarılı!',
        `${name} başarıyla güncellendi.`,
        [
          {
            text: 'Tamam',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Save staff error:', error);
      Alert.alert('Hata', 'Personel güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Personeli Sil',
      `${name} personelini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setSaving(true);

      // Staff'ı pasif yap (silme yerine)
      const { error: deactivateError } = await supabase
        .from('staff')
        .update({ is_active: false })
        .eq('id', id);

      if (deactivateError) {
        console.error('Staff deactivate error:', deactivateError);
        Alert.alert('Hata', 'Personel silinemedi: ' + deactivateError.message);
        return;
      }

      Alert.alert(
        'Başarılı!',
        'Personel başarıyla silindi.',
        [
          {
            text: 'Tamam',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Delete staff error:', error);
      Alert.alert('Hata', 'Personel silinirken bir hata oluştu.');
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
          <Text style={styles.headerTitle}>Personel Detayı</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Personel bilgileri yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!staffData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personel Detayı</Text>
        </View>
        <View style={styles.emptyContainer}>
          <User size={48} color="#94a3b8" />
          <Text style={styles.emptyTitle}>Personel bulunamadı</Text>
          <Text style={styles.emptyDescription}>
            Bu personel artık mevcut değil veya erişim izniniz yok.
          </Text>
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
        <Text style={styles.headerTitle}>Personel Detayı</Text>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
          disabled={saving}
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profil Fotoğrafı */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <User size={32} color="#94a3b8" />
            </View>
          </View>
          <Text style={styles.profileImageText}>Profil Fotoğrafı</Text>
        </View>

        {/* Temel Bilgiler */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ad Soyad *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Personel adı ve soyadı"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-mail *</Text>
            <View style={styles.inputWithIcon}>
              <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={email}
                onChangeText={setEmail}
                placeholder="personel@email.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefon</Text>
            <View style={styles.inputWithIcon}>
              <Phone size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={phone}
                onChangeText={setPhone}
                placeholder="0555 123 4567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pozisyon</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={position}
                onChangeText={setPosition}
                placeholder="Berber, Kuaför, vb."
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Personel hakkında kısa açıklama..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Ayarlar */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Randevu Alabilir</Text>
              <Text style={styles.switchDescription}>
                Müşteriler bu personelden randevu alabilir
              </Text>
            </View>
            <Switch
              value={canTakeAppointments}
              onValueChange={setCanTakeAppointments}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={canTakeAppointments ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Aktif</Text>
              <Text style={styles.switchDescription}>
                Personel aktif durumda
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={isActive ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Hizmetler */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Hizmetler</Text>
          <Text style={styles.sectionDescription}>
            Bu personelin verebileceği hizmetleri seçin.
          </Text>
          
          {allServices.length === 0 ? (
            <Text style={styles.noServicesText}>Henüz hizmet tanımlanmamış.</Text>
          ) : (
            <View style={styles.servicesList}>
              {allServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceItem,
                    staffServices.includes(service.id) && styles.serviceItemSelected
                  ]}
                  onPress={() => handleServiceToggle(service.id)}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={[
                      styles.serviceName,
                      staffServices.includes(service.id) && styles.serviceNameSelected
                    ]}>
                      {service.name}
                    </Text>
                    <Text style={[
                      styles.serviceDetails,
                      staffServices.includes(service.id) && styles.serviceDetailsSelected
                    ]}>
                      {service.duration} dk • ₺{service.price}
                    </Text>
                  </View>
                  <View style={[
                    styles.serviceCheckbox,
                    staffServices.includes(service.id) && styles.serviceCheckboxSelected
                  ]}>
                    {staffServices.includes(service.id) && (
                      <Text style={styles.serviceCheckmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Kaydet Butonu */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
            </>
          )}
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
    justifyContent: 'space-between',
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
  deleteButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 8,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e2e8f0',
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
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 18,
  },
  noServicesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    padding: 20,
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  serviceItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  serviceNameSelected: {
    color: '#1e40af',
  },
  serviceDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  serviceDetailsSelected: {
    color: '#3730a3',
  },
  serviceCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  serviceCheckboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  serviceCheckmark: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
