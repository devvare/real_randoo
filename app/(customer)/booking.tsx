import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Dimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Calendar, Clock, User, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import TimeSlotGrid from '@/components/TimeSlotGrid';

const { width } = Dimensions.get('window');

export default function Booking() {
  const router = useRouter();
  const { user } = useAuth();
  const { serviceId, businessId } = useLocalSearchParams<{ serviceId: string; businessId: string }>();
  
  const [service, setService] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Seçim state'leri
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Personel, 2: Tarih, 3: Saat
  
  // Tarih navigasyonu
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [conflictingSlots, setConflictingSlots] = useState<string[]>([]);

  // Veri çekme
  const fetchBookingData = async () => {
    if (!serviceId || !businessId) return;
    
    try {
      setLoading(true);
      
      // Hizmet bilgileri
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (serviceError) {
        console.error('Service fetch error:', serviceError);
        return;
      }
      setService(serviceData);

      // İşletme bilgileri
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('Business fetch error:', businessError);
        return;
      }
      setBusiness(businessData);

      // Personel bilgileri
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('business_id', businessId)
        .eq('can_take_appointments', true);

      let allStaff = staffData || [];
      
      // İşletme sahibini otomatik personel olarak ekle
      const businessOwner = {
        id: businessId,
        business_id: businessId,
        position: 'İşletme Sahibi',
        can_take_appointments: true,
        avatar: null,
        created_at: new Date().toISOString()
      };
      
      // İşletme sahibini listenin başına ekle
      allStaff = [businessOwner, ...allStaff];
      
      setStaff(allStaff);
      
      // Eğer tek personel varsa (sadece işletme sahibi) otomatik seç ve adımı atla
      if (allStaff.length === 1) {
        setSelectedStaff(allStaff[0]);
        setCurrentStep(2);
      }

      // Çalışma saatleri
      const { data: hoursData, error: hoursError } = await supabase
        .from('working_hours')
        .select('*')
        .eq('business_id', businessId)
        .order('day_of_week');

      if (!hoursError && hoursData) {
        setWorkingHours(hoursData);
      }

    } catch (error) {
      console.error('Fetch booking data error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tüm olası slotları üret (çakışma kontrolü için)
  const generateAllPossibleSlots = async (): Promise<string[]> => {
    if (!selectedDate || !workingHours.length) return [];

    const dayOfWeek = selectedDate.getDay();
    const workingDay = workingHours.find(h => h.day_of_week === dayOfWeek);
    
    if (!workingDay || !workingDay.is_open) {
      return [];
    }

    const slots: string[] = [];
    const startTime = workingDay.open_time; // "09:00"
    const endTime = workingDay.close_time; // "18:00"
    
    if (!startTime || !endTime) {
      return [];
    }

    // Saat aralıklarını oluştur (15dk aralıklarla)
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeString);
      
      // 15 dakika ekle
      currentMinute += 15;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  // Yeni sistem: Business Available Slots kullanarak uygunluk kontrolü
  const fetchAvailableSlots = async () => {
    if (!businessId || !selectedDate) return;
    
    try {
      console.log('🎯 Yeni sistem: Available slots çekiliyor:', {
        selectedDate,
        businessId,
        appointmentDate: selectedDate.toISOString().split('T')[0]
      });
      
      // 1. Mevcut randevuları çek (hizmet süresi boyunca çakışma kontrolü için)
      const appointmentDate = selectedDate.toISOString().split('T')[0];
      // Müşteri tarafında staff seçimi: eğer staff seçilmişse onu kullan, yoksa null (işletme sahibi)
      const staffId = selectedStaff?.id === business?.id ? null : selectedStaff?.id || null;
      
      let appointmentQuery = supabase
        .from('appointments')
        .select('id, start_time, end_time, status')
        .eq('business_id', businessId)
        .eq('appointment_date', appointmentDate)
        .in('status', ['confirmed', 'pending']);
      
      // Staff ID kontrolü
      if (staffId === null) {
        appointmentQuery = appointmentQuery.is('staff_id', null);
      } else {
        appointmentQuery = appointmentQuery.eq('staff_id', staffId);
      }
      
      const { data: appointments, error: appointmentError } = await appointmentQuery;
      
      if (appointmentError) {
        console.error('❌ Randevu çekme hatası:', appointmentError);
        return fetchAppointmentsAndConflicts();
      }
      
      console.log('🎯 Çekilen randevular:', appointments?.length || 0, appointments);
      
      // 2. İşletme çalışma saatlerini çek
      const dayOfWeek = selectedDate.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
      const { data: workingHours, error: workingHoursError } = await supabase
        .from('working_hours')
        .select('open_time, close_time, is_open')
        .eq('business_id', businessId)
        .eq('day_of_week', dayOfWeek)
        .single();
      
      if (workingHoursError) {
        console.error('❌ Çalışma saatleri çekme hatası:', workingHoursError);
      }
      
      const businessCloseTime = workingHours?.close_time || '18:00'; // Varsayılan kapatış
      console.log('🕰️ İşletme kapatış saati:', businessCloseTime);
      
      // 3. Tüm olası slotları oluştur
      const allPossibleSlots = await generateAllPossibleSlots();
      
      // 3. Çakışan slotları hesapla (hizmet süresi boyunca)
      const conflictSlots: string[] = [];
      
      appointments?.forEach((apt) => {
        const normalizedStartTime = apt.start_time.substring(0, 5); // "16:00:00" -> "16:00"
        const normalizedEndTime = apt.end_time.substring(0, 5);
        
        console.log('🔍 Randevu çakışma kontrolü:', {
          start: normalizedStartTime,
          end: normalizedEndTime
        });
        
        // Hizmet süresi boyunca tüm slotları çakışan olarak işaretle
        const [startHour, startMinute] = normalizedStartTime.split(':').map(Number);
        const [endHour, endMinute] = normalizedEndTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        // Randevu süresi boyunca 15dk aralıklarla tüm slotları ekle
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          if (!conflictSlots.includes(timeString)) {
            conflictSlots.push(timeString);
            console.log('🚫 Çakışan slot eklendi:', timeString);
          }
          
          // 15 dakika ekle
          currentMinute += 15;
          if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour += 1;
          }
        }
      });
      
      // 4. Seçilen hizmetin süresi boyunca çakışma kontrolü (müşteri seçim yaparken)
      if (service && service.duration) {
        const serviceDurationMinutes = service.duration;
        console.log('🎯 Hizmet süresi:', serviceDurationMinutes, 'dakika');
        
        // Her slot için, seçildiğinde hizmet süresi boyunca çakışma olup olmadığını kontrol et
        const additionalConflicts: string[] = [];
        
        allPossibleSlots.forEach(slot => {
          const [slotHour, slotMinute] = slot.split(':').map(Number);
          
          // Bu slottan başlayarak hizmet süresi boyunca çakışma var mı?
          let checkHour = slotHour;
          let checkMinute = slotMinute;
          let hasConflict = false;
          
          // Hizmet süresi boyunca kontrol et
          const endCheckMinute = slotMinute + serviceDurationMinutes;
          const endCheckHour = slotHour + Math.floor(endCheckMinute / 60);
          const finalEndCheckMinute = endCheckMinute % 60;
          
          while (checkHour < endCheckHour || (checkHour === endCheckHour && checkMinute < finalEndCheckMinute)) {
            const checkTimeString = `${checkHour.toString().padStart(2, '0')}:${checkMinute.toString().padStart(2, '0')}`;
            
            if (conflictSlots.includes(checkTimeString)) {
              hasConflict = true;
              break;
            }
            
            // 15 dakika ekle
            checkMinute += 15;
            if (checkMinute >= 60) {
              checkMinute = 0;
              checkHour += 1;
            }
          }
          
          // Eğer çakışma varsa bu slot da seçilemez
          if (hasConflict && !additionalConflicts.includes(slot)) {
            additionalConflicts.push(slot);
            console.log('⚠️ Hizmet süresi nedeniyle çakışan slot:', slot);
          }
        });
        
        // 5. YETERSİZ BOŞLUK KONTROLÜ - Kalan aralık hizmet süresine yetiyor mu?
        console.log('🔍 Yetersiz boşluk kontrolü başlıyor...');
        
        allPossibleSlots.forEach(slot => {
          // Bu slot zaten çakışan olarak işaretliyse kontrol etme
          if (conflictSlots.includes(slot) || additionalConflicts.includes(slot)) {
            return;
          }
          
          const [slotHour, slotMinute] = slot.split(':').map(Number);
          
          // İşletme kapatış saati kontrolü
          const [closeHour, closeMinute] = businessCloseTime.split(':').map(Number);
          const slotEndHour = slotHour + Math.floor((slotMinute + serviceDurationMinutes) / 60);
          const slotEndMinute = (slotMinute + serviceDurationMinutes) % 60;
          
          // Eğer hizmet bitiş saati işletme kapatış saatinden sonraysa, slot kapatılır
          if (slotEndHour > closeHour || (slotEndHour === closeHour && slotEndMinute > closeMinute)) {
            additionalConflicts.push(slot);
            console.log('🕰️ Kapatış saati nedeniyle kırmızı slot:', slot, 
              `(Hizmet bitiş: ${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}, Kapatış: ${businessCloseTime})`);
            return; // Bu slot için başka kontrol yapmaya gerek yok
          }
          
          // Bu slottan sonraki ilk çakışan slotu bul
          let nextConflictFound = false;
          let availableGapMinutes = 0;
          
          let checkHour = slotHour;
          let checkMinute = slotMinute;
          
          // Maksimum kontrol süresi (çalışma saati sonuna kadar)
          const maxCheckHours = 10; // 10 saat sonrasına kadar kontrol et
          let checkCount = 0;
          
          while (checkCount < (maxCheckHours * 4)) { // 15dk aralıklarla 10 saat = 40 kontrol
            const checkTimeString = `${checkHour.toString().padStart(2, '0')}:${checkMinute.toString().padStart(2, '0')}`;
            
            // Bu saat çakışan mı?
            if (conflictSlots.includes(checkTimeString)) {
              nextConflictFound = true;
              break;
            }
            
            // Boşluk süresini artır
            availableGapMinutes += 15;
            
            // Eğer hizmet süresine yetecek kadar boşluk varsa, bu slot uygun
            if (availableGapMinutes >= serviceDurationMinutes) {
              break;
            }
            
            // 15 dakika ekle
            checkMinute += 15;
            if (checkMinute >= 60) {
              checkMinute = 0;
              checkHour += 1;
            }
            
            checkCount++;
          }
          
          // Eğer yeterli boşluk yoksa bu slot da kırmızı olmalı
          if (availableGapMinutes < serviceDurationMinutes) {
            additionalConflicts.push(slot);
            console.log('📏 Yetersiz boşluk nedeniyle kırmızı slot:', slot, 
              `(Mevcut boşluk: ${availableGapMinutes}dk, Gerekli: ${serviceDurationMinutes}dk)`);
          } else {
            console.log('✅ Yeterli boşluk var:', slot, 
              `(Mevcut boşluk: ${availableGapMinutes}dk, Gerekli: ${serviceDurationMinutes}dk)`);
          }
        });
        
        // Ek çakışmaları ana listeye ekle
        additionalConflicts.forEach(slot => {
          if (!conflictSlots.includes(slot)) {
            conflictSlots.push(slot);
          }
        });
      }
      
      console.log('🎯 Toplam çakışan slotlar:', conflictSlots);
      
      setConflictingSlots(conflictSlots);
      setAvailableTimeSlots(allPossibleSlots);
      
    } catch (error) {
      console.error('❌ Available slots sistemi hatası:', error);
      // Fallback: Eski sistem
      fetchAppointmentsAndConflicts();
    }
  };
  
  // Fallback: Eski randevu çekme sistemi
  const fetchAppointmentsAndConflicts = async () => {
    if (!businessId || !selectedDate) return;
    
    try {
      console.log('⚠️ Fallback: Eski sistem randevular çekiliyor:', {
        selectedDate,
        selectedStaff,
        businessId
      });
      
      let query = supabase
        .from('appointments')
        .select('id, start_time, end_time, status, customer_id, created_at')
        .eq('business_id', businessId)
        .eq('appointment_date', selectedDate.toISOString().split('T')[0])
        .in('status', ['confirmed', 'pending']);
      
      const appointmentDate = selectedDate.toISOString().split('T')[0];
      const staffId = selectedStaff?.id === business?.id ? null : selectedStaff?.id || null;
      
      console.log('🔍 Sorgu parametreleri:', {
        businessId,
        appointmentDate,
        staffId,
        status: ['confirmed', 'pending']
      });
      
      // Staff ID kontrolü - null ise is.null kullan, değilse eq kullan
      if (staffId === null) {
        query = query.is('staff_id', null);
        console.log('🔍 Staff ID null sorgusu eklendi');
      } else {
        query = query.eq('staff_id', staffId);
        console.log('🔍 Staff ID sorgusu eklendi:', staffId);
      }
      
      const { data: appointments, error } = await query;

      console.log('Randevu sorgusu detayları:', {
        businessId,
        appointmentDate,
        staffId,
      });

      if (error) {
        console.error('❌ Randevu çekme hatası:', error);
        return [];
      }
      
      console.log('📅 Çekilen randevular (toplam:', appointments?.length || 0, '):', appointments);
      
      // Her randevuyu detaylı logla
      appointments?.forEach((apt, index) => {
        console.log(`📋 Randevu ${index + 1}:`, {
          id: apt.id,
          start_time: apt.start_time,
          end_time: apt.end_time,
          status: apt.status,
          customer_id: apt.customer_id,
          created_at: apt.created_at
        });
      });
      console.log('Randevu sayısı:', appointments?.length || 0);

      // Çakışan saatleri belirle - hizmet süresini de dikkate al
      const conflicts: string[] = [];
      appointments?.forEach((apt, index) => {
        console.log(`Randevu ${index + 1}:`, {
          start_time: apt.start_time,
          end_time: apt.end_time,
          start_format: typeof apt.start_time,
          end_format: typeof apt.end_time
        });
        
        // Saat formatını normalize et (HH:MM:SS -> HH:MM)
        const normalizedStartTime = apt.start_time.substring(0, 5); // "16:00:00" -> "16:00"
        const normalizedEndTime = apt.end_time.substring(0, 5);
        
        console.log(`Normalize edilmiş saatler:`, {
          original_start: apt.start_time,
          normalized_start: normalizedStartTime,
          original_end: apt.end_time,
          normalized_end: normalizedEndTime
        });
        
        // Başlangıç saatini ekle
        conflicts.push(normalizedStartTime);
        
        // Hizmet süresi boyunca tüm slotları çakışan olarak işaretle
        if (service && normalizedStartTime && normalizedEndTime) {
          const [startHour, startMinute] = normalizedStartTime.split(':').map(Number);
          const [endHour, endMinute] = normalizedEndTime.split(':').map(Number);
          
          let currentHour = startHour;
          let currentMinute = startMinute;
          
          // Randevu süresi boyunca 15dk aralıklarla tüm slotları ekle
          while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            if (!conflicts.includes(timeString)) {
              conflicts.push(timeString);
            }
            
            // 15 dakika ekle
            currentMinute += 15;
            if (currentMinute >= 60) {
              currentMinute = 0;
              currentHour += 1;
            }
          }
        }
      });
      
      console.log('Çakışan saat slotları:', conflicts);
      setConflictingSlots(conflicts);
    } catch (error) {
      console.error('Fetch appointments error:', error);
    }
  };

  // Uygun saatleri hesapla
  const generateTimeSlots = async () => {
    if (!selectedDate || !workingHours.length) return;

    const dayOfWeek = selectedDate.getDay();
    const workingDay = workingHours.find(h => h.day_of_week === dayOfWeek);
    
    if (!workingDay || !workingDay.is_open) {
      setAvailableTimeSlots([]);
      return;
    }

    const slots: string[] = [];
    const startTime = workingDay.open_time; // "09:00"
    const endTime = workingDay.close_time; // "18:00"
    
    if (!startTime || !endTime) {
      setAvailableTimeSlots([]);
      return;
    }

    // Saat aralıklarını oluştur (15dk aralıklarla)
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeString);
      
      // 15 dakika ekle
      currentMinute += 15;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    setAvailableTimeSlots(slots);
    
    console.log('Uygun saat slotları oluşturuldu:', slots);
  };

  // Randevu oluştur
  const createAppointment = async () => {
    if (!user || !service || !business || !selectedDate || !selectedTime) {
      Alert.alert('Hata', 'Lütfen tüm bilgileri doldurun');
      return;
    }

    try {
      const appointmentDate = selectedDate.toISOString().split('T')[0];
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = selectedTime;
      
      // Hizmet süresini ekleyerek bitiş saatini hesapla
      const serviceDuration = service.duration;
      const endMinutes = minutes + serviceDuration;
      const endHours = hours + Math.floor(endMinutes / 60);
      const finalEndMinutes = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${finalEndMinutes.toString().padStart(2, '0')}`;

      // İşletme sahibi seçildiğinde staff_id null olmalı
      const finalStaffId = selectedStaff?.position === 'İşletme Sahibi' ? null : selectedStaff?.id;
      
      console.log('Randevu oluşturuluyor:', {
        business_id: businessId,
        customer_id: user.id,
        staff_id: finalStaffId,
        service_id: serviceId,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        status: 'pending'
      });

      const appointmentData = {
        business_id: businessId,
        customer_id: user.id,
        staff_id: finalStaffId,
        service_id: serviceId,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        status: 'pending',
        notes: null
      };
      
      console.log('Müşteri randevu kaydediliyor:', appointmentData);
      console.log('User bilgisi:', user);
      console.log('Business ID:', businessId);
      console.log('Service ID:', serviceId);
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        console.error('Appointment creation error:', error);
        console.error('Hata detayları:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        Alert.alert('Hata', `Randevu oluşturulamadı: ${error.message}`);
        return;
      }

      console.log('Randevu başarıyla oluşturuldu:', data);
      
      // ✅ Trigger otomatik bildirim oluşturuyor, manuel kod gerekmez
      
      // Onay sayfasına yönlendir
      router.push(`/(customer)/booking-confirmation?appointmentId=${data.id}`);

    } catch (error: any) {
      console.error('Create appointment error:', error);
      Alert.alert('Hata', 'Randevu oluşturulurken bir hata oluştu');
    }
  };

  useEffect(() => {
    fetchBookingData();
  }, [serviceId, businessId]);

  useEffect(() => {
    if (selectedDate && workingHours.length && selectedStaff) {
      generateTimeSlots();
    }
  }, [selectedDate, workingHours, selectedStaff]);

  // Tarih değiştiğinde available slots çek
  useEffect(() => {
    if (selectedDate && businessId) {
      console.log('Tarih değişti, available slots çekiliyor:', {
        selectedDate: selectedDate.toISOString().split('T')[0],
        businessId
      });
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedStaff, businessId]);

  const getDayName = (date: Date) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
  };

  const getMonthName = (date: Date) => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return months[date.getMonth()];
  };

  // Tarih seçimi için günleri oluştur
  const generateDays = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 0; i < 14; i++) { // 2 hafta
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!service || !business) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Randevu bilgileri bulunamadı</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevu Al</Text>
      </View>

      {/* Service Info */}
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.businessName}>{business.business_name}</Text>
        <Text style={styles.servicePrice}>₺{service.price} • {service.duration} dk</Text>
      </View>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        <View style={[styles.step, currentStep >= 1 && styles.activeStep]}>
          <Text style={[styles.stepText, currentStep >= 1 && styles.activeStepText]}>1</Text>
        </View>
        <View style={[styles.stepLine, currentStep >= 2 && styles.activeStepLine]} />
        <View style={[styles.step, currentStep >= 2 && styles.activeStep]}>
          <Text style={[styles.stepText, currentStep >= 2 && styles.activeStepText]}>2</Text>
        </View>
        <View style={[styles.stepLine, currentStep >= 3 && styles.activeStepLine]} />
        <View style={[styles.step, currentStep >= 3 && styles.activeStep]}>
          <Text style={[styles.stepText, currentStep >= 3 && styles.activeStepText]}>3</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Step 1: Personel Seçimi */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Personel Seçin</Text>
            {staff.length === 0 ? (
              <Text style={styles.noStaffText}>Bu hizmet için uygun personel bulunamadı</Text>
            ) : (
              staff.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.staffCard,
                    selectedStaff?.id === member.id && styles.selectedStaffCard
                  ]}
                  onPress={() => {
                    setSelectedStaff(member);
                    setCurrentStep(2);
                  }}
                >
                  <View style={[
                    styles.staffAvatar,
                    member.position === 'İşletme Sahibi' && styles.ownerAvatar
                  ]}>
                    {member.position === 'İşletme Sahibi' ? (
                      <Text style={styles.ownerInitial}>👨‍💼</Text>
                    ) : (
                      <User size={24} color="#6b7280" />
                    )}
                  </View>
                  <Text style={[
                    styles.staffName,
                    member.position === 'İşletme Sahibi' && styles.ownerName
                  ]}>
                    {member.position}
                  </Text>
                  {selectedStaff?.id === member.id && (
                    <View style={styles.selectedIcon}>
                      <CheckCircle size={20} color="#3b82f6" />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Step 2: Tarih Seçimi */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tarih Seçin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
              {generateDays().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateCard
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setCurrentStep(3);
                  }}
                >
                  <Text style={[
                    styles.dayName,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateText
                  ]}>
                    {getDayName(date).slice(0, 3)}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateText
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Step 3: Saat Seçimi */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {selectedDate.getDate()} {getMonthName(selectedDate)} - Saat Seçin
            </Text>
            {availableTimeSlots.length === 0 ? (
              <Text style={styles.noSlotsText}>Bu tarih için uygun saat bulunamadı</Text>
            ) : (
              <TimeSlotGrid
                availableSlots={availableTimeSlots}
                conflictSlots={conflictingSlots}
                selectedTime={selectedTime}
                onTimeSelect={setSelectedTime}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      {selectedTime && (
        <TouchableOpacity style={styles.confirmButton} onPress={createAppointment}>
          <Text style={styles.confirmButtonText}>Randevuyu Onayla</Text>
        </TouchableOpacity>
      )}
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
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
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
  backIcon: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  serviceInfo: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  serviceName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#059669',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: '#3b82f6',
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  activeStepText: {
    color: '#ffffff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  activeStepLine: {
    backgroundColor: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 24,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedStaffCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginLeft: 12,
  },
  noStaffText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  datesContainer: {
    marginBottom: 24,
  },
  dateCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 80,
  },
  selectedDateCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  dayName: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  selectedDateText: {
    color: '#3b82f6',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedTimeSlot: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  timeSlotText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  selectedTimeSlotText: {
    color: '#3b82f6',
  },
  noSlotsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    margin: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  ownerAvatar: {
    backgroundColor: '#3b82f6',
  },
  ownerInitial: {
    fontSize: 20,
  },
  ownerName: {
    fontFamily: 'Inter-Bold',
    color: '#3b82f6',
  },
  selectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
