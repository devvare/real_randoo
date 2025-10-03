import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, AlertCircle } from 'lucide-react-native';
import DateTimePickerCross from '../../components/DateTimePickerCross';

export default function TimeReservation() {
  // Rezervasyon bilgileri
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 1);
    return end;
  });
  
  // Modal durumları
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
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
      
      // Bitiş saatini otomatik ayarla (1 saat sonrası)
      const newEndTime = new Date(selectedTime);
      newEndTime.setHours(newEndTime.getHours() + 1);
      setEndTime(newEndTime);
    }
  };
  
  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };
  
  // Rezervasyon kaydetme
  const handleSaveReservation = () => {
    if (!title) {
      alert('Lütfen rezervasyon başlığı girin');
      return;
    }
    
    // Rezervasyon çakışması kontrolü yapılabilir
    
    // Rezervasyon kaydetme işlemi
    console.log('Rezervasyon kaydedildi', {
      title,
      date,
      startTime,
      endTime,
    });
    
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Süre Rezervasyonu</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <AlertCircle size={20} color="#f59e0b" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Süre rezervasyonu, belirli bir zaman diliminde randevu alınmasını engellemek için kullanılır.
            Örneğin, toplantı, eğitim veya özel bir etkinlik için zaman ayırabilirsiniz.
          </Text>
        </View>
        
        {/* Rezervasyon Başlığı */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Rezervasyon Başlığı</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Örn: Toplantı, Eğitim, Özel Etkinlik"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#94a3b8"
          />
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
        
        {/* Kaydet Butonu */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveReservation}>
          <Text style={styles.saveButtonText}>Rezervasyonu Kaydet</Text>
        </TouchableOpacity>
      </ScrollView>
      
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
});
