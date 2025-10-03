import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Bell, Calendar, MoreHorizontal, Coffee, Clock, CheckCircle, XCircle, AlertCircle, User, LogOut } from 'lucide-react-native';
import { CalendarList } from 'react-native-calendars';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  const weekDays = ['Pz', 'Pt', 'Sl', 'Çr', 'Pr', 'Cu', 'Ct'];
  const currentWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i + 1);
    return date;
  });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 9;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Staff bilgilerini ve randevularını çek
  const fetchStaffData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      console.log('Staff bilgileri çekiliyor, user_id:', user.id);
      
      // Staff bilgilerini çek
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
      console.log('Staff bilgileri yüklendi:', staffData.name);
      
      // Business bilgilerini ayrı sorgu ile çek
      if (staffData.business_id) {
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', staffData.business_id)
          .single();
        
        if (!businessError && businessData) {
          setBusinessInfo(businessData);
          console.log('Business bilgileri yüklendi:', businessData);
        } else {
          console.error('Business bilgileri çekilemedi:', businessError);
        }
      }
      
      // Sadece bu staff'a atanan randevuları çek
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('staff_id', staffData.id)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (appointmentsError) {
        console.error('Randevular çekilemedi:', appointmentsError);
      } else {
        setAppointments(appointmentsData || []);
        console.log('Staff randevuları yüklendi:', appointmentsData?.length || 0);
      }

    } catch (error) {
      console.error('Staff data fetch error:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [user?.id]);

  // Seçili tarihteki randevuları filtrele
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  // Randevu durumu rengi
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6366f1';
      default: return '#6b7280';
    }
  };

  // Randevu durumu ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle;
      case 'pending': return Clock;
      case 'cancelled': return XCircle;
      case 'completed': return CheckCircle;
      default: return AlertCircle;
    }
  };

  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Staff logout
  const handleLogout = () => {
    console.log('Logout butonuna tıklandı');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      console.log('Çıkış onaylandı - Çıkış yapılıyor...');
      console.log('Logout fonksiyonu:', typeof logout);
      setShowLogoutModal(false);
      const result = await logout();
      console.log('Logout sonucu:', result);
      console.log('Çıkış başarılı');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu: ' + error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!staffInfo) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>Staff bilgileri bulunamadı</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStaffData}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Merhaba</Text>
          <Text style={styles.nameText}>{staffInfo.name}</Text>
          <Text style={styles.businessText}>{businessInfo?.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => {
              console.log('Profil butonuna tıklandı');
              router.push('/(staff)/profile');
            }}
          >
            <User size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => {
              console.log('Logout butonuna tıklandı - TouchableOpacity');
              handleLogout();
            }}
            activeOpacity={0.7}
          >
            <LogOut size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{selectedDateAppointments.length}</Text>
          <Text style={styles.statLabel}>Bugün</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {appointments.filter(apt => apt.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {appointments.filter(apt => apt.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>Onaylı</Text>
        </View>
      </View>

      {/* Week Calendar */}
      <View style={styles.weekContainer}>
        <View style={styles.weekHeader}>
          <Text style={styles.weekTitle}>Haftalık Takvim</Text>
          <TouchableOpacity 
            style={styles.monthButton}
            onPress={() => setShowMonthCalendar(true)}
          >
            <Calendar size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll}>
          {currentWeek.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const dayAppointments = getAppointmentsForDate(date);
            
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayCard, isSelected && styles.selectedDayCard]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayName, isSelected && styles.selectedDayName]}>
                  {weekDays[index]}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.selectedDayNumber]}>
                  {date.getDate()}
                </Text>
                {dayAppointments.length > 0 && (
                  <View style={styles.appointmentDot}>
                    <Text style={styles.appointmentCount}>{dayAppointments.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

        {/* Appointments Timeline */}
        <View style={styles.appointmentsContainer}>
          <View style={styles.appointmentsHeader}>
            <Text style={styles.appointmentsTitle}>
              {selectedDate.toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'long',
                weekday: 'long'
              })} Randevuları
            </Text>
            <TouchableOpacity 
              style={styles.customersButton}
              onPress={() => {
                console.log('Müşterilerim butonuna tıklandı');
                router.push('/(staff)/customers');
              }}
            >
              <Text style={styles.customersButtonText}>Müşterilerim</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineContainer}>
          <View style={styles.timeColumn}>
            {timeSlots.map((time) => (
              <View key={time} style={styles.timeSlot}>
                <Text style={styles.timeSlotText}>{time}</Text>
                <View style={styles.timeLine} />
                <View style={styles.timeSlotQuarter}>
                  <View style={styles.quarterLine} />
                </View>
                <View style={styles.timeSlotQuarter}>
                  <View style={styles.quarterLine} />
                </View>
                <View style={styles.timeSlotQuarter}>
                  <View style={styles.quarterLine} />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.appointmentsArea}>
            {selectedDateAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Coffee size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>Bu tarihte randevunuz yok</Text>
                <Text style={styles.emptyStateSubtext}>Güzel bir dinlenme günü!</Text>
              </View>
            ) : (
              selectedDateAppointments.map((appointment) => {
                const StatusIcon = getStatusIcon(appointment.status);
                const startHour = parseInt(appointment.start_time.split(':')[0]);
                const startMinute = parseInt(appointment.start_time.split(':')[1]);
                const topPosition = (startHour - 9) * 80 + (startMinute / 60) * 80 + 40;
                const duration = appointment.services?.duration || 60;
                const height = (duration / 60) * 80;
                
                return (
                  <TouchableOpacity
                    key={appointment.id}
                    style={[
                      styles.appointmentTimelineCard,
                      { top: topPosition, height: Math.max(height, 60) },
                      appointment.status === 'pending' && styles.appointmentCardPending,
                      appointment.status === 'confirmed' && styles.appointmentCardConfirmed,
                      appointment.status === 'cancelled' && styles.appointmentCardCancelled,
                      appointment.status === 'completed' && styles.appointmentCardCompleted
                    ]}
                  >
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentTimeText}>{appointment.start_time}</Text>
                      <View style={styles.appointmentStatusIcon}>
                        <StatusIcon 
                          size={16} 
                          color={getStatusColor(appointment.status)} 
                        />
                      </View>
                    </View>
                    <Text style={styles.appointmentCustomer}>
                      {appointment.customers?.name || 'Müşteri'}
                    </Text>
                    <Text style={styles.appointmentService}>
                      {appointment.services?.name || 'Hizmet'}
                    </Text>
                    <Text style={styles.appointmentDuration}>
                      {duration} dk
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          </View>
        </View>
      </ScrollView>

      {/* Month Calendar Modal */}
      <Modal
        visible={showMonthCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Takvim</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowMonthCalendar(false)}
            >
              <XCircle size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <CalendarList
            onDayPress={(day: any) => {
              const newDate = new Date(day.dateString);
              setSelectedDate(newDate);
              setShowMonthCalendar(false);
            }}
            markedDates={{
              [selectedDate.toISOString().split('T')[0]]: {
                selected: true,
                selectedColor: '#2563eb'
              }
            }}
            theme={{
              selectedDayBackgroundColor: '#2563eb',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#2563eb',
              arrowColor: '#2563eb',
            }}
          />
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContainer}>
            <Text style={styles.logoutModalTitle}>Çıkış Yap</Text>
            <Text style={styles.logoutModalText}>
              Hesabınızdan çıkmak istediğinizden emin misiniz?
            </Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity 
                style={styles.logoutCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.logoutCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutConfirmButton}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutConfirmButtonText}>Çıkış Yap</Text>
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
    backgroundColor: '#f8fafc',
  },
  mainScrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  businessText: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  weekContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  weekScroll: {
    flexDirection: 'row',
  },
  dayCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    minWidth: 60,
  },
  selectedDayCard: {
    backgroundColor: '#2563eb',
  },
  dayName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedDayName: {
    color: '#ffffff',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  selectedDayNumber: {
    color: '#ffffff',
  },
  appointmentDot: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  appointmentCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  appointmentsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 600, // Timeline için minimum yükseklik
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  appointmentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  customersButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  customersButtonText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentsList: {
    flex: 1,
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
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  appointmentTime: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  appointmentDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  serviceName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  appointmentStatus: {
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Timeline styles
  timelineScrollView: {
    flex: 1,
  },
  timelineContainer: {
    position: 'relative',
    minHeight: 960, // 12 saatlik slot için (12 * 80px)
    paddingLeft: 90, // timeColumn için yer bırak
    paddingRight: 10,
  },
  timeColumn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 80,
    zIndex: 1,
  },
  appointmentsArea: {
    position: 'relative',
    flex: 1,
    minHeight: 960,
  },
  timeSlot: {
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    position: 'relative',
  },
  timeSlotText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  timeLine: {
    position: 'absolute',
    left: 80,
    top: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  timeSlotQuarter: {
    height: 20,
    position: 'relative',
  },
  quarterLine: {
    position: 'absolute',
    left: 80,
    top: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  appointmentTimelineCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
    marginHorizontal: 4,
  },
  appointmentCardPending: {
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  appointmentCardConfirmed: {
    borderLeftColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  appointmentCardCancelled: {
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  appointmentCardCompleted: {
    borderLeftColor: '#6366f1',
    backgroundColor: '#f8faff',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  appointmentStatusIcon: {
    marginLeft: 8,
  },
  appointmentCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  appointmentService: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  appointmentDuration: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // Logout Modal Styles
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  logoutModalText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  logoutCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
