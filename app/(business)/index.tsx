import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Bell, Calendar, MoreHorizontal, Plus, X, Coffee, Clock, CheckCircle, XCircle, AlertCircle, Crown, Users, Scissors, TrendingUp, Calendar as CalendarIcon, User } from 'lucide-react-native';
import { CalendarList } from 'react-native-calendars';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '18:00'
  });
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalAppointments: 0,
    totalRevenue: 0
  });

  const weekDays = ['Pz', 'Pt', 'Sl', 'Çr', 'Pr', 'Cu', 'Ct'];
  // Bugünden başlayarak 7 günlük bir dizi oluştur
  const currentWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i); // Bugünden başla
    return date;
  });

  // Working hours'a göre zaman dilimlerini oluştur
  const timeSlots = React.useMemo(() => {
    // Çalışma saatlerini parse et
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    
    // Saat aralığını hesapla (endHour dahil değil)
    const hoursCount = endHour - startHour;
    
    return Array.from({ length: hoursCount }, (_, i) => {
      const hour = i + startHour;
      return `${hour.toString().padStart(2, '0')}:00`;
    });
  }, [workingHours]);
  
  // Saat formatını düzenle (HH:MM:SS -> HH:MM)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Eğer saat formatı HH:MM:SS ise, sadece HH:MM kısmını al
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    
    return timeString;
  };

  // Müşteri bilgilerini çek
  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return null;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('id', customerId)
        .single();
        
      if (error) {
        console.error('Müşteri bilgisi çekilemedi:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Müşteri çekme hatası:', error);
      return null;
    }
  };
  
  // Randevuları çek ve istatistikleri hesapla
  const fetchAppointments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      console.log('Randevular çekiliyor, business_id:', user.id);
      
      // Randevuları yeni mimariyle çek
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          services (name, duration, price)
        `)
        .eq('business_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (appointmentsError) {
        console.error('Randevular çekilemedi:', appointmentsError);
        Alert.alert('Hata', 'Randevular yüklenemedi');
        return;
      }

      // Yeni mimaride müşteri bilgisi customer_info JSONB kolonunda
      const appointmentsWithCustomers = (appointmentsData || []).map(appointment => {
        // customer_info JSONB kolonundan müşteri bilgisini al
        let customerInfo = {};
        
        // customer_info farklı formatlarda gelebilir, kontrol et
        if (appointment.customer_info) {
          if (typeof appointment.customer_info === 'string') {
            try {
              customerInfo = JSON.parse(appointment.customer_info);
            } catch (e) {
              console.error('Customer info JSON parse error:', e);
            }
          } else {
            customerInfo = appointment.customer_info;
          }
        }
        
        // Müşteri adı için alternatif alanları kontrol et
        let customerName = customerInfo.name || customerInfo.full_name || customerInfo.fullName;
        
        // Müşteri ID'si varsa ve adı yoksa, müşteri tablosundan çekmeyi dene
        if (!customerName && appointment.customer_id) {
          // Burada asenkron çağrı yapamayız, bu yüzden şimdilik ID'yi göster
          customerName = `Müşteri #${appointment.customer_id.substring(0, 8)}`;
        }
        
        return {
          ...appointment,
          customer: {
            name: customerName || 'Müşteri',
            email: customerInfo.email || '',
            phone: customerInfo.phone || customerInfo.phoneNumber || ''
          }
        };
      });

      // Eksik müşteri bilgilerini çek
      const appointmentsWithFullCustomerInfo = await Promise.all(
        appointmentsWithCustomers.map(async (appointment) => {
          // Eğer müşteri adı yoksa ve customer_id varsa, müşteri bilgilerini çek
          if (appointment.customer?.name === 'Müşteri' && appointment.customer_id) {
            const customerDetails = await fetchCustomerDetails(appointment.customer_id);
            if (customerDetails?.name) {
              return {
                ...appointment,
                customer: {
                  ...appointment.customer,
                  name: customerDetails.name,
                  email: customerDetails.email || appointment.customer.email,
                  phone: customerDetails.phone || appointment.customer.phone
                }
              };
            }
          }
          return appointment;
        })
      );
      
      setAppointments(appointmentsWithFullCustomerInfo);
      
      // Bugünün tarihi
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Bugünkü randevular
      const todayApps = appointmentsWithFullCustomerInfo.filter(app => {
        const appDate = new Date(app.appointment_date);
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() === today.getTime();
      });
      setTodayAppointments(todayApps);
      
      // Gelecek randevular (bugün hariç)
      const upcomingApps = appointmentsWithFullCustomerInfo.filter(app => {
        const appDate = new Date(app.appointment_date);
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() > today.getTime();
      }).slice(0, 5); // En fazla 5 tane göster
      setUpcomingAppointments(upcomingApps);
      
      // Bekleyen randevu sayısını hesapla
      const pending = appointmentsWithFullCustomerInfo.filter(app => app.status === 'pending').length;
      setPendingCount(pending);
      
      // İstatistikleri hesapla
      // 1. Toplam müşteri sayısı (unique customer_id'ler)
      const uniqueCustomers = new Set();
      appointmentsWithFullCustomerInfo.forEach(app => {
        if (app.customer_id) uniqueCustomers.add(app.customer_id);
      });
      
      // 2. Toplam randevu sayısı
      const totalApps = appointmentsWithFullCustomerInfo.length;
      
      // 3. Toplam gelir (onaylanmış randevulardan)
      let revenue = 0;
      appointmentsWithFullCustomerInfo.forEach(app => {
        if (app.status === 'confirmed' && app.services?.price) {
          revenue += parseFloat(app.services.price) || 0;
        }
      });
      
      setStats({
        totalCustomers: uniqueCustomers.size,
        totalAppointments: totalApps,
        totalRevenue: revenue
      });
      
    } catch (error) {
      console.error('Randevu çekme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Bildirimleri çek
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('business_notifications')
        .select('id, is_read')
        .eq('business_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Bildirimler çekilemedi:', error);
        return;
      }

      setNotificationCount((data || []).length);
      
    } catch (error) {
      console.error('Bildirim çekme hatası:', error);
    }
  };

  // Çalışma saatlerini çek
  const fetchWorkingHours = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Çalışma saatleri çekiliyor, business_id:', user.id);
      
      const { data, error } = await supabase
        .from('working_hours')
        .select('day_of_week, open_time, close_time, is_open')
        .eq('business_id', user.id)
        .order('day_of_week');
      
      if (error) {
        console.error('Çalışma saatleri çekilemedi:', error);
        return;
      }
      
      // Seçili günün çalışma saatlerini bul
      const selectedDay = selectedDate.getDay();
      const selectedDayWorkingHours = data?.find(wh => wh.day_of_week === selectedDay);
      
      if (selectedDayWorkingHours && selectedDayWorkingHours.is_open) {
        setWorkingHours({
          start: selectedDayWorkingHours.open_time,
          end: selectedDayWorkingHours.close_time
        });
        console.log('Seçili günün çalışma saatleri:', selectedDayWorkingHours);
      } else {
        // Seçili gün kapalı veya çalışma saati bulunamadı
        // Varsayılan saatleri kullan
        setWorkingHours({
          start: '09:00',
          end: '18:00'
        });
        console.log('Seçili gün kapalı veya çalışma saati bulunamadı');
      }
      
    } catch (error) {
      console.error('Çalışma saatleri çekme hatası:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchWorkingHours();
    fetchNotifications();
  }, [user]);

  // Seçili tarih değiştiğinde çalışma saatlerini güncelle
  useEffect(() => {
    fetchWorkingHours();
  }, [selectedDate]);

  // Seçili tarihteki randevuları filtrele
  const selectedDateAppointments = appointments.filter(app => {
    const appDate = new Date(app.appointment_date);
    return appDate.toDateString() === selectedDate.toDateString();
  });

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddMenuPress = () => {
    setShowAddMenu(!showAddMenu);
  };

  // Randevu onaylama
  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Randevu onaylama hatası:', error);
        Alert.alert('Hata', 'Randevu onaylanamadı');
        return;
      }

      Alert.alert('Başarılı', 'Randevu onaylandı');
      fetchAppointments(); // Listeyi yenile
    } catch (error) {
      console.error('Randevu onaylama hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    }
  };

  // Randevu reddetme
  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Randevu reddetme hatası:', error);
        Alert.alert('Hata', 'Randevu reddedilemedi');
        return;
      }

      Alert.alert('Başarılı', 'Randevu reddedildi');
      fetchAppointments(); // Listeyi yenile
    } catch (error) {
      console.error('Randevu reddetme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    }
  };

  // Randevu detayına git
  const handleAppointmentPress = (appointment: any) => {
    console.log('Randevu detayına yönlendiriliyor, id:', appointment.id);
    router.push(`/_appointment-detail?id=${appointment.id}`);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const handleMonthCalendarPress = () => {
    setShowMonthCalendar(true);
  };
  
  const handleMonthCalendarClose = () => {
    setShowMonthCalendar(false);
  };
  
  const handleMonthCalendarSelect = (day: any) => {
    const newDate = new Date(day.timestamp);
    setSelectedDate(newDate);
    setShowMonthCalendar(false);
  };
  
  const handleNotificationsPress = () => {
    router.push('/_notifications');
  };
  
  const handleCalendarSettingsPress = () => {
    router.push('/_calendar-color-settings');
  };
  
  const handleNewAppointmentPress = () => {
    router.push('/_new-appointment');
    setShowAddMenu(false);
  };
  
  const handleTimeReservationPress = () => {
    router.push('/_time-reservation');
    setShowAddMenu(false);
  };
  
  const handleBreakTimePress = () => {
    router.push('/_break-time');
    setShowAddMenu(false);
  };
  
  const handleVIPCustomersPress = () => {
    router.push('/vip-customers');
  };

  // Randevu kartı render fonksiyonu
  const renderAppointmentCard = (appointment: any) => (
    <TouchableOpacity 
      key={appointment.id} 
      style={[
        styles.appointmentCard,
        appointment.status === 'pending' && styles.appointmentCardPending,
        appointment.status === 'confirmed' && styles.appointmentCardConfirmed,
        appointment.status === 'cancelled' && styles.appointmentCardCancelled
      ]}
      onPress={() => handleAppointmentPress(appointment)}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentTimeContainer}>
          <Clock size={14} color="#6366f1" />
          <Text style={styles.appointmentTime}>{formatTime(appointment.start_time)}</Text>
        </View>
        <View style={styles.appointmentStatus}>
          {appointment.status === 'pending' && <AlertCircle size={16} color="#f59e0b" />}
          {appointment.status === 'confirmed' && <CheckCircle size={16} color="#10b981" />}
          {appointment.status === 'cancelled' && <XCircle size={16} color="#ef4444" />}
        </View>
      </View>
      <View style={styles.appointmentCustomerRow}>
        <Text style={styles.appointmentCustomer}>
          {appointment.customer?.name || 'Müşteri'}
        </Text>
        {appointment.is_vip_appointment && (
          <Crown size={16} color="#F59E0B" />
        )}
      </View>
      <Text style={styles.appointmentService}>
        {appointment.services?.name || 'Hizmet'}
      </Text>
      
      {appointment.status === 'pending' && (
        <View style={styles.appointmentActions}>
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={(e) => {
              e.stopPropagation();
              handleApproveAppointment(appointment.id);
            }}
          >
            <CheckCircle size={14} color="#ffffff" />
            <Text style={styles.approveButtonText}>Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRejectAppointment(appointment.id);
            }}
          >
            <XCircle size={14} color="#ffffff" />
            <Text style={styles.rejectButtonText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  // İstatistik kartı render fonksiyonu
  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIconContainer}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerButton} onPress={handleNotificationsPress}>
            <Bell size={24} color="#1e293b" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>İşletme Paneli</Text>
            <Text style={styles.headerSubtitle}>{formatDate(new Date())}</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={handleCalendarSettingsPress}>
            <MoreHorizontal size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity 
            style={[styles.viewToggleButton, viewMode === 'cards' && styles.viewToggleButtonActive]} 
            onPress={() => setViewMode('cards')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'cards' && styles.viewToggleTextActive]}>Kart Görünümü</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewToggleButton, viewMode === 'calendar' && styles.viewToggleButtonActive]} 
            onPress={() => setViewMode('calendar')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'calendar' && styles.viewToggleTextActive]}>Takvim Görünümü</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : viewMode === 'calendar' ? (
          // Takvim Görünümü
          <View style={styles.calendarContainer}>
            {/* Haftalık Görünüm */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll} contentContainerStyle={styles.weekScrollContent}>
              {currentWeek.map((date, index) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayButton, isSelected && styles.dayButtonActive]}
                    onPress={() => handleDatePress(date)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                      {weekDays[date.getDay()]}
                    </Text>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {/* Ay Seçimi */}
            <TouchableOpacity style={styles.monthSelector} onPress={handleMonthCalendarPress}>
              <Text style={styles.monthSelectorText}>
                {selectedDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
              </Text>
              <CalendarIcon size={16} color="#6366f1" />
            </TouchableOpacity>
            
            {/* Günlük Randevu Görünümü - Sürekli Zaman Çizelgesi */}
            <View style={styles.dayCalendar}>
              <View style={styles.continuousTimeline}>
                <View style={styles.timeColumn}>
                  {timeSlots.map((time, index) => {
                    const hour = parseInt(time.split(':')[0]);
                    return (
                      <React.Fragment key={index}>
                        {/* Saat gösterimi */}
                        <Text style={[styles.timeText, {position: 'absolute', top: index * 60 - 4.5}]}>{time}</Text>
                        
                        {/* Dakika gösterimleri */}
                        <Text style={[styles.quarterTimeText, {position: 'absolute', top: index * 60 + 15 - 4.5, left: 20}]}>15</Text>
                        <Text style={[styles.quarterTimeText, {position: 'absolute', top: index * 60 + 30 - 4.5, left: 20}]}>30</Text>
                        <Text style={[styles.quarterTimeText, {position: 'absolute', top: index * 60 + 45 - 4.5, left: 20}]}>45</Text>
                      </React.Fragment>
                    );
                  })}
                </View>
                
                <View style={styles.timelineContent}>
                  {timeSlots.map((time, index) => (
                    <React.Fragment key={index}>
                      {/* Saat çizgisi - düz çizgi */}
                      <View style={[styles.timeLine, {position: 'absolute', top: index * 60}]} />
                      
                      {/* 15 dakikalık aralıklar için kesikli çizgiler */}
                      <View style={[styles.quarterLine, {position: 'absolute', top: index * 60 + 15, left: 0, right: 0}]} />
                      <View style={[styles.quarterLine, {position: 'absolute', top: index * 60 + 30, left: 0, right: 0}]} />
                      <View style={[styles.quarterLine, {position: 'absolute', top: index * 60 + 45, left: 0, right: 0}]} />
                    </React.Fragment>
                  ))}
                </View>
              </View>
              
              {/* Randevuları göster */}
              {selectedDateAppointments.map((appointment) => {
                const startTime = appointment.start_time.split(':');
                const startHour = parseInt(startTime[0]);
                const startMinute = parseInt(startTime[1] || '0');
                
                // Çalışma saati başlangıcını al
                const workingStartHour = parseInt(workingHours.start.split(':')[0]);
                const workingStartMinute = parseInt(workingHours.start.split(':')[1] || '0');
                
                // Pozisyon hesaplama - randevu kutusunun üst kenarı randevu saatine denk gelecek
                const hourDiff = startHour - workingStartHour;
                const minuteDiff = startMinute - workingStartMinute;
                
                // Toplam dakika farkını hesapla ve pozisyonu belirle
                const totalMinutesDiff = (hourDiff * 60) + minuteDiff;
                
                // Her dakika tam olarak 1px yüksekliğinde
                // Saatler ilerledikçe oluşan kaymayı önlemek için dakika başına 1px kullan
                const totalMinutes = (hourDiff * 60) + minuteDiff;
                const topPosition = totalMinutes;
                
                // Hassas konumlandırma için offset düzeltmesi - gerekirse ayarla
                const positionOffset = 0;
                
                // Süre hesaplama (varsayılan 60 dakika)
                const duration = appointment.services?.duration || 60;
                // Her dakika 1px olacak şekilde yüksekliği ayarla
                const height = duration;
                
                const getAppointmentStyle = (status: string, serviceTypeParam?: string) => {
                  // Durum bazlı stil
                  let style: any = { ...styles.calendarAppointmentCard };
                  
                  // Durum bazlı kenar rengi
                  switch(status) {
                    case 'confirmed':
                      style.borderLeftColor = '#10b981'; // Yeşil
                      break;
                    case 'pending':
                      style.borderLeftColor = '#f59e0b'; // Turuncu
                      break;
                    case 'cancelled':
                      style.borderLeftColor = '#ef4444'; // Kırmızı
                      style.opacity = 0.7;
                      break;
                    default:
                      style.borderLeftColor = '#8b5cf6'; // Mor
                  }
                  
                  // Modern ve %30 transparan rastgele renkler
                  const modernColors = [
                    'rgba(59, 130, 246, 0.3)',  // Mavi
                    'rgba(239, 68, 68, 0.3)',   // Kırmızı
                    'rgba(16, 185, 129, 0.3)',  // Yeşil
                    'rgba(245, 158, 11, 0.3)',  // Amber
                    'rgba(236, 72, 153, 0.3)',   // Pembe
                    'rgba(20, 184, 166, 0.3)',   // Turkuaz
                    'rgba(139, 92, 246, 0.3)',   // Mor
                    'rgba(249, 115, 22, 0.3)',   // Turuncu
                    'rgba(99, 102, 241, 0.3)',   // İndigo
                    'rgba(79, 70, 229, 0.3)',    // Koyu Mor
                    'rgba(6, 182, 212, 0.3)',    // Cyan
                    'rgba(5, 150, 105, 0.3)',    // Zümrüt
                  ];
                  
                  // Randevu ID'sine göre sabit bir renk seçimi yap
                  // Bu sayede aynı randevu her zaman aynı renkte görünür
                  const appointmentId = appointment.id || '';
                  const colorIndex = Math.abs(appointmentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % modernColors.length;
                  style.backgroundColor = modernColors[colorIndex];
                  
                  return style;
                };
                
                const cardStyle = {
                  ...getAppointmentStyle(appointment.status, appointment.services?.type),
                  top: topPosition + positionOffset,
                  height: height,
                  overflow: 'hidden', // İçerik taşmasını engelle
                };

                return (
                  <TouchableOpacity
                    key={appointment.id}
                    style={cardStyle}
                    onPress={() => handleAppointmentPress(appointment)}
                  >
                    <Text style={styles.appointmentTime}>
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </Text>
                    <Text style={styles.appointmentCustomer}>
                      {appointment.customer?.name || 'Müşteri'}
                    </Text>
                    <Text style={styles.appointmentService}>
                      {appointment.services?.name || 'Hizmet'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          // Kart Görünümü
          <>
            {/* İstatistikler */}
            <View style={styles.statsContainer}>
              {renderStatCard(
                'Toplam Müşteri', 
                stats.totalCustomers, 
                <Users size={20} color="#3b82f6" />, 
                '#3b82f6'
              )}
              {renderStatCard(
                'Toplam Randevu', 
                stats.totalAppointments, 
                <Calendar size={20} color="#8b5cf6" />, 
                '#8b5cf6'
              )}
              {renderStatCard(
                'Toplam Gelir', 
                `${stats.totalRevenue.toFixed(2)} ₺`, 
                <TrendingUp size={20} color="#10b981" />, 
                '#10b981'
              )}
            </View>

            {/* Bekleyen Randevular */}
            {pendingCount > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AlertCircle size={18} color="#f59e0b" />
                  <Text style={styles.sectionTitle}>Bekleyen Randevular</Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => router.push('/pending-appointments' as any)}
                >
                  <Text style={styles.viewAllText}>Tümünü Görüntüle</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bugünkü Randevular */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CalendarIcon size={18} color="#6366f1" />
                <Text style={styles.sectionTitle}>Bugünkü Randevular</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{todayAppointments.length}</Text>
                </View>
              </View>
              
              {todayAppointments.length > 0 ? (
                <View style={styles.appointmentsContainer}>
                  {todayAppointments.map(renderAppointmentCard)}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>Bugün için randevu bulunmuyor</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/calendar' as any)}
              >
                <Text style={styles.viewAllText}>Takvimi Görüntüle</Text>
              </TouchableOpacity>
            </View>

            {/* Yaklaşan Randevular */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={18} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Yaklaşan Randevular</Text>
              </View>
              
              {upcomingAppointments.length > 0 ? (
                <View style={styles.appointmentsContainer}>
                  {upcomingAppointments.map(renderAppointmentCard)}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>Yaklaşan randevu bulunmuyor</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/calendar' as any)}
              >
                <Text style={styles.viewAllText}>Tümünü Görüntüle</Text>
              </TouchableOpacity>
            </View>

            {/* Hızlı Erişim */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Scissors size={18} color="#ef4444" />
                <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
              </View>
              
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={handleNewAppointmentPress}
                >
                  <CalendarIcon size={24} color="#6366f1" />
                  <Text style={styles.quickActionText}>Yeni Randevu</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={handleVIPCustomersPress}
                >
                  <Crown size={24} color="#f59e0b" />
                  <Text style={styles.quickActionText}>VIP Müşteriler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => router.push('/customers')}
                >
                  <User size={24} color="#10b981" />
                  <Text style={styles.quickActionText}>Müşteriler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddMenuPress}>
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {showAddMenu && (
        <View style={styles.addMenu}>
          <TouchableOpacity style={styles.addMenuItem} onPress={handleNewAppointmentPress}>
            <Calendar size={18} color="#6366f1" style={styles.addMenuIcon} />
            <Text style={styles.addMenuText}>Yeni Randevu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={handleTimeReservationPress}>
            <Clock size={18} color="#6366f1" style={styles.addMenuIcon} />
            <Text style={styles.addMenuText}>Süre Rezervasyonu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={handleBreakTimePress}>
            <Coffee size={18} color="#6366f1" style={styles.addMenuIcon} />
            <Text style={styles.addMenuText}>Mola Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => setShowAddMenu(false)}>
            <X size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Aylık Takvim Modal */}
      <Modal
        visible={showMonthCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={handleMonthCalendarClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleMonthCalendarClose}
        >
          <View style={styles.modalContent}>
            <CalendarList
              current={selectedDate.toISOString().split('T')[0]}
              onDayPress={handleMonthCalendarSelect}
              markedDates={{
                [selectedDate.toISOString().split('T')[0]]: {selected: true, selectedColor: '#6366f1'}
              }}
              theme={{
                todayTextColor: '#6366f1',
                selectedDayBackgroundColor: '#6366f1',
                textDayFontFamily: 'Inter-Regular',
                textMonthFontFamily: 'Inter-Medium',
                textDayHeaderFontFamily: 'Inter-Medium',
              }}
              style={styles.calendar}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  viewToggleButtonActive: {
    borderBottomColor: '#6366f1',
  },
  viewToggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  viewToggleTextActive: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  appointmentsContainer: {
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  calendarAppointmentCard: {
    position: 'absolute',
    left: 70,
    right: 16,
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentCardPending: {
    borderLeftColor: '#f59e0b',
  },
  appointmentCardConfirmed: {
    borderLeftColor: '#10b981',
  },
  appointmentCardCancelled: {
    borderLeftColor: '#ef4444',
    opacity: 0.7,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentTime: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366f1',
  },
  appointmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  appointmentCustomer: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  appointmentService: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  appointmentActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  rejectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366f1',
  },
  emptyStateContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  countBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    textAlign: 'center',
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
  addMenu: {
    position: 'absolute',
    bottom: 170,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
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
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: '#ffffff',
    width: 60,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  dayButton: {
    flex: 1,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  dayButtonActive: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#334155',
    marginTop: 2,
  },
  dayNumberActive: {
    color: '#6366f1',
  },
  dayText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  dayTextActive: {
    color: '#6366f1',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  monthSelectorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#334155',
  },
  dayCalendar: {
    position: 'relative',
    paddingBottom: 20,
  },
  continuousTimeline: {
    flexDirection: 'row',
    position: 'relative',
    minHeight: 600,
  },
  timelineContent: {
    flex: 1,
    position: 'relative',
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    position: 'relative',
    height: 80,
  },
  timeColumn: {
    width: 50,
    marginRight: 8,
    alignItems: 'flex-start',
    position: 'relative',
    height: '100%',
  },
  timeTextContainer: {
    width: '100%',
    position: 'absolute',
    top: -10,
    alignItems: 'flex-start',
  },
  minutesContainer: {
    width: '100%',
    paddingLeft: 8,
    position: 'absolute',
    top: 20,
  },
  minutesColumnContainer: {
    width: '100%',
    paddingLeft: 8,
    position: 'absolute',
    top: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: 60,
  },
  timeSlotContent: {
    flex: 1,
    position: 'relative',
  },
  timeText: {
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
    textAlign: 'left',
    paddingLeft: 8,
    width: '100%',
  },
  timeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: '#94a3b8',
    zIndex: 2,
  },
  timeSlotQuarter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 15, // 15 dakika = 15px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  timeSlotQuarter30: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 30, // 30 dakika = 30px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  timeSlotQuarter45: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 45, // 45 dakika = 45px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  quarterTextContainer: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  quarterTimeText: {
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
    opacity: 0.8,
    position: 'absolute',
    left: 0,
  },
  quarterLine: {
    height: 1,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    opacity: 0.7,
  },
  calendar: {
    borderRadius: 16,
  },
  weekScrollContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 50,
    flex: 1,
    marginHorizontal: 4,
  },
  calendarAppointmentCard: {
    position: 'absolute',
    left: 65,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 0,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
    borderLeftWidth: 4,
  },
  // Durum bazlı stil sınıfları
  appointmentCardPending: {
    borderLeftColor: '#f59e0b',
  },
  appointmentCardConfirmed: {
    borderLeftColor: '#10b981',
  },
  appointmentCardCancelled: {
    borderLeftColor: '#ef4444',
    opacity: 0.7,
  },
  appointmentTime: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#6366f1',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  appointmentCustomer: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#334155',
    marginBottom: 3,
  },
  appointmentService: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
});