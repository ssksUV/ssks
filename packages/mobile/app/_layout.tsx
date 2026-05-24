import { Slot } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import BottomNavBar from '../src/components/BottomNavBar';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';

export default function Layout() {
  return (
    <AuthProvider>
      <Content />
    </AuthProvider>
  );
}

function Content() {
  const { token, isReady } = useAuth();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
      </View>
    );
  }

  if (!token) {
    return <LoginScreen />;
  }
  return (
    <SafeAreaView style={styles.wrapper}>
      <Slot />
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingBottom: 60, // space for BottomNavBar height
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
});
