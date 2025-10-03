import React from 'react';
import { Stack } from 'expo-router';

export default function StaffLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Staff Dashboard'
        }} 
      />
      <Stack.Screen 
        name="customers" 
        options={{ 
          headerShown: false,
          title: 'Müşterilerim'
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          headerShown: false,
          title: 'Profil'
        }} 
      />
    </Stack>
  );
}
