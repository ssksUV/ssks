import React from 'react';
import { SafeAreaView, View, Pressable, StyleSheet } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

export default function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const isHomeScreen = pathname.includes('/screens/Home/HomeScreen');

  const handleLogout = async () => {
    await logout();
    router.replace('/screens/LoginScreen' as Href);
  };

  if (isHomeScreen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.homeOnlyContainerNav}>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.containerNav}>
        <Pressable onPress={() => router.back()} style={styles.sideButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <View style={styles.centerButtonWrapper}>
          <Pressable
            onPress={() => router.replace('/screens/Home/HomeScreen' as Href)}
            style={styles.homeButton}
          >
            <Ionicons name="home" size={32} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.sideButton} />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1677ff',
  },
  containerNav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  homeOnlyContainerNav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1677ff',
    elevation: 2,
  },
  sideButton: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1677ff',
    elevation: 2,
  },
});
