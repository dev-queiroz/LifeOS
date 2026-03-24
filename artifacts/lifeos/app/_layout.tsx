import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors } from '@/constants/colors';
import { AppProvider, useApp } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function PINGuard({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useApp();
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    if (!loading && !settings.pin) {
      setAuthenticated(true);
    }
  }, [loading, settings.pin]);

  if (loading) return null;

  if (settings.pin && !authenticated) {
    return (
      <View style={layoutStyles.pinContainer}>
        <View style={layoutStyles.pinHeader}>
          <Feather name="lock" size={48} color={Colors.accent} />
          <Text style={layoutStyles.pinTitle}>LifeOS Bloqueado</Text>
          <Text style={layoutStyles.pinSubtitle}>Digite seu PIN de segurança</Text>
        </View>
        <TextInput
          style={layoutStyles.pinInput}
          value={pinInput}
          onChangeText={(v) => {
            const clean = v.replace(/[^0-9]/g, '');
            setPinInput(clean);
            if (clean.length === 4) {
              if (clean === settings.pin) {
                setAuthenticated(true);
              } else {
                setPinInput('');
                Alert.alert('PIN Incorreto', 'Tente novamente.');
              }
            }
          }}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          autoFocus
          placeholder="----"
          placeholderTextColor={Colors.textMuted}
        />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal/quick-session" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modal/add-subject" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modal/add-weight" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modal/add-english" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modal/add-project" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modal/add-note" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modal/configuracoes" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="subject/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <PINGuard>
                  <RootLayoutNav />
                </PINGuard>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const layoutStyles = StyleSheet.create({
  pinContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 40 },
  pinHeader: { alignItems: 'center', marginBottom: 40 },
  pinTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text, marginTop: 16 },
  pinSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 8 },
  pinInput: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, width: '100%', padding: 20, fontSize: 32, textAlign: 'center', color: Colors.text, fontFamily: 'Inter_700Bold', letterSpacing: 20 },
});
