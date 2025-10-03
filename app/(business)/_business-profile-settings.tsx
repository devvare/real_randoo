import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Mail, Phone, Info, Tag } from 'lucide-react-native';

export default function BusinessProfileSettings() {
  // Örnek işletme verileri
  const [businessName, setBusinessName] = useState('Kuaför Ahmet');
  const [phone, setPhone] = useState('05551234567');
  const [email, setEmail] = useState('ahmet@example.com');
  const [description, setDescription] = useState('Modern ve profesyonel kuaför hizmetleri.');
  const [category, setCategory] = useState('Kuaför & Güzellik');
  const [profileImage, setProfileImage] = useState(null);
  
  const handleImagePicker = () => {
    // Burada resim seçme işlemi yapılacak
    console.log('Resim seçme işlemi');
  };
  
  const handleSave = () => {
    // Burada işletme profil bilgileri kaydedilecek
    console.log('İşletme profili kaydedildi');
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İşletme Profil Ayarları</Text>
      </View>

      <ScrollView style={styles.content}>
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
          <Text style={styles.profileImageText}>İşletme Fotoğrafı</Text>
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
            <Text style={styles.inputLabel}>İşletme Kategorisi</Text>
            <View style={styles.inputWithIcon}>
              <Tag size={18} color="#64748b" />
              <TextInput
                style={styles.inputIcon}
                value={category}
                onChangeText={setCategory}
                placeholder="İşletme kategorisi girin"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kısa Açıklama</Text>
            <View style={styles.inputWithIcon}>
              <Info size={18} color="#64748b" />
              <TextInput
                style={[styles.inputIcon, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="İşletmenizi kısaca tanımlayın"
                multiline
                numberOfLines={4}
              />
            </View>
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
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
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
