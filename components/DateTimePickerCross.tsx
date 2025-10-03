import React from 'react';
import { Platform, TextInput, TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DateTimePickerCrossProps {
  value: Date;
  mode: 'date' | 'time';
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  onChange: (event: any, date?: Date) => void;
  isVisible: boolean;
  onClose?: () => void;
}

const DateTimePickerCross: React.FC<DateTimePickerCrossProps> = ({
  value,
  mode,
  display = 'default',
  onChange,
  isVisible,
  onClose,
}) => {
  // Web platformu için basit bir tarih/saat seçici
  if (Platform.OS === 'web') {
    if (!isVisible) {
      return null;
    }
    
    const handleInputChange = (text: string) => {
      // Sadece geçerli formatları kabul et
      if (mode === 'date') {
        // YYYY-MM-DD formatını kontrol et
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
          return;
        }
        const newValue = new Date(text + 'T00:00:00');
        if (!isNaN(newValue.getTime())) {
          onChange({ type: 'set' }, newValue);
        }
      } else {
        // HH:MM formatını kontrol et
        if (!/^\d{1,2}:\d{2}$/.test(text)) {
          return;
        }
        const [hoursStr, minutesStr] = text.split(':');
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        
        // Saat ve dakika geçerliliğini kontrol et
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          return;
        }
        
        const newValue = new Date(value);
        newValue.setHours(hours, minutes, 0, 0);
        onChange({ type: 'set' }, newValue);
      }
    };
    
    const handleClose = () => {
      if (onClose) onClose();
    };
    
    const inputValue = mode === 'date' 
      ? format(value, 'yyyy-MM-dd')
      : format(value, 'HH:mm');
    
    return (
      <View style={styles.webPickerContainer}>
        <View style={styles.webPickerContent}>
          <Text style={styles.webPickerTitle}>
            {mode === 'date' ? 'Tarih Seçin' : 'Saat Seçin'}
          </Text>
          <TextInput
            style={styles.webPickerInput}
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM'}
            keyboardType={mode === 'date' ? 'default' : 'numeric'}
            maxLength={mode === 'date' ? 10 : 5}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <View style={styles.webPickerButtons}>
            <TouchableOpacity style={styles.webPickerCancelButton} onPress={handleClose}>
              <Text style={styles.webPickerCancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webPickerButton} onPress={handleClose}>
              <Text style={styles.webPickerButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  // Native platformlar için normal DateTimePicker
  if (isVisible) {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display={display}
        onChange={onChange}
      />
    );
  }
  
  return null;
};

const styles = StyleSheet.create({
  webPickerContainer: {
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
  webPickerContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  webPickerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  webPickerInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  webPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  webPickerButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
  },
  webPickerCancelButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
  },
  webPickerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  webPickerCancelText: {
    color: '#64748b',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});

export default DateTimePickerCross;
