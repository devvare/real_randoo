import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Crown, UserPlus, Search, Calendar, Trash2, Edit3 } from 'lucide-react-native';

interface VIPCustomer {
  id: string;
  business_id: string;
  customer_id: string;
  vip_since: string;
  notes: string | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  appointment_count?: number;
  last_appointment?: string;
}

export default function VIPCustomersScreen() {
  const { user } = useAuth();
  const [vipCustomers, setVipCustomers] = useState<VIPCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [vipNotes, setVipNotes] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);

  useEffect(() => {
    fetchVIPCustomers();
    fetchAvailableCustomers();
  }, []);

  // İşletmenin kayıtlı müşterilerini getir
  const fetchAvailableCustomers = async () => {
    if (!user?.id) return;

    try {
      // İşletmenin business_customers tablosundan müşterileri getir
      const { data: customerData, error: customerError } = await supabase
        .from('business_customers')
        .select('id, customer_name, customer_email, customer_phone')
        .eq('business_id', user.id)
        .eq('is_active', true);

      if (customerError) {
        console.error('Müşteri listesi çekilemedi:', customerError);
        return;
      }

      // Müşteri verilerini uygun formata çevir
      const customers = customerData?.map(customer => ({
        id: customer.id,
        name: customer.customer_name,
        email: customer.customer_email,
        phone: customer.customer_phone
      })) || [];

      setAvailableCustomers(customers);
      console.log('Kayıtlı müşteriler:', customers);

    } catch (error) {
      console.error('Müşteri listesi çekme hatası:', error);
    }
  };

  const fetchVIPCustomers = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // VIP müşterileri business_customers ile join ederek çek
      const { data: vipData, error: vipError } = await supabase
        .from('business_vip_customers')
        .select(`
          id,
          customer_id,
          notes,
          created_at,
          business_customers!inner (
            customer_name,
            customer_phone,
            customer_email,
            total_appointments,
            cancelled_appointments,
            last_contact_date
          )
        `)
        .eq('business_id', user.id)
        .order('created_at', { ascending: false });

      if (vipError) {
        console.error('VIP müşteriler çekilemedi:', vipError);
        Alert.alert('Hata', 'VIP müşteriler yüklenemedi');
        return;
      }

      // VIP müşteri verilerini uygun formata çevir
      const vipCustomersWithDetails = (vipData || []).map(vip => ({
        id: vip.id,
        customer_id: vip.customer_id,
        notes: vip.notes,
        vip_since: vip.created_at,
        customer: {
          name: vip.business_customers.customer_name,
          phone: vip.business_customers.customer_phone,
          email: vip.business_customers.customer_email
        },
        appointmentCount: vip.business_customers.total_appointments,
        lastAppointment: vip.business_customers.last_contact_date ? {
          appointment_date: vip.business_customers.last_contact_date
        } : null
      }));

      setVipCustomers(vipCustomersWithDetails);
      console.log('VIP müşteriler:', vipCustomersWithDetails);

    } catch (error) {
      console.error('VIP müşteri çekme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addVIPCustomer = async (selectedCustomer: any) => {
    if (!selectedCustomer) {
      Alert.alert('Hata', 'Lütfen bir müşteri seçin');
      return;
    }

    try {
      setAddingCustomer(true);

      // VIP müşteri olarak ekle
      const { error: vipError } = await supabase
        .from('business_vip_customers')
        .insert({
          business_id: user?.id,
          customer_id: selectedCustomer.id,
          notes: vipNotes.trim() || null,
        });

      if (vipError) {
        if (vipError.code === '23505') {
          Alert.alert('Bilgi', 'Bu müşteri zaten VIP listesinde');
        } else {
          console.error('VIP müşteri ekleme hatası:', vipError);
          Alert.alert('Hata', 'VIP müşteri eklenemedi');
        }
        return;
      }

      Alert.alert('Başarılı', `${selectedCustomer.name} VIP müşteri olarak eklendi`);
      setShowAddModal(false);
      setCustomerName('');
      setVipNotes('');
      setShowCustomerList(false);
      fetchVIPCustomers();

    } catch (error) {
      console.error('VIP müşteri ekleme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setAddingCustomer(false);
    }
  };

  const removeVIPCustomer = async (vipId: string, customerName: string) => {
    Alert.alert(
      'VIP Müşteriyi Kaldır',
      `${customerName} adlı müşteriyi VIP listesinden kaldırmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('business_vip_customers')
                .delete()
                .eq('id', vipId);

              if (error) {
                console.error('VIP müşteri kaldırma hatası:', error);
                Alert.alert('Hata', 'VIP müşteri kaldırılamadı');
                return;
              }

              Alert.alert('Başarılı', 'VIP müşteri kaldırıldı');
              fetchVIPCustomers();

            } catch (error) {
              console.error('VIP müşteri kaldırma hatası:', error);
              Alert.alert('Hata', 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const filteredCustomers = vipCustomers.filter(vip =>
    vip.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vip.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>VIP müşteriler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Crown size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>VIP Müşteriler</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <UserPlus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>VIP Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Müşteri ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* VIP Customers List */}
      <ScrollView style={styles.customersList} showsVerticalScrollIndicator={false}>
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Crown size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Henüz VIP müşteri yok</Text>
            <Text style={styles.emptySubtitle}>
              Sadık müşterilerinizi VIP olarak ekleyerek özel ayrıcalıklar tanıyın
            </Text>
          </View>
        ) : (
          filteredCustomers.map((vip) => (
            <View key={vip.id} style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerInfo}>
                  <View style={styles.customerNameRow}>
                    <Crown size={16} color="#F59E0B" />
                    <Text style={styles.customerName}>{vip.customer?.name}</Text>
                  </View>
                  <Text style={styles.customerEmail}>{vip.customer?.email}</Text>
                  {vip.customer?.phone && (
                    <Text style={styles.customerPhone}>{vip.customer.phone}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeVIPCustomer(vip.id, vip.customer?.name || 'Müşteri')}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.customerStats}>
                <View style={styles.statItem}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.statLabel}>VIP Tarihi</Text>
                  <Text style={styles.statValue}>{formatDate(vip.vip_since)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Randevu Sayısı</Text>
                  <Text style={styles.statValue}>{vip.appointment_count}</Text>
                </View>
                {vip.last_appointment && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Son Randevu</Text>
                    <Text style={styles.statValue}>{formatDate(vip.last_appointment)}</Text>
                  </View>
                )}
              </View>

              {vip.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notlar:</Text>
                  <Text style={styles.notesText}>{vip.notes}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add VIP Customer Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>VIP Müşteri Ekle</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Müşteri Seç</Text>
              <TouchableOpacity
                style={styles.customerSelector}
                onPress={() => setShowCustomerList(!showCustomerList)}
              >
                <Text style={styles.customerSelectorText}>
                  {customerName || 'Kayıtlı müşterilerden seçin...'}
                </Text>
                <Text style={styles.customerSelectorArrow}>▼</Text>
              </TouchableOpacity>
              
              {showCustomerList && (
                <View style={styles.customerList}>
                  {availableCustomers
                    .filter(customer => 
                      !customerName || 
                      customer.name.toLowerCase().includes(customerName.toLowerCase())
                    )
                    .map((customer) => (
                    <TouchableOpacity
                      key={customer.id}
                      style={styles.customerItem}
                      onPress={() => {
                        setCustomerName(customer.name);
                        setShowCustomerList(false);
                      }}
                    >
                      <Text style={styles.customerItemName}>{customer.name}</Text>
                      <Text style={styles.customerItemEmail}>{customer.email}</Text>
                    </TouchableOpacity>
                  ))}
                  {availableCustomers.length === 0 && (
                    <Text style={styles.noCustomersText}>
                      Henüz kayıtlı müşteri yok
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>VIP Notları (Opsiyonel)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Özel notlar, indirim bilgileri vb..."
                value={vipNotes}
                onChangeText={setVipNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  const selectedCustomer = availableCustomers.find(c => c.name === customerName);
                  addVIPCustomer(selectedCustomer);
                }}
                disabled={addingCustomer || !customerName}
              >
                {addingCustomer ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>VIP Ekle</Text>
                )}
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
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  customersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 6,
  },
  customerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  removeButton: {
    padding: 8,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  customerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  customerSelectorText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  customerSelectorArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  customerList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  customerItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  customerItemEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  noCustomersText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
    color: '#6B7280',
  },
});
