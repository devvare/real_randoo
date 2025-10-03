import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ArrowLeft, Copy, MessageCircle, Download } from 'lucide-react-native';

export default function ShareBusinessProfile() {
  const { user } = useAuth();
  
  // Örnek profil linki ve QR kodu
  const profileLink = `https://randoo.app/business/${user?.id}`;
  const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(profileLink);
  
  const [linkCopied, setLinkCopied] = useState(false);
  
  const copyToClipboard = () => {
    // Kopyalama işlevi burada gerçekleştirilecek
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };
  
  const shareViaWhatsApp = async () => {
    try {
      await Share.share({
        message: `İşletmemizi Randoo'da ziyaret edin: ${profileLink}`,
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };
  
  const shareBySMS = async () => {
    try {
      await Share.share({
        message: `İşletmemizi Randoo'da ziyaret edin: ${profileLink}`,
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };
  
  const downloadQRCode = () => {
    // QR kodunu indirme işlevi burada gerçekleştirilecek
    console.log('QR kodu indiriliyor...');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İşletme Profilini Paylaş</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.linkSection}>
          <Text style={styles.sectionTitle}>Profil Linki</Text>
          <View style={styles.linkContainer}>
            <Text style={styles.link} numberOfLines={1}>{profileLink}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
              <Copy size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
          {linkCopied && <Text style={styles.copiedText}>Link kopyalandı!</Text>}
        </View>
        
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Paylaş</Text>
          <View style={styles.shareOptions}>
            <TouchableOpacity style={styles.shareOption} onPress={shareViaWhatsApp}>
              <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
                <MessageCircle size={24} color="#ffffff" />
              </View>
              <Text style={styles.shareOptionText}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareOption} onPress={shareBySMS}>
              <View style={[styles.shareIconContainer, { backgroundColor: '#3b82f6' }]}>
                <MessageCircle size={24} color="#ffffff" />
              </View>
              <Text style={styles.shareOptionText}>SMS</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>QR Kodu</Text>
          <View style={styles.qrContainer}>
            <Image 
              source={{ uri: qrCodeUrl }}
              style={styles.qrCode}
            />
          </View>
          
          <TouchableOpacity style={styles.downloadButton} onPress={downloadQRCode}>
            <Download size={20} color="#ffffff" />
            <Text style={styles.downloadButtonText}>QR Kodunu İndir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.whatsappShareButton} onPress={shareViaWhatsApp}>
            <MessageCircle size={20} color="#ffffff" />
            <Text style={styles.whatsappShareText}>WhatsApp'tan Paylaş</Text>
          </TouchableOpacity>
        </View>
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  linkSection: {
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
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
  },
  link: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  copyButton: {
    padding: 8,
  },
  copiedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10b981',
    marginTop: 8,
    textAlign: 'center',
  },
  shareSection: {
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
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  shareOption: {
    alignItems: 'center',
  },
  shareIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  qrSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    alignItems: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 16,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  downloadButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
  whatsappShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  whatsappShareText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
});
