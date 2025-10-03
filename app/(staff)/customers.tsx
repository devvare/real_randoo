import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Search, Phone, Calendar, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function StaffCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffInfo, setStaffInfo] = useState<any>(null);

  // Staff'ın müşterilerini çek (sadece randevu aldığı müşteriler)
  const fetchStaffCustomers = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Önce staff bilgilerini çek
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (staffError) {
        console.error('Staff bilgileri çekilemedi:', staffError);
        Alert.alert('Hata', 'Staff bilgileri yüklenemedi.');
        return;
      }

      setStaffInfo(staffData);
      
      // Bu staff'a randevu veren müşterileri çek
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          appointments!inner (
            id,
            appointment_date,
            start_time,
            status,
            services (name)
          )
        `)
        .eq('appointments.staff_id', staffData.id)
        .order('name', { ascending: true });

      if (customersError) {
        console.error('Müşteriler çekilemedi:', customersError);
        Alert.alert('Hata', 'Müşteri bilgileri yüklenemedi.');
      } else {
        // Müşterileri unique yap (aynı müşteri birden fazla randevu almış olabilir)
        const uniqueCustomers = customersData?.reduce((acc: any[], customer) => {
          const existingCustomer = acc.find(c => c.id === customer.id);
          if (!existingCustomer) {
            acc.push({
              ...customer,
              appointmentCount: customer.appointments?.length || 0,
              lastAppointment: customer.appointments?.[0]?.appointment_date || null
            });
          }
          return acc;
        }, []) || [];

        setCustomers(uniqueCustomers);
        setFilteredCustomers(uniqueCustomers);
        console.log('Staff müşterileri yüklendi:', uniqueCustomers.length);
      }

    } catch (error) {
      console.error('Staff customers fetch error:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffCustomers();
  }, [user?.id]);

  // Arama filtresi
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  // Müşteri detayına git
  const handleCustomerPress = (customer: any) => {
    // Staff sadece müşteri bilgilerini görebilir, düzenleyemez
    Alert.alert(
      customer.name || 'Müşteri',
      `📞 ${customer.phone || 'Telefon yok'}\n📧 ${customer.email || 'Email yok'}\n📅 ${customer.appointmentCount} randevu`,
      [
        { text: 'Tamam', style: 'default' }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Müşteriler yükleniyor...</Text>
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
        <Text style={styles.headerTitle}>Müşterilerim</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Müşteri ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Toplam {filteredCustomers.length} müşteri
        </Text>
      </View>

      {/* Customers List */}
      <ScrollView style={styles.customersList}>
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Müşteri bulunamadı' : 'Henüz müşteriniz yok'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Farklı bir arama deneyin' : 'Randevu aldığınız müşteriler burada görünecek'}
            </Text>
          </View>
        ) : (
          filteredCustomers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              style={styles.customerCard}
              onPress={() => handleCustomerPress(customer)}
            >
              <View style={styles.customerAvatar}>
                <User size={24} color="#6b7280" />
              </View>
              
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>
                  {customer.name || 'İsimsiz Müşteri'}
                </Text>
                <Text style={styles.customerPhone}>
                  {customer.phone || 'Telefon yok'}
                </Text>
                {customer.email && (
                  <Text style={styles.customerEmail}>
                    {customer.email}
                  </Text>
                )}
              </View>
              
              <View style={styles.customerStats}>
                <View style={styles.appointmentBadge}>
                  <Calendar size={14} color="#2563eb" />
                  <Text style={styles.appointmentCount}>
                    {customer.appointmentCount}
                  </Text>
                </View>
                {customer.lastAppointment && (
                  <Text style={styles.lastAppointment}>
                    Son: {new Date(customer.lastAppointment).toLocaleDateString('tr-TR')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  customersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  customerStats: {
    alignItems: 'flex-end',
  },
  appointmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  appointmentCount: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  lastAppointment: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
});
