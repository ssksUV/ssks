import { Slot } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import BottomNavBar from '../src/components/BottomNavBar';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function Layout() {
  return (
    <AuthProvider>
      <Content />
    </AuthProvider>
  );
}

function Content() {
  const { token, isReady } = useAuth();

  return (
    <SafeAreaView style={styles.wrapper}>
      <Slot />
      {isReady && token ? <BottomNavBar /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingBottom: 60,
  },
});
