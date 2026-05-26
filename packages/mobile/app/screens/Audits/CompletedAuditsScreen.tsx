import { useCallback, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { AuditListItem, getCompletedAudits } from '../../../src/services/audit.service';

function toDisplayText(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.name === 'string') {
      return record.name;
    }
    const firstName = typeof record.firstName === 'string' ? record.firstName : '';
    const lastName = typeof record.lastName === 'string' ? record.lastName : '';
    const fullName = [firstName, lastName].filter((part) => part.trim().length > 0).join(' ').trim();
    if (fullName) {
      return fullName;
    }
  }
  return fallback;
}

export default function CompletedAuditsScreen() {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAudits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCompletedAudits();
      setAudits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udalo sie pobrac zakonczonych audytow');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAudits();
    }, [loadAudits]),
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>SSKS</Text>
      <Text style={styles.title}>Audyty wykonane</Text>
      <Text style={styles.subtitle}>Lista zakonczonych audytow (podglad)</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={audits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Brak zakonczonych audytow.</Text>}
        renderItem={({ item }) => {
          const storeName = toDisplayText((item as unknown as Record<string, unknown>).storeName, 'Nieznany sklep');
          const city = toDisplayText((item as unknown as Record<string, unknown>).city, 'Nieznane miasto');
          const deadline = toDisplayText((item as unknown as Record<string, unknown>).deadline, 'Brak terminu');

          return <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrapper}>
                <Text style={styles.storeName}>{storeName}</Text>
                <Text style={styles.city}>{city}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Zakonczony</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Termin:</Text>
              <Text style={styles.metaValue}>{deadline}</Text>
            </View>

            <Pressable
              style={styles.openButton}
              onPress={() =>
                router.push({ pathname: '/screens/Audits/AuditDetailsScreen', params: { auditId: item.id } })
              }
            >
              <Text style={styles.openButtonText}>Podglad audytu</Text>
            </Pressable>
          </View>;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#1677ff',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  subtitle: {
    fontSize: 15,
    color: '#8c8c8c',
    marginTop: 6,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  errorText: {
    color: '#cf1322',
    marginBottom: 12,
    fontSize: 14,
  },
  emptyText: {
    color: '#8c8c8c',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitleWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  city: {
    fontSize: 14,
    color: '#8c8c8c',
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f6ffed',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#595959',
    marginRight: 6,
  },
  metaValue: {
    fontSize: 14,
    color: '#595959',
  },
  openButton: {
    backgroundColor: '#1677ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  openButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
