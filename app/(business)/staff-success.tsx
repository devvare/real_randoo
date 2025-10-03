import React from 'react';
import { View, Text, TouchableOpacity, Alert, Share, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

export default function StaffSuccessPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // URL parametrelerinden staff bilgilerini al
  const staffName = params.name as string;
  const staffEmail = params.email as string;
  const invitationCode = params.invitationCode as string;

  // Paylaşılacak mesaj
  const shareMessage = `🎉 Staff Hesabın Oluşturuldu!

Merhaba ${staffName},

İşletmemizde staff hesabın oluşturuldu! Kayıt işlemini tamamlamak için:

🔴 1. ADIM - Email Onayı:
📧 ${staffEmail} adresine onay maili gönderildi
✅ Önce email'indeki onay linkine tıkla

🔵 2. ADIM - Kayıt:
📱 Uygulamayı aç ve "Personel Hesabı" seç
📧 Email: ${staffEmail}
🔢 Davet Kodu: ${invitationCode}
🔐 Yeni Şifre: Kendi belirlediğin şifre

⚠️ Önemli: Önce email onayı, sonra kayıt!

İyi çalışmalar! 🚀`;

  // Kopyala fonksiyonu
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(shareMessage);
      Alert.alert('✅ Kopyalandı!', 'Mesaj panoya kopyalandı. Artık staff\'a gönderebilirsin.');
    } catch (error) {
      Alert.alert('❌ Hata', 'Kopyalama işlemi başarısız oldu.');
    }
  };

  // Paylaş fonksiyonu
  const handleShare = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: `${staffName} - Staff Hesabı Hazır!`
      });
    } catch (error) {
      Alert.alert('❌ Hata', 'Paylaşım işlemi başarısız oldu.');
    }
  };

  // WhatsApp direkt gönder
  const handleWhatsApp = () => {
    const whatsappMessage = encodeURIComponent(shareMessage);
    const whatsappUrl = `whatsapp://send?text=${whatsappMessage}`;
    
    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('❌ WhatsApp Bulunamadı', 'WhatsApp uygulaması yüklü değil.');
      }
    });
  };

  // SMS direkt gönder
  const handleSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
    
    Linking.canOpenURL(smsUrl).then(supported => {
      if (supported) {
        Linking.openURL(smsUrl);
      } else {
        Alert.alert('❌ SMS Gönderilemedi', 'SMS uygulaması açılamadı.');
      }
    });
  };

  return (
    <View className="flex-1 bg-gray-50 p-6">
      {/* Header */}
      <View className="items-center mb-8 mt-8">
        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          ✅ Staff Kaydı Başarılı!
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          {staffName} hesabı oluşturuldu
        </Text>
      </View>

      {/* Staff Bilgileri */}
      <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          📋 Staff Bilgileri
        </Text>
        
        <View className="space-y-3">
          <View className="flex-row items-center">
            <Ionicons name="person" size={20} color="#6B7280" />
            <Text className="ml-3 text-gray-700">
              <Text className="font-medium">İsim:</Text> {staffName}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="mail" size={20} color="#6B7280" />
            <Text className="ml-3 text-gray-700">
              <Text className="font-medium">Email:</Text> {staffEmail}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="key" size={20} color="#6B7280" />
            <Text className="ml-3 text-gray-700">
              <Text className="font-medium">Bağlantı Kodu:</Text> {invitationCode}
            </Text>
          </View>
        </View>
      </View>

      {/* Paylaşılacak Mesaj Önizleme */}
      <View className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
        <Text className="text-sm font-medium text-blue-900 mb-2">
          📤 Staff'a Gönderilecek Mesaj:
        </Text>
        <Text className="text-sm text-blue-800 leading-5" numberOfLines={8}>
          {shareMessage}
        </Text>
      </View>

      {/* Paylaş Butonları */}
      <View className="space-y-3 mb-6">
        {/* Kopyala */}
        <TouchableOpacity
          onPress={handleCopy}
          className="bg-gray-800 rounded-xl p-4 flex-row items-center justify-center"
        >
          <Ionicons name="copy" size={20} color="white" />
          <Text className="text-white font-medium ml-2">📋 Kopyala</Text>
        </TouchableOpacity>

        {/* Paylaş */}
        <TouchableOpacity
          onPress={handleShare}
          className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center"
        >
          <Ionicons name="share" size={20} color="white" />
          <Text className="text-white font-medium ml-2">📤 Paylaş</Text>
        </TouchableOpacity>

        {/* WhatsApp ve SMS */}
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={handleWhatsApp}
            className="flex-1 bg-green-600 rounded-xl p-4 flex-row items-center justify-center"
          >
            <Ionicons name="logo-whatsapp" size={20} color="white" />
            <Text className="text-white font-medium ml-2">WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSMS}
            className="flex-1 bg-purple-600 rounded-xl p-4 flex-row items-center justify-center"
          >
            <Ionicons name="chatbubble" size={20} color="white" />
            <Text className="text-white font-medium ml-2">SMS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ana Sayfa Butonu */}
      <TouchableOpacity
        onPress={() => router.push('/(business)')}
        className="bg-gray-100 rounded-xl p-4 flex-row items-center justify-center mt-4"
      >
        <Ionicons name="home" size={20} color="#374151" />
        <Text className="text-gray-700 font-medium ml-2">🏠 Ana Sayfa</Text>
      </TouchableOpacity>
    </View>
  );
}
