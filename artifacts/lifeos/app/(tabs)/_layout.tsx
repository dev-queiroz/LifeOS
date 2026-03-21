import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Inicio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="faculdade">
        <Icon sf={{ default: 'book', selected: 'book.fill' }} />
        <Label>Faculdade</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="skills">
        <Icon sf={{ default: 'bolt', selected: 'bolt.fill' }} />
        <Label>Skills</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shape">
        <Icon sf={{ default: 'figure.run', selected: 'figure.run.circle.fill' }} />
        <Label>Shape</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plano">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <Label>Plano 2031</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : Colors.bgCard,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.bgCard }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="faculdade"
        options={{
          title: 'Faculdade',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="book" tintColor={color} size={22} />
            ) : (
              <Feather name="book" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bolt" tintColor={color} size={22} />
            ) : (
              <Feather name="zap" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="shape"
        options={{
          title: 'Shape',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="figure.run" tintColor={color} size={22} />
            ) : (
              <Feather name="activity" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="plano"
        options={{
          title: 'Plano 2031',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map" tintColor={color} size={22} />
            ) : (
              <Feather name="map" size={20} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
