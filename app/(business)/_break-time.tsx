import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, User, AlertCircle } from 'lucide-react-native';
import DateTimePickerCross from '../../components/DateTimePickerCross';

export default function BreakTime() {
  // Mola bilgileri
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [reason, setReason] = useState('break'); // break, sick, training, late, early, unspecified
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const end = new Date();
    end.setMinutes(end.getMinutes() + 30);
    return end;
  });
  const [isAllDay, setIsAllDay] = useState(false);
  
  // Modal durumları
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Mock veriler
  const staffMembers = [
    { id: '1', name: 'Ahmet Yılmaz', position: 'Kuaför', image: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { id: '2', name: 'Ayşe Kaya', position: 'Stilist', image: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { id: '3', name: 'Mehmet Demir', position: 'Berber', image: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { id: '4', name: 'Zeynep Şahin', position: 'Manikür Uzmanı', image: 'https://randomuser.me/api/portraits/women/2.jpg' },
  ];
  
  // Tarih ve saat formatları
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  
  // Tarih ve saat değişiklikleri
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
      
      // Bitiş saatini otomatik ayarla (30 dakika sonrası)
      const newEndTime = new Date(selectedTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + 30);
      setEndTime(newEndTime);
    }
  };
  
  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };
  
  // Personel seçimi
  const handleSelectStaff = (staff: any) => {
    setSelectedStaff(staff);
    setShowStaffModal(false);
  };
  
  // Tüm gün değişikliği
  const handleAllDayChange = (value: boolean) => {
    setIsAllDay(value);
    if (value) {
      // Tüm gün seçildiğinde saatleri ayarla
      const start = new Date(date);
      start.setHours(9, 0, 0, 0);
      setStartTime(start);
      
      const end = new Date(date);
      end.setHours(18, 0, 0, 0);
      setEndTime(end);
    }
  };
  
  // Mola kaydetme
  const handleSaveBreak = () => {
    if (!selectedStaff) {
      alert('Lütfen personel seçin');
      return;
    }
    
    // Mola çakışması kontrolü yapılabilir
    
    // Mola kaydetme işlemi
    console.log('Mola kaydedildi', {
      staff: selectedStaff,
      reason,
      date,
      startTime,
      endTime,
      isAllDay,
    });
    
    router.back();
  };
  
  // Neden seçimi
  const renderReasonOptions = () => {
    const reasons = [
      { id: 'break', label: 'Mola' },
      { id: 'sick', label: 'Hastalık' },
      { id: 'training', label: 'Eğitim' },
      { id: 'late', label: 'Geç Kalma' },
      { id: 'early', label: 'Erken Çıkış' },
      { id: 'unspecified', label: 'Belirtilmedi' },
    ];
    
    return (
      <View style={styles.reasonContainer}>
        {reasons.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.reasonOption,
              reason === item.id && styles.reasonOptionSelected
            ]}
            onPress={() => setReason(item.id)}
          >
            <Text
              style={[
                styles.reasonText,
                reason === item.id && styles.reasonTextSelected
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İzin / Mola Ekle</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <AlertCircle size={20} color="#f59e0b" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Personel için mola, izin veya diğer zaman dilimlerini belirleyin.
            Bu süre içinde personele randevu atanamayacaktır.
          </Text>
        </View>
        
        {/* Personel Seçimi */}
        <TouchableOpacity 
          style={styles.selectionButton}
          onPress={() => setShowStaffModal(true)}
        >
          <View style={styles.selectionIcon}>
            <User size={20} color="#6366f1" />
          </View>
          <View style={styles.selectionContent}>
            <Text style={styles.selectionLabel}>Personel</Text>
            {selectedStaff ? (
              <Text style={styles.selectionValue}>{selectedStaff.name}</Text>
            ) : (
              <Text style={styles.selectionPlaceholder}>Personel seçin</Text>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Neden Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Neden</Text>
          {renderReasonOptions()}
        </View>
        
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
        </TouchableOpacity>
        
        {/* Tüm Gün Seçimi */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Tüm Gün</Text>
          <Switch
            value={isAllDay}
            onValueChange={handleAllDayChange}
            trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
            thumbColor={isAllDay ? '#6366f1' : '#94a3b8'}
          />
        </View>
        
        {!isAllDay && (
          <>
            {/* Başlangıç Saati */}
            <TouchableOpacity 
              style={styles.selectionButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <View style={styles.selectionIcon}>
                <Clock size={20} color="#6366f1" />
              </View>
              <View style={styles.selectionContent}>
                <Text style={styles.selectionLabel}>Başlangıç Saati</Text>
                <Text style={styles.selectionValue}>{formatTime(startTime)}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Bitiş Saati */}
            <TouchableOpacity 
              style={styles.selectionButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <View style={styles.selectionIcon}>
                <Clock size={20} color="#6366f1" />
              </View>
              <View style={styles.selectionContent}>
                <Text style={styles.selectionLabel}>Bitiş Saati</Text>
                <Text style={styles.selectionValue}>{formatTime(endTime)}</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
        
        {/* Kaydet Butonu */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveBreak}>
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Personel Seçim Modal */}
      {showStaffModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personel Seçin</Text>
              <TouchableOpacity onPress={() => setShowStaffModal(false)}>
                <ArrowLeft size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {staffMembers.map((staff) => (
                <TouchableOpacity 
                  key={staff.id}
                  style={styles.staffItem}
                  onPress={() => handleSelectStaff(staff)}
                >
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffInitials}>
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffPosition}>{staff.position}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
      
      {/* Tarih Seçici */}
      <DateTimePickerCross
        value={date}
        mode="date"
        display="default"
        onChange={handleDateChange}
        isVisible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
      />
      
      {/* Başlangıç Saati Seçici */}
      <DateTimePickerCross
        value={startTime}
        mode="time"
        display="default"
        onChange={handleStartTimeChange}
        isVisible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
      />
      
      {/* Bitiş Saati Seçici */}
      <DateTimePickerCross
        value={endTime}
        mode="time"
        display="default"
        onChange={handleEndTimeChange}
        isVisible={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
      />
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#92400e',
    lineHeight: 20,
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
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 12,
  },
  reasonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  reasonOption: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  reasonOptionSelected: {
    backgroundColor: '#e0e7ff',
  },
  reasonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  reasonTextSelected: {
    color: '#4f46e5',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  switchLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffInitials: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#4f46e5',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  staffPosition: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
});
