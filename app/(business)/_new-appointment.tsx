import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, User, Calendar, Clock, Plus, ChevronRight, Crown, Save, X } from 'lucide-react-native';
import ScrollableTimePicker from '../../components/ScrollableTimePicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  is_vip: boolean;
  user_id?: string; // Auth user ID for appointments
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

export default function NewAppointment() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Yeniden planlama modu kontrolü
  const isRescheduling = params.isRescheduling === 'true';
  const originalAppointmentId = params.originalAppointmentId as string;
  
  // Seçilen müşteri, hizmet ve zaman bilgileri
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [conflictTimes, setConflictTimes] = useState<string[]>([]);
  
  // Modal durumları
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Backend veriler
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    fetchServices();
    fetchWorkingHours();
    
    // Yeniden planlama için form verilerini doldur
    if (isRescheduling && params) {
      // Tarih bilgisini ayarla
      if (params.date) {
        try {
          // Tarih formatını kontrol et ve doğru şekilde parse et
          const dateStr = params.date as string;
          console.log('Yeniden planlama için tarih:', dateStr);
          
          let appointmentDate;
          if (dateStr.includes('T')) {
            // ISO formatında (2023-08-29T00:00:00.000Z)
            appointmentDate = new Date(dateStr);
          } else {
            // YYYY-MM-DD formatında
            const [year, month, day] = dateStr.split('-').map(Number);
            appointmentDate = new Date(year, month - 1, day);
          }
          
          if (isNaN(appointmentDate.getTime())) {
            console.error('Geçersiz tarih formatı:', dateStr);
            appointmentDate = new Date(); // Bugünü kullan
          }
          
          console.log('Parse edilen tarih:', appointmentDate);
          setDate(appointmentDate);
        } catch (err) {
          console.error('Tarih parse hatası:', err);
          setDate(new Date()); // Hata durumunda bugünü kullan
        }
      }
      
      // Saat bilgilerini ayarla
      if (params.startTime) setStartTime(params.startTime as string);
      if (params.endTime) setEndTime(params.endTime as string);
      
      // Yeniden planlama modunda müşteri bilgilerini hemen yükle
      fetchCustomers(true);
    }
  }, [user?.id, isRescheduling]);
  
  useEffect(() => {
    if (showCustomerModal) {
      fetchCustomers();
    }
  }, [showCustomerModal, user?.id]);
  
  useEffect(() => {
    fetchExistingAppointments();
  }, [date, user?.id]);

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
      
      console.log('Çalışma saatleri verisi:', data);
      
      // Bugünün çalışma saatlerini bul (0=Pazar, 1=Pazartesi, ...)
      const today = new Date().getDay();
      const todayWorkingHours = data?.find(wh => wh.day_of_week === today);
      
      if (todayWorkingHours && todayWorkingHours.is_open) {
        setWorkingHours({
          start: todayWorkingHours.open_time,
          end: todayWorkingHours.close_time
        });
        console.log('Bugünün çalışma saatleri:', todayWorkingHours);
      } else {
        console.log('Bugün kapalı veya çalışma saati bulunamadı');
        // Varsayılan saatleri koru
      }
      
    } catch (error) {
      console.error('Çalışma saatleri çekme hatası:', error);
    }
  };
  
  // Müşterileri çek
  const fetchCustomers = async (isReschedulingMode = false) => {
    if (!user?.id) return;
    
    try {
      setLoadingCustomers(true);
      
      // Önce business_customers tablosundan müşterileri çek
      const { data: businessCustomers, error: businessCustomersError } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', user.id)
        .order('name', { ascending: true });
        
      if (businessCustomersError) {
        console.error('Müşteriler çekilemedi:', businessCustomersError);
        Alert.alert('Hata', 'Müşteriler yüklenemedi');
        return;
      }
      
      // Müşterileri doğrudan kullan, user_id aramaya gerek yok
      setCustomers(businessCustomers || []);
      console.log('Müşteriler:', businessCustomers);
      
      // Yeniden planlama modunda müşteriyi otomatik seç
      if (isReschedulingMode && params.customerId) {
        const selectedCustomerId = params.customerId as string;
        const customer = businessCustomers?.find(c => c.id === selectedCustomerId);
        
        if (customer) {
          console.log('Yeniden planlama için müşteri bulundu:', customer);
          setSelectedCustomer(customer);
        } else if (params.customerName) {
          // Eğer müşteri bulunamadıysa ama ismi biliniyorsa geçici bir müşteri oluştur
          const tempCustomer = {
            id: selectedCustomerId || 'temp-id',
            name: params.customerName as string,
            phone: '',
            email: '',
            is_vip: false,
            business_id: user.id
          };
          console.log('Yeniden planlama için geçici müşteri oluşturuldu:', tempCustomer);
          setSelectedCustomer(tempCustomer);
        }
      }
      
      return;
    } catch (error) {
      console.error('Müşteri çekme hatası:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };
  
  // Hizmetleri çek
  const fetchServices = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingServices(true);
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration, price, description')
        .eq('business_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Hizmetler çekilemedi:', error);
        Alert.alert('Hata', 'Hizmetler yüklenemedi');
        return;
      }

      setServices(data || []);
      
      // Yeniden planlama için hizmet seç
      if (isRescheduling && params.serviceId) {
        const selectedServiceId = params.serviceId as string;
        const service = data?.find(s => s.id === selectedServiceId);
        
        if (service) {
          console.log('Yeniden planlama için hizmet bulundu:', service);
          setSelectedService(service);
        } else if (params.serviceName) {
          // Hizmet bulunamadıysa ama ismi biliniyorsa geçici bir hizmet oluştur
          console.log('Hizmet bulunamadı, geçici hizmet oluşturuluyor');
          // Hizmet ID'sini bulmak için tüm hizmetleri kontrol et
          const similarService = data?.find(s => s.name.toLowerCase().includes((params.serviceName as string).toLowerCase()));
          
          if (similarService) {
            console.log('Benzer hizmet bulundu:', similarService);
            setSelectedService(similarService);
          }
        }
      }
    } catch (error) {
      console.error('Hizmet çekme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoadingServices(false);
    }
  };
  
  // Mevcut randevuları çek
  const fetchExistingAppointments = async () => {
    if (!date || !user?.id) return;
    
    try {
      const appointmentDate = date.toISOString().split('T')[0];
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('business_id', user.id)
        .eq('appointment_date', appointmentDate)
        .in('status', ['confirmed', 'pending']);
        
      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }
      
      const conflicts: string[] = [];
      appointments?.forEach(apt => {
        conflicts.push(apt.start_time);
      });
      
      setConflictTimes(conflicts);
    } catch (error) {
      console.error('Fetch appointments error:', error);
    }
  };
  
  // Filtrelenmiş müşteriler
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery)) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Tarih ve saat formatları
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatTime = (time: string) => {
    return time;
  };
  
  // Tarih ve saat değişiklikleri
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  const handleStartTimeChange = (selectedTime: string) => {
    console.log('Start time changed:', selectedTime);
    setStartTime(selectedTime);
    
    // Bitiş saatini otomatik hesapla
    if (selectedService) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const totalMinutes = minutes + selectedService.duration;
      const endHours = hours + Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const calculatedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      setEndTime(calculatedEndTime);
    }
  };
  
  const handleEndTimeChange = (selectedTime: string) => {
    console.log('End time changed:', selectedTime);
    setEndTime(selectedTime);
  };
  
  // Müşteri seçimi
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
  };
  
  // Hizmet seçimi
  const handleSelectService = (service: any) => {
    setSelectedService(service);
    
    // Hizmet süresine göre bitiş saatini ayarla
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = minutes + service.duration;
      const endHours = hours + Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const calculatedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      setEndTime(calculatedEndTime);
    }
    
    setShowServiceModal(false);
  };
  
  // Yeni müşteri ekleme
  const handleAddNewCustomer = () => {
    setShowCustomerModal(false);
    router.push('/add-customer');
  };
  
  // Randevu çakışması kontrolü
  const checkAppointmentConflict = async (appointmentDate: string, startTime: string, endTime: string) => {
    if (!user?.id) return false;
    
    try {
      console.log('🔍 Çakışma kontrolü parametreleri:', { appointmentDate, startTime, endTime });
      
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('business_id', user.id)
        .eq('appointment_date', appointmentDate)
        .neq('status', 'cancelled');

      if (error) {
        console.error('Çakışma kontrolü hatası:', error);
        return false;
      }

      console.log('🔍 Mevcut randevular:', data);
      
      // Manuel çakışma kontrolü
      if (!data || data.length === 0) {
        console.log('🔍 Hiç randevu yok, çakışma yok');
        return false;
      }
      
      // Saat formatlarını karşılaştır
      const newStart = startTime; // "17:00"
      const newEnd = endTime;     // "17:10"
      
      for (const appointment of data) {
        const existingStart = appointment.start_time; // "16:30"
        const existingEnd = appointment.end_time;     // "17:00"
        
        console.log('🔍 Karşılaştırma:', {
          yeni: `${newStart} - ${newEnd}`,
          mevcut: `${existingStart} - ${existingEnd}`
        });
        
        // Çakışma kontrolü: Yeni randevu başlangıcı mevcut randevu bitiş saatinden önce VE
        // Yeni randevu bitişi mevcut randevu başlangıç saatinden sonra ise çakışma var
        if (newStart < existingEnd && newEnd > existingStart) {
          console.log('🔍 ÇAKIŞMA BULUNDU!');
          return true;
        }
      }
      
      console.log('🔍 Çakışma yok');
      return false;
      
    } catch (error) {
      console.error('Çakışma kontrolü hatası:', error);
      return false;
    }
  };
  
  // Çalışma saatleri kontrolü
  const checkWorkingHours = (startTime: string, endTime: string) => {
    const workStart = workingHours.start; // "09:00"
    const workEnd = workingHours.end;     // "18:00"
    
    // Başlangıç saati çalışma saatleri dışında mı?
    const isStartOutside = startTime < workStart || startTime >= workEnd;
    // Bitiş saati çalışma saatleri dışında mı?
    const isEndOutside = endTime <= workStart || endTime > workEnd;
    
    return isStartOutside || isEndOutside;
  };

  // Randevu kaydetme
  const handleSaveAppointment = async () => {
    console.log('Randevuyu oluşturan ID:', user?.id);
    console.log('Asıl müşteri bilgisi:', selectedCustomer);
    console.log('Seçili hizmet:', selectedService);
    console.log('Tarih:', date);
    console.log('Başlangıç saati:', startTime);
    console.log('Bitiş saati:', endTime);
    
    if (!selectedCustomer || !selectedService) {
      console.log('❌ Müşteri veya hizmet seçilmemiş');
      Alert.alert('Eksik Bilgi', 'Lütfen müşteri ve hizmet seçin');
      return;
    }
    
    if (!user?.id) {
      console.log('❌ User ID bulunamadı');
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }
    
    try {
      setSaving(true);
      console.log('💾 Kaydetme işlemi başladı');
      
      // Tarih ve saat formatla
      const appointmentDate = date.toISOString().split('T')[0];
      const startTimeStr = startTime; // Artık string formatında
      const endTimeStr = endTime; // Artık string formatında
      
      console.log('📅 Formatlanmış tarih:', appointmentDate);
      console.log('⏰ Formatlanmış saatler:', startTimeStr, '-', endTimeStr);
      
      // Çalışma saatleri kontrolü
      console.log('🕐 Çalışma saatleri kontrolü başlıyor...');
      const isOutsideWorkingHours = checkWorkingHours(startTimeStr, endTimeStr);
      console.log('🕐 Çalışma saatleri dışında mı:', isOutsideWorkingHours);
      
      // Çakışma kontrolü
      console.log('🔍 Çakışma kontrolü başlıyor...');
      const hasConflict = await checkAppointmentConflict(appointmentDate, startTimeStr, endTimeStr);
      console.log('🔍 Çakışma kontrolü sonucu:', hasConflict);
      
      // Uyarılar varsa kullanıcıya sor
      if (hasConflict && isOutsideWorkingHours) {
        Alert.alert(
          'Uyarı', 
          `Bu saatte başka bir randevunuz var ve çalışma saatleri dışında (${workingHours.start}-${workingHours.end}). Devam etmek istiyor musunuz?`, 
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Devam Et', onPress: () => saveAppointment() }
          ]
        );
        return;
      } else if (hasConflict) {
        Alert.alert(
          'Çakışma Uyarısı', 
          'Bu saatte başka bir randevunuz bulunmaktadır. Devam etmek istiyor musunuz?', 
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Devam Et', onPress: () => saveAppointment() }
          ]
        );
        return;
      } else if (isOutsideWorkingHours) {
        Alert.alert(
          'Çalışma Saatleri Uyarısı', 
          `Bu randevu çalışma saatleri dışında (${workingHours.start}-${workingHours.end}). Devam etmek istiyor musunuz?`, 
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Devam Et', onPress: () => saveAppointment() }
          ]
        );
        return;
      }
      
      await saveAppointment();
      
    } catch (error) {
      console.error('Randevu kaydetme hatası:', error);
      Alert.alert('Hata', 'Randevu kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };
  
  const saveAppointment = async () => {
    const appointmentDate = date.toISOString().split('T')[0];
    const startTimeStr = startTime; // Artık string formatında
    const endTimeStr = endTime; // Artık string formatında
    
    // İşletme tarafında customer_id olarak auth.users.id kullan
    // Asıl müşteri bilgisini customer_info alanında sakla
    const customerId = user!.id; // Randevuyu oluşturan kişi (işletme sahibi)
    console.log('Randevuyu oluşturan ID:', customerId);
    console.log('Asıl müşteri bilgisi:', selectedCustomer);
    
    const appointmentData = {
      business_id: user!.id,
      customer_id: customerId, // auth.users.id (işletme sahibi)
      service_id: selectedService!.id,
      appointment_date: appointmentDate,
      start_time: startTimeStr,
      end_time: endTimeStr,
      status: 'confirmed', // İşletme tarafından yapılan randevular otomatik onaylı
      is_vip_appointment: selectedCustomer!.is_vip,
      customer_info: {
        name: selectedCustomer!.name,
        phone: selectedCustomer!.phone,
        email: selectedCustomer!.email,
        business_customer_id: selectedCustomer!.id,
        is_vip: selectedCustomer!.is_vip
      },
      notes: isRescheduling ? 'Yeniden planlanmış randevu' : null
    };
    
    console.log('Randevu kaydediliyor:', appointmentData);
    console.log('Seçili müşteri:', selectedCustomer);
    console.log('Seçili hizmet:', selectedService);
    
    console.log('💾 Supabase insert işlemi başlıyor...');
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      console.log('💾 Supabase yanıtı alındı');
      console.log('💾 Data:', data);
      console.log('💾 Error:', error);

      if (error) {
        console.error('❌ Randevu kaydetme hatası:', error);
        console.error('❌ Hata detayları:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        Alert.alert('Hata', `Randevu kaydedilemedi: ${error.message}`);
        return;
      }
      
      console.log('✅ Randevu başarıyla kaydedildi:', data);
      
      // Yeniden planlama durumunda eski randevuyu iptal et
      if (isRescheduling && originalAppointmentId) {
        try {
          console.log('Eski randevu iptal ediliyor:', originalAppointmentId);
          
          const { error: cancelError } = await supabase
            .from('appointments')
            .update({ 
              status: 'cancelled',
              notes: 'Yeniden planlandı: ' + data.id
            })
            .eq('id', originalAppointmentId);
            
          if (cancelError) {
            console.error('Eski randevu iptal edilemedi:', cancelError);
          } else {
            console.log('Eski randevu başarıyla iptal edildi');
          }
        } catch (cancelErr) {
          console.error('Eski randevu iptal hatası:', cancelErr);
        }
      }
      
      // Başarı mesajı
      const actionText = isRescheduling ? 'YENİDEN PLANLANDI' : 'OLUŞTURULDU';
      const appointmentDetails = `🎉 RANDEVU BAŞARIYLA ${actionText}

📋 RANDEVU DETAYLARI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 TARİH
${formatDate(date)}

⏰ SAAT
${startTimeStr} - ${endTimeStr} (${selectedService!.duration} dakika)

👤 MÜŞTERİ
${selectedCustomer!.name}${selectedCustomer!.is_vip ? ' 👑 VIP' : ''}
📞 ${selectedCustomer!.phone || 'Telefon bilgisi yok'}
📧 ${selectedCustomer!.email || 'E-posta bilgisi yok'}

💼 HİZMET
${selectedService!.name}
💰 Ücret: ${selectedService!.price}₺

✅ DURUM
Onaylandı (İşletme tarafından oluşturuldu)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Randevu otomatik olarak onaylanmıştır
• Müşteriye bildirim gönderilmiştir
• Takvimde görüntülenebilir`;
      
      Alert.alert(
        '🎉 Randevu Oluşturuldu', 
        appointmentDetails,
        [
          { 
            text: '📅 Takvime Dön', 
            onPress: () => {
              // Takvim sayfasını yenile
              router.back();
            }
          },
          { 
            text: '➕ Yeni Randevu', 
            onPress: () => {
              // Formu sıfırla
              setSelectedCustomer(null);
              setSelectedService(null);
              setDate(new Date());
              setStartTime('09:00');
              setEndTime('10:00');
            }
          }
        ]
      );
      
    } catch (err) {
      console.error('💥 Supabase insert exception:', err);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isRescheduling ? 'Randevuyu Yeniden Planla' : 'Yeni Randevu'}</Text>
      </View>
      
      {isRescheduling && (
        <View style={styles.reschedulingBanner}>
          <Text style={styles.reschedulingText}>Yeniden planlama modu - Eski randevu otomatik olarak iptal edilecek</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {/* Müşteri Seçimi */}
        <TouchableOpacity 
          style={styles.selectionButton}
          onPress={() => setShowCustomerModal(true)}
        >
          <View style={styles.selectionIcon}>
            <User size={20} color="#6366f1" />
          </View>
          <View style={styles.selectionContent}>
            <Text style={styles.selectionLabel}>Müşteri</Text>
            {selectedCustomer ? (
              <Text style={styles.selectionValue}>{selectedCustomer.name}</Text>
            ) : (
              <Text style={styles.selectionPlaceholder}>Müşteri seçin</Text>
            )}
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
        
        {/* Hizmet Seçimi */}
        <TouchableOpacity 
          style={styles.selectionButton}
          onPress={() => setShowServiceModal(true)}
        >
          <View style={styles.selectionIcon}>
            <Calendar size={20} color="#6366f1" />
          </View>
          <View style={styles.selectionContent}>
            <Text style={styles.selectionLabel}>Hizmet</Text>
            {selectedService ? (
              <Text style={styles.selectionValue}>{selectedService.name} - {selectedService.duration} dk</Text>
            ) : (
              <Text style={styles.selectionPlaceholder}>Hizmet seçin</Text>
            )}
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
        
        {/* Tarih Seçimi */}
        <TouchableOpacity 
          style={styles.selectionButton}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.selectionIcon}>
            <Calendar size={20} color="#6366f1" />
          </View>
          <View style={styles.selectionContent}>
            <Text style={styles.selectionLabel}>Tarih</Text>
            <Text style={styles.selectionValue}>{formatDate(date)}</Text>
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
        
        {/* Randevu Saati */}
        <TouchableOpacity 
          style={styles.selectionButton}
          onPress={() => setShowStartTimePicker(true)}
        >
          <View style={styles.selectionIcon}>
            <Clock size={20} color="#6366f1" />
          </View>
          <View style={styles.selectionContent}>
            <Text style={styles.selectionLabel}>Randevu Saati</Text>
            <Text style={styles.selectionValue}>{formatTime(startTime)}</Text>
            {conflictTimes.includes(startTime) && (
              <Text style={styles.conflictWarning}>⚠️ Bu saatte randevu var</Text>
            )}
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
        
        {/* Bitiş Saati (Otomatik Hesaplanır) */}
        <View style={styles.selectionButton}>
          <View style={styles.selectionIcon}>
            <Clock size={20} color="#94a3b8" />
          </View>
          <View style={styles.selectionContent}>
            <Text style={styles.selectionLabel}>Bitiş Saati</Text>
            <Text style={styles.selectionValue}>
              {selectedService 
                ? `${endTime} (${selectedService.duration} dk sonra)`
                : 'Hizmet seçildikten sonra hesaplanır'
              }
            </Text>
          </View>
        </View>
        
        {/* Kaydet Butonu */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSaveAppointment}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Randevu Oluştur</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Müşteri Seçim Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Müşteri Seçin</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <ArrowLeft size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Müşteri ara..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
            </View>
            
            <TouchableOpacity 
              style={styles.addNewCustomerButton}
              onPress={handleAddNewCustomer}
            >
              <Plus size={20} color="#6366f1" style={styles.addIcon} />
              <Text style={styles.addNewCustomerText}>Yeni Müşteri Ekle</Text>
            </TouchableOpacity>
            
            {loadingCustomers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Müşteriler yükleniyor...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.customerItem}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    <View style={styles.customerAvatar}>
                      <User size={24} color="#6b7280" />
                    </View>
                    <View style={styles.customerInfo}>
                      <View style={styles.customerNameRow}>
                        <Text style={styles.customerName}>{item.name}</Text>
                        {item.is_vip && <Crown size={16} color="#F59E0B" />}
                      </View>
                      <Text style={styles.customerPhone}>{item.phone || item.email}</Text>
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <User size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>Müşteri bulunamadı</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Hizmet Seçim Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hizmet Seçin</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <ArrowLeft size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            
            {loadingServices ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Hizmetler yükleniyor...</Text>
              </View>
            ) : (
              <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.serviceItem}
                    onPress={() => handleSelectService(item)}
                  >
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{item.name}</Text>
                      <Text style={styles.serviceDetails}>
                        {item.duration} dk • ₺{item.price}
                      </Text>
                      {item.description && (
                        <Text style={styles.serviceDescription}>{item.description}</Text>
                      )}
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Calendar size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>Hizmet bulunamadı</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Tarih Seçici Modal */}
      {Platform.OS === 'web' ? (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tarih Seçin</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <X size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.webDatePicker}>
                <Text style={styles.webDateLabel}>Tarih Seçin:</Text>
                <input
                  type="date"
                  style={{
                    padding: 12,
                    fontSize: 16,
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    minWidth: 200,
                    textAlign: 'center',
                    marginBottom: 16,
                  }}
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setDate(newDate);
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                />
                <TouchableOpacity 
                  style={styles.webDateButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.webDateButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setDate(selectedDate);
              }
              setShowDatePicker(false);
            }}
            minimumDate={new Date()}
          />
        )
      )}
      
      {/* Randevu Saati Seçici Modal */}
      <Modal
        visible={showStartTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Randevu Saati</Text>
              <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {selectedService && (
              <ScrollableTimePicker
                selectedTime={startTime}
                onTimeChange={handleStartTimeChange}
                conflictTimes={conflictTimes}
                workingHours={workingHours}
                serviceDuration={selectedService.duration}
                allowConflicts={true}
                showWarnings={true}
              />
            )}
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowStartTimePicker(false)}
            >
              <Text style={styles.modalButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  reschedulingBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
  },
  reschedulingText: {
    color: '#92400e',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
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
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectionContent: {
    flex: 1,
  },
  selectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  selectionValue: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  selectionPlaceholder: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  conflictWarning: {
    fontSize: 12,
    color: '#f59e0b',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  modalNote: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    padding: 20,
  },
  modalButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  customerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginRight: 8,
  },
  customerPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  addNewCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 8,
  },
  addIcon: {
    marginRight: 8,
  },
  addNewCustomerText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6366f1',
  },
  serviceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    marginTop: 4,
  },
});
