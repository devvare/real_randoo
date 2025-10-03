import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Clock, DollarSign } from 'lucide-react-native';

export default function ServiceSettings() {
  const { user } = useAuth();
  
  // Örnek hizmet verileri
  const services = [
    {
      id: '1',
      name: 'Saç Kesimi',
      price: '150',
      duration: '30',
      description: 'Profesyonel saç kesimi hizmeti'
    },
    {
      id: '2',
      name: 'Saç Boyama',
      price: '350',
      duration: '90',
      description: 'Saç boyama ve bakım'
    },
    {
      id: '3',
      name: 'Sakal Tıraşı',
      price: '80',
      duration: '20',
      description: 'Profesyonel sakal şekillendirme'
    }
  ];
  
  const navigateToAddService = () => {
    router.push('/_create-service');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hizmet Ayarları</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.servicesList}>
          {services.map((service, index) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceItem}
              onPress={() => router.push({
                pathname: '/(business)/_edit-service',
                params: { id: service.id }
              })}
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceDetails}>
                  <View style={styles.serviceDetail}>
                    <DollarSign size={16} color="#64748b" />
                    <Text style={styles.serviceDetailText}>{service.price} ₺</Text>
                  </View>
                  <View style={styles.serviceDetail}>
                    <Clock size={16} color="#64748b" />
                    <Text style={styles.serviceDetailText}>{service.duration} dk</Text>
                  </View>
                </View>
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
              </View>
              <Text style={styles.serviceArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <TouchableOpacity style={styles.addButton} onPress={navigateToAddService}>
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
  servicesList: {
    marginBottom: 80, // Floating button için alan bırak
  },
  serviceItem: {
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
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceDetailText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginLeft: 4,
  },
  serviceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  serviceArrow: {
    fontSize: 24,
    color: '#94a3b8',
    marginLeft: 8,
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
