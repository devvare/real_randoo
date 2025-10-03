import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';

interface ScrollableTimePickerProps {
  selectedTime?: string;
  onTimeChange: (time: string) => void;
  conflictTimes: string[];
  workingHours: { start: string; end: string };
  serviceDuration: number;
  allowConflicts?: boolean;
  showWarnings?: boolean;
}

const { width } = Dimensions.get('window');

export default function ScrollableTimePicker({
  selectedTime = '09:00',
  onTimeChange,
  conflictTimes,
  workingHours,
  serviceDuration,
  allowConflicts = true,
  showWarnings = true
}: ScrollableTimePickerProps) {
  
  // Parse selected time to get hour and minute
  const [hour, minute] = selectedTime ? selectedTime.split(':').map(Number) : [9, 0];
  const selectedHour = hour;
  const selectedMinute = minute;
  
  // Handle hour selection
  const handleHourSelect = (newHour: number) => {
    const timeString = `${newHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onTimeChange(timeString);
  };
  
  // Handle minute selection
  const handleMinuteSelect = (newMinute: number) => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    onTimeChange(timeString);
  };
  
  // Generate hours (6-23)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  
  // Generate minutes (0-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  
  // Calculate end time
  const calculateEndTime = (startHour: number, startMinute: number) => {
    const totalMinutes = startMinute + serviceDuration;
    const endHour = startHour + Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };
  
  // Check conflicts and warnings
  const getTimeStatus = () => {
    const currentTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    const endTime = calculateEndTime(selectedHour, selectedMinute);
    
    // Check if within working hours
    const workStart = workingHours.start.split(':').map(Number);
    const workEnd = workingHours.end.split(':').map(Number);
    const workStartMinutes = workStart[0] * 60 + workStart[1];
    const workEndMinutes = workEnd[0] * 60 + workEnd[1];
    const currentMinutes = selectedHour * 60 + selectedMinute;
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    
    const isOutsideWorkingHours = currentMinutes < workStartMinutes || endMinutes > workEndMinutes;
    const hasConflict = conflictTimes.includes(currentTime);
    
    return {
      currentTime,
      endTime,
      isOutsideWorkingHours,
      hasConflict,
      isValid: !isOutsideWorkingHours && (!hasConflict || allowConflicts)
    };
  };
  
  const timeStatus = getTimeStatus();
  
  const renderScrollPicker = (
    items: number[],
    selectedValue: number,
    onSelect: (value: number) => void,
    formatValue: (value: number) => string
  ) => (
    <ScrollView
      style={styles.picker}
      showsVerticalScrollIndicator={false}
      snapToInterval={40}
      decelerationRate="fast"
    >
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={[
            styles.pickerItem,
            selectedValue === item && styles.selectedPickerItem
          ]}
          onPress={() => onSelect(item)}
        >
          <Text style={[
            styles.pickerText,
            selectedValue === item && styles.selectedPickerText
          ]}>
            {formatValue(item)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
  
  return (
    <View style={styles.container}>
      {/* Time Pickers */}
      <View style={styles.pickersContainer}>
        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>Saat</Text>
          {renderScrollPicker(
            hours,
            selectedHour,
            handleHourSelect,
            (hour) => hour.toString().padStart(2, '0')
          )}
        </View>
        
        <Text style={styles.separator}>:</Text>
        
        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>Dakika</Text>
          {renderScrollPicker(
            minutes,
            selectedMinute,
            handleMinuteSelect,
            (minute) => minute.toString().padStart(2, '0')
          )}
        </View>
      </View>
      
      {/* Time Info */}
      <View style={styles.timeInfo}>
        <View style={styles.timeDisplay}>
          <Clock size={20} color="#6b7280" />
          <Text style={styles.timeText}>
            {timeStatus.currentTime} - {timeStatus.endTime}
          </Text>
          <Text style={styles.durationText}>({serviceDuration} dk)</Text>
        </View>
        
        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          {timeStatus.isValid ? (
            <View style={styles.statusItem}>
              <CheckCircle size={16} color="#16a34a" />
              <Text style={styles.validText}>Uygun saat</Text>
            </View>
          ) : (
            <View style={styles.statusItem}>
              <AlertTriangle size={16} color="#f59e0b" />
              <Text style={styles.warningText}>
                {timeStatus.isOutsideWorkingHours 
                  ? 'Çalışma saati dışında' 
                  : 'Bu saatte randevu var'}
              </Text>
            </View>
          )}
        </View>
        
        {/* Warnings */}
        {showWarnings && !timeStatus.isValid && (
          <View style={styles.warningContainer}>
            {timeStatus.isOutsideWorkingHours && (
              <Text style={styles.warningDetail}>
                Çalışma saatleri: {workingHours.start} - {workingHours.end}
              </Text>
            )}
            {timeStatus.hasConflict && (
              <Text style={styles.warningDetail}>
                {allowConflicts 
                  ? 'Çakışan randevu var, yine de devam edebilirsiniz'
                  : 'Bu saatte başka randevu mevcut'}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pickersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 20,
  },
  pickerSection: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  picker: {
    height: 160,
    width: 80,
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  selectedPickerItem: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 18,
    color: '#6b7280',
  },
  selectedPickerText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginHorizontal: 16,
  },
  timeInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  durationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validText: {
    color: '#16a34a',
    fontWeight: '500',
  },
  warningText: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningDetail: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 16,
  },
});
