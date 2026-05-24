import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Ups! Tego ekranu nie ma.</Text>
        <Text style={styles.subtitle}>
          Wygląda na to, że podany adres nie istnieje lub został przeniesiony.
        </Text>
        <Link href="/screens/LoginScreen" asChild>
          <Text style={styles.button}>Wróć do logowania</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f6f8fa',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#22223b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4a4e69',
    marginBottom: 30,
    textAlign: 'center',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#2e78b7',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    fontSize: 16,
    fontWeight: 'bold',
    overflow: 'hidden',
    elevation: 2, // cień na Androidzie
    shadowColor: '#000', // cień na iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    textAlign: 'center',
  },
});
