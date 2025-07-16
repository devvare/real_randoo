import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock, MapPin } from 'lucide-react-native';

export default function CustomerCalendar() {
  const mockAppointment = {
    id: '1',
    businessName: 'Salon Güzellik',
    businessImage: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400',
    date: '2025-01-15',
    time: '14:30',
    service: 'Saç Kesimi',
    isUpcoming: true,
    address: 'Kadıköy, İstanbul',
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Randevularım</Text>
      </View>

      <ScrollView style={styles.content}>
        {mockAppointment.isUpcoming && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yaklaşan Randevu</Text>
            <TouchableOpacity style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName}>{mockAppointment.businessName}</Text>
                  <View style={styles.addressContainer}>
                    <MapPin size={14} color="#6b7280" />
                    <Text style={styles.address}>{mockAppointment.address}</Text>
                  </View>
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>2 saat içinde</Text>
                </View>
              </View>
              
              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#6366f1" />
                  <Text style={styles.detailText}>
                    {new Date(mockAppointment.date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color="#6366f1" />
                  <Text style={styles.detailText}>{mockAppointment.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geçmiş Randevular</Text>
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>Henüz geçmiş randevu bulunmuyor</Text>
          </View>
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 4,
  },
  timeContainer: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#92400e',
  },
  appointmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
});