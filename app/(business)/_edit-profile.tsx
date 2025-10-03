import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { Camera, ArrowLeft } from 'lucide-react-native';

export default function EditBusinessProfile() {
  const { user } = useAuth();
  
  const [businessName, setBusinessName] = useState(user?.business?.business_name || '');
  const [address, setAddress] = useState(user?.business?.address || '');
  const [category, setCategory] = useState(user?.business?.category || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [description, setDescription] = useState(user?.business?.description || '');

  const handleSave = async () => {
    // Burada işletme profilini güncelleme işlemi yapılacak
    // Şimdilik sadece geri dönüyoruz
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İşletme Profilini Düzenle</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {user?.business?.photo_url ? (
              <Image 
                source={{ uri: user.business.photo_url }} 
                style={styles.businessPhoto} 
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={32} color="#94a3b8" />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Fotoğraf Değiştir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>İşletme Adı</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="İşletme adını girin"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adres</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="İşletme adresini girin"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kategori</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="İşletme kategorisini girin"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefon</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Telefon numaranızı girin"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta adresinizi girin"
              keyboardType="email-address"
              editable={false} // E-posta değiştirilemez
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="İşletmeniz hakkında kısa bir açıklama girin"
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
  photoSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
  },
  businessPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  changePhotoText: {
    color: '#ffffff',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
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
