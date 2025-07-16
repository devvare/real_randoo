import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Bell, Calendar, MoveHorizontal as MoreHorizontal, Plus, X } from 'lucide-react-native';

export default function BusinessCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddMenu, setShowAddMenu] = useState(false);

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

  const mockAppointments = [
    {
      id: '1',
      customerName: 'Ayşe Kaya',
      service: 'Saç Kesimi',
      time: '10:00',
      duration: 60,
      status: 'confirmed',
    },
    {
      id: '2',
      customerName: 'Mehmet Yılmaz',
      service: 'Saç Boyama',
      time: '14:30',
      duration: 90,
      status: 'pending',
    },
  ];

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddMenuPress = () => {
    setShowAddMenu(!showAddMenu);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerButton}>
            <Bell size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MoreHorizontal size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll}>
          {currentWeek.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                date.toDateString() === selectedDate.toDateString() && styles.dayButtonActive
              ]}
              onPress={() => handleDatePress(date)}
            >
              <Text style={[
                styles.dayText,
                date.toDateString() === selectedDate.toDateString() && styles.dayTextActive
              ]}>
                {weekDays[index]}
              </Text>
              <Text style={[
                styles.dayNumber,
                date.toDateString() === selectedDate.toDateString() && styles.dayNumberActive
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.calendar}>
        <View style={styles.timeColumn}>
          {timeSlots.map((time) => (
            <View key={time} style={styles.timeSlot}>
              <Text style={styles.timeText}>{time}</Text>
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

        {mockAppointments.map((appointment) => (
          <TouchableOpacity
            key={appointment.id}
            style={[
              styles.appointmentCard,
              { top: (parseInt(appointment.time.split(':')[0]) - 9) * 80 + 40 },
              appointment.status === 'pending' && styles.appointmentCardPending
            ]}
          >
            <Text style={styles.appointmentTime}>{appointment.time}</Text>
            <Text style={styles.appointmentCustomer}>{appointment.customerName}</Text>
            <Text style={styles.appointmentService}>{appointment.service}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddMenuPress}>
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {showAddMenu && (
        <View style={styles.addMenu}>
          <TouchableOpacity style={styles.addMenuItem}>
            <Text style={styles.addMenuText}>Yeni Randevu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem}>
            <Text style={styles.addMenuText}>Süre Rezervasyonu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem}>
            <Text style={styles.addMenuText}>Mola Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => setShowAddMenu(false)}>
            <X size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  dateButton: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  weekScroll: {
    paddingHorizontal: 16,
  },
  dayButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  dayButtonActive: {
    backgroundColor: '#6366f1',
  },
  dayText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginBottom: 4,
  },
  dayTextActive: {
    color: '#ffffff',
  },
  dayNumber: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
  },
  dayNumberActive: {
    color: '#ffffff',
  },
  calendar: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timeColumn: {
    paddingTop: 16,
  },
  timeSlot: {
    height: 80,
    position: 'relative',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    position: 'absolute',
    left: 0,
    top: -6,
  },
  timeLine: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginLeft: 60,
  },
  timeSlotQuarter: {
    height: 20,
    position: 'relative',
  },
  quarterLine: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 60,
    position: 'absolute',
    top: 10,
    right: 0,
    left: 60,
  },
  appointmentCard: {
    position: 'absolute',
    left: 70,
    right: 16,
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    height: 70,
    zIndex: 1,
  },
  appointmentCardPending: {
    backgroundColor: '#fef3c7',
    borderLeftColor: '#f59e0b',
  },
  appointmentTime: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#1e40af',
  },
  appointmentCustomer: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  appointmentService: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
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
    minWidth: 150,
  },
  addMenuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  addMenuText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
});