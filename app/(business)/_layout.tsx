import { Tabs } from 'expo-router';
import { Calendar, Users, User } from 'lucide-react-native';

export default function BusinessTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Müşteriler',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      
      {/* Alt çizgi ile başlayan dosyaları gizle */}
      <Tabs.Screen name="_edit-profile" options={{ href: null }} />
      <Tabs.Screen name="_share" options={{ href: null }} />
      <Tabs.Screen name="_settings" options={{ href: null }} />
      <Tabs.Screen name="_service-settings" options={{ href: null }} />
      <Tabs.Screen name="_create-service" options={{ href: null }} />
      <Tabs.Screen name="_calendar-settings" options={{ href: null }} />
      <Tabs.Screen name="_business-settings" options={{ href: null }} />
      
      {/* Yeni eklenen randevu yönetim sayfalarını gizle */}
      <Tabs.Screen name="_calendar-color-settings" options={{ href: null }} />
      <Tabs.Screen name="_new-appointment" options={{ href: null }} />
      <Tabs.Screen name="_time-reservation" options={{ href: null }} />
      <Tabs.Screen name="_break-time" options={{ href: null }} />
      <Tabs.Screen name="_permission-request" options={{ href: null }} />
      
      {/* Müşteri yönetimi sayfalarını gizle */}
      <Tabs.Screen name="add-customer" options={{ href: null }} />
      <Tabs.Screen name="vip-customers" options={{ href: null }} />
      <Tabs.Screen name="customer-profile" options={{ href: null }} />
      <Tabs.Screen name="_customer-profile" options={{ href: null }} />
      <Tabs.Screen name="_add-customer" options={{ href: null }} />
      <Tabs.Screen name="_invite-customer" options={{ href: null }} />
      <Tabs.Screen name="_customer-group" options={{ href: null }} />
      
      {/* Diğer sayfalar */}
      <Tabs.Screen name="_notifications" options={{ href: null }} />
      <Tabs.Screen name="_business-profile-settings" options={{ href: null }} />
      <Tabs.Screen name="_staff-settings" options={{ href: null }} />
      <Tabs.Screen name="_add-staff" options={{ href: null }} />
      <Tabs.Screen name="_appointment-settings" options={{ href: null }} />
      <Tabs.Screen name="_appointment-detail" options={{ href: null }} />
      
      {/* Personel sayfalarını gizle */}
      <Tabs.Screen name="staff-success" options={{ href: null }} />
      <Tabs.Screen name="edit-staff" options={{ href: null }} />
      <Tabs.Screen name="_edit-staff" options={{ href: null }} />
    </Tabs>
  );
}