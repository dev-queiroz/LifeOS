import { Stack } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/colors';
import { SidebarProvider } from '@/components/Sidebar';

export default function TabLayout() {
  return (
    <SidebarProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="faculdade" />
        <Stack.Screen name="ingles" />
        <Stack.Screen name="programacao" />
        <Stack.Screen name="shape" />
        <Stack.Screen name="plano" />
        <Stack.Screen name="financas" />
        <Stack.Screen name="mais" />
      </Stack>
    </SidebarProvider>
  );
}
