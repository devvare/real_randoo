import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Search, Plus, Users, ChevronDown, MessageCircle, UserPlus, Share2, X, Crown } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  added_date: string;
  last_contact_date: string | null;
  total_appointments: number;
  cancelled_appointments: number;
  is_vip: boolean;
  customer_notes: string | null;
}

export default function BusinessCustomers() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroups, setShowGroups] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [groupCounts, setGroupCounts] = useState({
    all: 0,
    new: 0,
    regular: 0,
    birthday: 0,
    distant: 0,
    'non-app': 0
  });

  useEffect(() => {
    fetchGroupCounts();
  }, [user?.id]);
  
  useEffect(() => {
    fetchCustomers();
  }, [selectedGroup, user?.id]);

  // Müşterileri getir
  const fetchCustomers = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('business_all_customers')
        .select('*')
        .eq('business_id', user.id);
      
      // Grup filtrelemesi
      switch (selectedGroup) {
        case 'new':
          query = supabase
            .from('business_new_customers')
            .select('*')
            .eq('business_id', user.id);
          break;
        case 'regular':
          query = supabase
            .from('business_regular_customers')
            .select('*')
            .eq('business_id', user.id);
          break;
        case 'birthday':
          query = supabase
            .from('business_birthday_customers')
            .select('*')
            .eq('business_id', user.id);
          break;
        case 'distant':
          query = supabase
            .from('business_distant_customers')
            .select('*')
            .eq('business_id', user.id);
          break;
        case 'non-app':
          query = supabase
            .from('business_non_users')
            .select('*')
            .eq('business_id', user.id);
          break;
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Müşteriler çekilemedi:', error);
        Alert.alert('Hata', 'Müşteriler yüklenemedi');
        return;
      }
      
      setCustomers(data || []);
      console.log('Müşteriler:', data);
      
    } catch (error) {
      console.error('Müşteri çekme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Grup sayılarını getir
  const fetchGroupCounts = async () => {
    if (!user?.id) return;
    
    try {
      const counts = { all: 0, new: 0, regular: 0, birthday: 0, distant: 0, 'non-app': 0 };
      
      // Her grup için ayrı sorgu
      const queries = [
        { key: 'all', table: 'business_all_customers' },
        { key: 'new', table: 'business_new_customers' },
        { key: 'regular', table: 'business_regular_customers' },
        { key: 'birthday', table: 'business_birthday_customers' },
        { key: 'distant', table: 'business_distant_customers' },
        { key: 'non-app', table: 'business_non_users' }
      ];
      
      for (const query of queries) {
        const { count, error } = await supabase
          .from(query.table)
          .select('*', { count: 'exact', head: true })
          .eq('business_id', user.id);
        
        if (!error && count !== null) {
          counts[query.key as keyof typeof counts] = count;
        }
      }
      
      setGroupCounts(counts);
    } catch (error) {
      console.error('Grup sayıları alınamadı:', error);
    }
  };

  const customerGroups = [
    { id: 'all', name: 'Tüm Müşteriler', count: groupCounts.all },
    { id: 'new', name: 'Yeni Müşteriler', count: groupCounts.new },
    { id: 'regular', name: 'Müdavimler', count: groupCounts.regular },
    { id: 'birthday', name: 'Doğum Günü Yaklaşanlar', count: groupCounts.birthday },
    { id: 'distant', name: 'Uzaklaşanlar', count: groupCounts.distant },
    { id: 'non-app', name: 'Randoo Kullanmayanlar', count: groupCounts['non-app'] },
  ];

  // Tarih formatlama fonksiyonu
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Hiçbir zaman';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} hafta önce`;
    return `${Math.ceil(diffDays / 30)} ay önce`;
  };

  // Filtrelenmiş müşteriler
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery))
  );

  // Müşteri profil sayfasına git
  const goToCustomerProfile = (customerId: string) => {
    router.push(`/(business)/customer-profile?id=${customerId}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Müşteriler</Text>

        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Müşteri ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity 
          style={styles.groupsButton}
          onPress={() => setShowGroups(!showGroups)}
        >
          <Users size={20} color="#6366f1" />
          <Text style={styles.groupsButtonText}>Müşteri Grupları</Text>
          <ChevronDown size={20} color="#6366f1" />
        </TouchableOpacity>

        {showGroups && (
          <View style={styles.groupsContainer}>
            {customerGroups.map((group) => (
              <TouchableOpacity 
                key={group.id} 
                style={[
                  styles.groupItem,
                  selectedGroup === group.id && styles.selectedGroupItem
                ]}
                onPress={() => {
                  setSelectedGroup(group.id);
                  setShowGroups(false);
                }}
              >
                <Text style={[
                  styles.groupName,
                  selectedGroup === group.id && styles.selectedGroupName
                ]}>{group.name}</Text>
                <Text style={[
                  styles.groupCount,
                  selectedGroup === group.id && styles.selectedGroupCount
                ]}>{group.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.customersList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Müşteriler yükleniyor...</Text>
            </View>
          ) : filteredCustomers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Müşteri bulunamadı</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Arama kriterlerinize uygun müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
              </Text>
            </View>
          ) : (
            filteredCustomers.map((customer) => (
              <TouchableOpacity 
                key={customer.id} 
                style={styles.customerCard}
                onPress={() => goToCustomerProfile(customer.id)}
              >
                <View style={styles.customerInfo}>
                  <View style={styles.customerNameContainer}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    {customer.is_vip && (
                      <View style={styles.vipBadge}>
                        <Crown size={16} color="#F59E0B" />
                        <Text style={styles.vipText}>VIP</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.customerPhone}>{customer.phone || 'Telefon yok'}</Text>
                  <Text style={styles.customerLastVisit}>Son iletişim: {formatDate(customer.last_contact_date)}</Text>
                  <View style={styles.customerStats}>
                    <Text style={styles.statText}>Randevu: {customer.total_appointments}</Text>
                    <Text style={styles.statText}>İptal: {customer.cancelled_appointments}</Text>
                  </View>
                </View>
                <View style={styles.customerActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      if (customer.phone) {
                        // WhatsApp mesajı gönderme işlemi
                        const phoneNumber = customer.phone.replace(/\s+/g, '').replace('+', '');
                        const url = `https://wa.me/${phoneNumber}`;
                        Alert.alert(
                          'WhatsApp',
                          `${customer.name} ile WhatsApp üzerinden iletişime geçmek istiyor musunuz?`,
                          [
                            { text: 'İptal', style: 'cancel' },
                            { text: 'Mesaj Gönder', onPress: () => {
                              // Web'de window.open, mobilde Linking kullanılacak
                              if (typeof window !== 'undefined') {
                                window.open(url, '_blank');
                              }
                            }}
                          ]
                        );
                      } else {
                        Alert.alert('Uyarı', 'Bu müşterinin telefon numarası kayıtlı değil');
                      }
                    }}
                  >
                    <MessageCircle size={20} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB Menüsü */}
      {showFabMenu && (
        <View style={styles.addMenu}>
          <TouchableOpacity 
            style={styles.addMenuItem} 
            onPress={() => {
              setShowFabMenu(false);
              router.push('/(business)/add-customer');
            }}
          >
            <UserPlus size={20} color="#6366f1" style={styles.addMenuIcon} />
            <Text style={styles.addMenuText}>Müşteri Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addMenuItem} 
            onPress={() => {
              setShowFabMenu(false);
              router.push('/(business)/_invite-customer');
            }}
          >
            <Share2 size={20} color="#6366f1" style={styles.addMenuIcon} />
            <Text style={styles.addMenuText}>Davet Et</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB Butonu */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowFabMenu(!showFabMenu)}
      >
        {showFabMenu ? (
          <X size={24} color="#ffffff" />
        ) : (
          <Plus size={24} color="#ffffff" />
        )}
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
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  groupsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  groupsButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6366f1',
    flex: 1,
  },
  groupsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderRadius: 6,
  },
  selectedGroupItem: {
    backgroundColor: '#EEF2FF',
  },
  groupName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  selectedGroupName: {
    color: '#6366f1',
    fontFamily: 'Inter-SemiBold',
  },
  groupCount: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6366f1',
  },
  selectedGroupCount: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
  },
  customersList: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
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
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  customerCard: {
    flexDirection: 'row',
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
  customerInfo: {
    flex: 1,
  },
  customerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginRight: 8,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  vipText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  customerPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  customerLastVisit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    marginBottom: 8,
  },
  customerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6366f1',
  },
  customerActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addMenu: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 150,
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  addMenuText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  addMenuIcon: {
    marginRight: 8,
  },
});
