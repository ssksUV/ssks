import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const loggedEmail = typeof user?.email === 'string' ? user.email : 'brak danych';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>SSKS</Text>
        <Text style={styles.title}>Panel audytora</Text>
        <Text style={styles.subtitle}>Mobilna obsługa audytów sklepów</Text>
        <Text style={styles.loggedInfo}>Zalogowany: {loggedEmail}</Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/screens/Audits/MyAuditsScreen' as Href)}
          >
            <Text style={styles.primaryButtonText}>📋 Audyty do wykonania</Text>
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/screens/Audits/CompletedAuditsScreen' as Href)}
          >
            <Text style={styles.secondaryButtonText}>✅ Audyty wykonane</Text>
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => Alert.alert('Profil użytkownika', 'Ekran profilu dodamy w kolejnym kroku.')}
          >
            <Text style={styles.secondaryButtonText}>👤 Profil użytkownika</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#1677ff',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f1f1f',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#8c8c8c',
    marginTop: 8,
    marginBottom: 8,
  },
  loggedInfo: {
    fontSize: 12,
    textAlign: 'center',
    color: '#8c8c8c',
    marginBottom: 24,
  },
  buttonContainer: {
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 17,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1f1f1f',
    fontWeight: '600',
    fontSize: 17,
  },
});
