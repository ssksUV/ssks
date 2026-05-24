import React, { useState } from 'react';
import { SafeAreaView, View, TextInput, Image, Pressable, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      router.replace('/screens/Home/HomeScreen');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się zalogować');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.kicker}>SSKS APP</Text>
        <Text style={styles.title}>Logowanie</Text>
        <Text style={styles.subtitle}>Mobilny panel audytora</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Wpisz e-mail"
            placeholderTextColor="#8c8c8c"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Hasło</Text>
          <TextInput
            style={styles.input}
            placeholder="Wpisz hasło"
            placeholderTextColor="#8c8c8c"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Logowanie...' : 'Zaloguj się'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 16,
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
    color: '#1f1f1f',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#8c8c8c',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  formGroup: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f1f1f',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    fontSize: 16,
    color: '#1f1f1f',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#1677ff',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorText: {
    width: '100%',
    color: '#cf1322',
    marginBottom: 12,
    fontSize: 14,
  },
});
