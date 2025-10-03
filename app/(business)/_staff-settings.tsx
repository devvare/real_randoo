import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Plus, User } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function StaffSettings() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinessAndStaff();
  }, [user]);

  const fetchBusinessAndStaff = async () => {
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
        return;
      }

      setBusinessId(businessData.id);

      // 2. Personel listesini al (staff tablosundan direkt çek)
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('business_id', businessData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (staffError) {
        console.error('Staff fetch error:', staffError);
        return;
      }

      setStaffList(staffData || []);

    } catch (error) {
      console.error('Fetch staff error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToAddStaff = () => {
    router.push('/_add-staff');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personel Ayarları</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Personel Listesi</Text>
        <Text style={styles.sectionDescription}>
          İşletmenizde çalışan personeli yönetin. Yeni personel eklemek için sağ alttaki + butonuna tıklayın.
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Personel listesi yükleniyor...</Text>
          </View>
        ) : staffList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <User size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Henüz personel eklenmemiş</Text>
            <Text style={styles.emptyDescription}>
              İlk personeli eklemek için sağ alttaki + butonuna tıklayın.
            </Text>
          </View>
        ) : (
          <View style={styles.staffList}>
            {staffList.map((staff) => (
              <TouchableOpacity 
                key={staff.id} 
                style={styles.staffCard}
                onPress={() => router.push({
                  pathname: '/_edit-staff',
                  params: { id: staff.id }
                })}
            >
              <View style={styles.staffPhotoContainer}>
                {staff.avatar ? (
                  <Image source={{ uri: staff.avatar }} style={styles.staffPhoto} />
                ) : (
                  <View style={styles.staffPhotoPlaceholder}>
                    <User size={24} color="#94a3b8" />
                  </View>
                )}
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{staff.name || 'İsimsiz Personel'}</Text>
                <Text style={styles.staffPosition}>{staff.position}</Text>
                {!staff.can_take_appointments && (
                  <Text style={styles.staffStatus}>Randevu alamaz</Text>
                )}
              </View>
              <Text style={styles.staffArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        )}
      </ScrollView>
      
      <TouchableOpacity style={styles.addButton} onPress={navigateToAddStaff}>
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  staffList: {
    marginBottom: 80, // Floating button için alan bırak
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  staffPhotoContainer: {
    marginRight: 16,
  },
  staffPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  staffPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  staffPosition: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  staffStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
    marginTop: 2,
  },
  staffArrow: {
    fontSize: 24,
    color: '#94a3b8',
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
