import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TimeSlotGridProps {
  availableSlots: string[];
  conflictSlots: string[];
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  disabled?: boolean;
}

export default function TimeSlotGrid({
  availableSlots,
  conflictSlots,
  selectedTime,
  onTimeSelect,
  disabled = false
}: TimeSlotGridProps) {
  
  const isConflict = (time: string) => conflictSlots.includes(time);
  const isSelected = (time: string) => selectedTime === time;
  
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {availableSlots.map((time) => {
          const hasConflict = isConflict(time);
          const selected = isSelected(time);
          
          return (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                hasConflict && styles.conflictSlot,
                !hasConflict && styles.availableSlot,
                selected && styles.selectedSlot,
                disabled && styles.disabledSlot
              ]}
              onPress={() => !disabled && !hasConflict && onTimeSelect(time)}
              disabled={disabled || hasConflict}
            >
              <Text style={[
                styles.timeText,
                hasConflict && styles.conflictText,
                !hasConflict && styles.availableText,
                selected && styles.selectedText,
                disabled && styles.disabledText
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.availableSlot]} />
          <Text style={styles.legendText}>Uygun</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.conflictSlot]} />
          <Text style={styles.legendText}>Dolu</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.selectedSlot]} />
          <Text style={styles.legendText}>Seçili</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableSlot: {
    backgroundColor: '#dcfce7', // Light green
    borderColor: '#16a34a', // Green
  },
  conflictSlot: {
    backgroundColor: '#fee2e2', // Light red
    borderColor: '#dc2626', // Red
  },
  selectedSlot: {
    backgroundColor: '#3b82f6', // Blue
    borderColor: '#1d4ed8',
  },
  disabledSlot: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.5,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  availableText: {
    color: '#16a34a', // Green
  },
  conflictText: {
    color: '#dc2626', // Red
  },
  selectedText: {
    color: '#ffffff', // White
  },
  disabledText: {
    color: '#9ca3af', // Gray
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
