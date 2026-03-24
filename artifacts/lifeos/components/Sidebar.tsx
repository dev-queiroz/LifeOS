import { Feather } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

interface SidebarCtx {
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarCtx>({ open: () => { }, close: () => { } });

export function useSidebar() {
  return useContext(SidebarContext);
}

interface NavItem {
  label: string;
  icon: string;
  route: string;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Início', icon: 'home', route: '/(tabs)/', color: Colors.accent },
  { label: 'Faculdade', icon: 'book', route: '/(tabs)/faculdade', color: Colors.cyan },
  { label: 'Inglês', icon: 'mic', route: '/(tabs)/ingles', color: Colors.green },
  { label: 'Programação', icon: 'code', route: '/(tabs)/programacao', color: Colors.purple },
  { label: 'Shape & Saúde', icon: 'activity', route: '/(tabs)/shape', color: Colors.orange },
  { label: 'Mais', icon: 'plus-square', route: '/(tabs)/mais', color: Colors.textSecondary },
];

const SIDEBAR_WIDTH = 270;

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { globalScore } = useApp();
  const segments = useSegments();

  const currentPath = '/' + segments.filter(s => s !== '(tabs)').join('/');
  const isIndex = segments.length === 1 && segments[0] === '(tabs)';

  const open = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [slideAnim, fadeAnim]);

  const navigate = (route: string) => {
    close();
    setTimeout(() => router.push(route as never), 10);
  };

  const scoreColor =
    globalScore.criticalMode
      ? Colors.red
      : globalScore.total >= 70
        ? Colors.green
        : globalScore.total >= 40
          ? Colors.orange
          : Colors.red;

  return (
    <SidebarContext.Provider value={{ open, close }}>
      {children}
      {visible && (
        <Modal transparent visible={visible} onRequestClose={close} animationType="none">
          <View style={styles.overlay}>
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={close} />
            </Animated.View>
            <Animated.View
              style={[
                styles.sidebar,
                { transform: [{ translateX: slideAnim }], paddingTop: insets.top + 8 },
              ]}
            >
              <View style={styles.sidebarHeader}>
                <View style={styles.logoRow}>
                  <View style={[styles.logoIcon, { backgroundColor: Colors.accentDim }]}>
                    <Text style={styles.logoText}>L</Text>
                  </View>
                  <View>
                    <Text style={styles.appName}>LifeOS</Text>
                    <Text style={styles.appSub}>Plano 2032</Text>
                  </View>
                </View>
                <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
                  <Text style={[styles.scoreNum, { color: scoreColor }]}>{globalScore.total}</Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
              </View>

              {globalScore.criticalMode && (
                <View style={styles.criticalBanner}>
                  <Feather name="alert-triangle" size={12} color={Colors.red} />
                  <Text style={styles.criticalText}>
                    Modo Crítico — {globalScore.redStreak} dias
                  </Text>
                </View>
              )}

              <View style={styles.navSection}>
                {NAV_ITEMS.map((item) => {
                  const itemPath = item.route.replace('/(tabs)', '') || '/';
                  const isActive = (itemPath === '/' && isIndex) || (itemPath !== '/' && currentPath.startsWith(itemPath));
                  return (
                    <TouchableOpacity
                      key={item.route}
                      style={[styles.navItem, isActive && { backgroundColor: Colors.bgElevated }]}
                      onPress={() => navigate(item.route)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.navIcon,
                          { backgroundColor: isActive ? item.color + '30' : 'transparent' },
                        ]}
                      >
                        <Feather
                          name={item.icon as never}
                          size={18}
                          color={isActive ? item.color : Colors.textSecondary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.navLabel,
                          { color: isActive ? Colors.text : Colors.textSecondary },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isActive && <View style={[styles.activeBar, { backgroundColor: item.color }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.footerItem}
                  onPress={() => navigate('/(tabs)/mais')}
                  activeOpacity={0.7}
                >
                  <Feather name="more-horizontal" size={18} color={Colors.textMuted} />
                  <Text style={styles.footerLabel}>Mais</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.footerItem}
                  activeOpacity={0.7}
                  onPress={close}
                >
                  <Feather name="x" size={18} color={Colors.textMuted} />
                  <Text style={styles.footerLabel}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </SidebarContext.Provider>
  );
}

export function SidebarToggle({ color }: { color?: string }) {
  const { open } = useSidebar();
  return (
    <TouchableOpacity style={styles.toggleBtn} onPress={open} activeOpacity={0.7}>
      <Feather name="menu" size={22} color={color ?? Colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: Colors.accent,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  appName: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  appSub: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  scoreBadge: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  scoreLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
  },
  criticalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.redDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  criticalText: {
    color: Colors.red,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  navSection: {
    flex: 1,
    gap: 2,
    marginTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  activeBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    marginTop: 8,
  },
  footerItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.bgMuted,
  },
  footerLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
