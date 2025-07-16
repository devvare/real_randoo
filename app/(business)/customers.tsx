import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Search, Plus, Users, ChevronDown, MessageCircle } from 'lucide-react-native';

export default function BusinessCustomers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroups, setShowGroups] = useState(false);

  const customerGroups = [
    { id: 'all', name: 'Tüm Müşteriler', count: 156 },
    { id: 'new', name: 'Yeni Müşteriler', count: 12 },
    { id: 'regular', name: 'Müdavimler', count: 45 },
    { id: 'birthday', name: 'Doğum Günü Yaklaşanlar', count: 8 },
    { id: 'distant', name: 'Uzaklaşanlar', count: 23 },
    { id: 'non-app', name: 'Randoo Kullanmayanlar', count: 67 },
  ];

  const mockCustomers = [
    { id: '1', name: 'Ayşe Kaya', phone: '+90 555 123 45 67', lastVisit: '2 gün önce' },
    { id: '2', name: 'Mehmet Yılmaz', phone: '+90 555 234 56 78', lastVisit: '1 hafta önce' },
    { id: '3', name: 'Fatma Demir', phone: '+90 555 345 67 89', lastVisit: '3 gün önce' },
  ];

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
              <TouchableOpacity key={group.id} style={styles.groupItem}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupCount}>{group.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.customersList}>
          {mockCustomers.map((customer) => (
            <TouchableOpacity key={customer.id} style={styles.customerCard}>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerPhone}>{customer.phone}</Text>
                <Text style={styles.customerLastVisit}>Son ziyaret: {customer.lastVisit}</Text>
              </View>
              <View style={styles.customerActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <MessageCircle size={20} color="#6366f1" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
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
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  },
  groupName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  groupCount: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6366f1',
  },
  content: {
    flex: 1,
  },
  customersList: {
    padding: 16,
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
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
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
  },
  customerActions: {
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
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
});