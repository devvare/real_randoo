import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, User, AlertCircle, FileText } from 'lucide-react-native';
import DateTimePickerCross from '../../components/DateTimePickerCross';

export default function PermissionRequest() {
  // İzin bilgileri
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [permissionType, setPermissionType] = useState('annual'); // annual, sick, unpaid, other
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 1);
    return end;
  });
  const [note, setNote] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 8);
    return end;
  });
  
  // Modal durumları
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
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
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      
      // Bitiş tarihi başlangıç tarihinden önce olamaz
      if (endDate < selectedDate) {
        setEndDate(selectedDate);
      }
    }
  };
  
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // Bitiş tarihi başlangıç tarihinden önce olamaz
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
      } else {
        alert('Bitiş tarihi başlangıç tarihinden önce olamaz');
      }
    }
  };
  
  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
      
      // Bitiş saati başlangıç saatinden önce olamaz
      if (endTime < selectedTime) {
        const newEndTime = new Date(selectedTime);
        newEndTime.setHours(newEndTime.getHours() + 1);
        setEndTime(newEndTime);
      }
    }
  };
  
  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      // Bitiş saati başlangıç saatinden önce olamaz
      if (selectedTime > startTime) {
        setEndTime(selectedTime);
      } else {
        alert('Bitiş saati başlangıç saatinden sonra olmalıdır');
      }
    }
  };
  
  // Personel seçimi
  const handleSelectStaff = (staff: any) => {
    setSelectedStaff(staff);
    setShowStaffModal(false);
  };
  
  // İzin kaydetme
  const handleSavePermission = () => {
    if (!selectedStaff) {
      alert('Lütfen personel seçin');
      return;
    }
    
    // İzin çakışması kontrolü yapılabilir
    
    // İzin kaydetme işlemi
    console.log('İzin kaydedildi', {
      staff: selectedStaff,
      permissionType,
      startDate,
      endDate,
      isAllDay,
      startTime: isAllDay ? null : startTime,
      endTime: isAllDay ? null : endTime,
      note,
    });
    
    router.back();
  };
  
  // İzin türü seçimi
  const renderPermissionTypeOptions = () => {
    const types = [
      { id: 'annual', label: 'Yıllık İzin' },
      { id: 'sick', label: 'Hastalık İzni' },
      { id: 'unpaid', label: 'Ücretsiz İzin' },
      { id: 'other', label: 'Diğer' },
    ];
    
    return (
      <View style={styles.permissionTypeContainer}>
        {types.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.permissionTypeOption,
              permissionType === item.id && styles.permissionTypeOptionSelected
            ]}
            onPress={() => setPermissionType(item.id)}
          >
            <Text
              style={[
                styles.permissionTypeText,
                permissionType === item.id && styles.permissionTypeTextSelected
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  // İzin süresi hesaplama
  const calculateDuration = () => {
    const oneDay = 24 * 60 * 60 * 1000; // saat * dakika * saniye * milisaniye
    const diffDays = Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / oneDay)) + 1;
    
    if (diffDays === 1) {
      return '1 gün';
    } else {
      return `${diffDays} gün`;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İzin Talebi</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <AlertCircle size={20} color="#f59e0b" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Personel için izin talebi oluşturun. İzin süresince personele randevu atanamayacaktır.
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
        
        {/* İzin Türü Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İzin Türü</Text>
          {renderPermissionTypeOptions()}
        </View>
        
        {/* Tarih Seçimi */}
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <View style={styles.dateButtonIcon}>
              <Calendar size={20} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.dateButtonLabel}>Başlangıç</Text>
              <Text style={styles.dateButtonValue}>{formatDate(startDate)}</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.dateRangeDivider}>
            <View style={styles.dateRangeLine} />
          </View>
          
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <View style={styles.dateButtonIcon}>
              <Calendar size={20} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.dateButtonLabel}>Bitiş</Text>
              <Text style={styles.dateButtonValue}>{formatDate(endDate)}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>Toplam: {calculateDuration()}</Text>
        </View>
        
        {/* Tüm Gün Seçimi */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Tüm Gün</Text>
          <Switch
            value={isAllDay}
            onValueChange={setIsAllDay}
            trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
            thumbColor={isAllDay ? '#6366f1' : '#94a3b8'}
          />
        </View>
        
        {!isAllDay && (
          <View style={styles.timeContainer}>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <View style={styles.timeButtonIcon}>
                <Clock size={20} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.timeButtonLabel}>Başlangıç Saati</Text>
                <Text style={styles.timeButtonValue}>{formatTime(startTime)}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <View style={styles.timeButtonIcon}>
                <Clock size={20} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.timeButtonLabel}>Bitiş Saati</Text>
                <Text style={styles.timeButtonValue}>{formatTime(endTime)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Not Alanı */}
        <View style={styles.noteContainer}>
          <View style={styles.noteHeader}>
            <FileText size={18} color="#64748b" />
            <Text style={styles.noteTitle}>Not (İsteğe Bağlı)</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="İzin hakkında ek bilgi girin..."
            value={note}
            onChangeText={setNote}
            multiline={true}
            numberOfLines={4}
            placeholderTextColor="#94a3b8"
          />
        </View>
        
        {/* Kaydet Butonu */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSavePermission}>
          <Text style={styles.saveButtonText}>İzni Kaydet</Text>
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
      
      {/* Tarih Seçiciler */}
      <DateTimePickerCross
        value={startDate}
        mode="date"
        display="default"
        onChange={handleStartDateChange}
        isVisible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
      />
      
      <DateTimePickerCross
        value={endDate}
        mode="date"
        display="default"
        onChange={handleEndDateChange}
        isVisible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
      />
      
      {/* Saat Seçiciler */}
      <DateTimePickerCross
        value={startTime}
        mode="time"
        display="default"
        onChange={handleStartTimeChange}
        isVisible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
      />
      
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
  permissionTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  permissionTypeOption: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  permissionTypeOptionSelected: {
    backgroundColor: '#e0e7ff',
  },
  permissionTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  permissionTypeTextSelected: {
    color: '#4f46e5',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateButtonLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  dateButtonValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  dateRangeDivider: {
    width: 24,
    alignItems: 'center',
  },
  dateRangeLine: {
    height: 2,
    width: 16,
    backgroundColor: '#94a3b8',
  },
  durationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  durationText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeButtonLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  timeButtonValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  noteContainer: {
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
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginLeft: 8,
  },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top',
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
