import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import {
  AuditDetails,
  getAuditDetails,
  getAuditTasks,
  reopenAudit,
  saveAuditLocationSnapshot,
  startAudit,
  submitAuditResults,
} from '../../../src/services/audit.service';
import { useAuth } from '../../../src/context/AuthContext';
import { useCurrentLocation } from '../../../src/hooks/useLocation';

export default function AuditDetailsScreen() {
  const router = useRouter();
  const { auditId } = useLocalSearchParams<{ auditId?: string }>();
  const [audit, setAudit] = useState<AuditDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLabel, setGpsLabel] = useState('Pobieranie GPS...');
  const [gpsData, setGpsData] = useState<{ latitude: number; longitude: number; city?: string } | null>(null);
  const { user } = useAuth();
  const { getLocation } = useCurrentLocation();

  const toDisplayText = (value: unknown, fallback = 'Brak danych') => {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const firstName = typeof record.firstName === 'string' ? record.firstName : '';
      const lastName = typeof record.lastName === 'string' ? record.lastName : '';
      const fullName = [firstName, lastName].filter((part) => part.trim().length > 0).join(' ').trim();
      if (fullName) {
        return fullName;
      }
      if (typeof record.name === 'string') {
        return record.name;
      }
    }
    return fallback;
  };

  const formatGpsLabel = (location: { latitude: number; longitude: number; city?: string }, prefix = 'GPS') => {
    const city = location.city?.trim();
    const cityPart = city && city.length > 0 ? city : 'Nieznane miasto';
    return `${prefix}: ${cityPart} (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`;
  };

  const loadAudit = useCallback(async () => {
    if (!auditId) {
      setError('Brak identyfikatora audytu');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAuditDetails(auditId);
      setAudit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się pobrać audytu');
    } finally {
      setLoading(false);
    }
  }, [auditId]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  useFocusEffect(
    useCallback(() => {
      void loadAudit();
    }, [loadAudit]),
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const refreshGpsOnEntry = async () => {
        if (audit?.status === 'COMPLETED') {
          if (audit.location) {
            setGpsData(audit.location);
            setGpsLabel(formatGpsLabel(audit.location, 'GPS zapisany'));
          } else {
            setGpsData(null);
            setGpsLabel('GPS zapisany: brak danych');
          }
          return;
        }

        if (!audit?.id) {
          return;
        }

        setGpsLabel('Pobieranie GPS...');

        try {
          const location = await getLocation({ forceFresh: true });

          if (!isMounted) {
            return;
          }

          if (!location) {
            setGpsData(null);
            setGpsLabel('GPS: brak dostepu');
            return;
          }

          const capturedAt = new Date().toISOString();

          await saveAuditLocationSnapshot(audit.id, {
            latitude: location.latitude,
            longitude: location.longitude,
            city: location.city,
            capturedAt,
          });

          setGpsData(location);
          setGpsLabel(formatGpsLabel(location));
          setAudit((prev) =>
            prev
              ? {
                  ...prev,
                  location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    city: location.city,
                    capturedAt,
                  },
                }
              : prev,
          );
        } catch {
          if (isMounted) {
            setGpsData(null);
            setGpsLabel('GPS: nie udalo sie pobrac lokalizacji');
          }
        }
      };

      void refreshGpsOnEntry();

      return () => {
        isMounted = false;
      };
    }, [audit?.id, audit?.status]),
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
      </View>
    );
  }

  if (!audit) {
    return (
      <View style={styles.container}>
        <Text style={styles.kicker}>SSKS</Text>
        <Text style={styles.title}>Karta audytu</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  const isCompleted = audit.status === 'COMPLETED';
  const userRole = user?.role;
  const canFinalize = userRole === 'AUDITOR';
  const canReopen = userRole === 'MANAGER' || userRole === 'ADMIN';
  const storeNameLabel = toDisplayText((audit as unknown as Record<string, unknown>).storeName, 'Nieznany sklep');
  const cityLabel = toDisplayText((audit as unknown as Record<string, unknown>).city, 'Nieznane miasto');
  const deadlineLabel = toDisplayText((audit as unknown as Record<string, unknown>).deadline, 'Brak terminu');
  const auditorLabel = toDisplayText((audit as unknown as Record<string, unknown>).auditor, 'Nie przypisano');
  const statusLabel = toDisplayText((audit as unknown as Record<string, unknown>).status, 'Brak statusu');

  const handleFinalizeAudit = async () => {
    try {
      if (!canFinalize) {
        setError('Tylko audytor moze zapisac i zamknac audyt.');
        Alert.alert('Brak uprawnień', 'Tylko audytor moze zapisac i zamknac audyt.');
        return;
      }

      setFinalizing(true);

      if (audit.status === 'NEW') {
        await startAudit(
          audit.id,
          gpsData
            ? {
                latitude: gpsData.latitude,
                longitude: gpsData.longitude,
                city: gpsData.city,
                capturedAt: new Date().toISOString(),
              }
            : null,
        );
      }

      let tasks = await getAuditTasks(audit.id);

      if (tasks.some((task) => task.status === null)) {
        // If local draft is stale/incomplete, use server snapshot for finalization.
        tasks = await getAuditTasks(audit.id, { preferLocalProgress: false });
      }

      if (tasks.some((task) => task.status === null)) {
        setError('Uzupelnij wszystkie punkty audytu przed finalnym zapisem.');
        return;
      }

      await submitAuditResults(audit.id, tasks, {
        location: gpsData
          ? {
              latitude: gpsData.latitude,
              longitude: gpsData.longitude,
              city: gpsData.city,
              capturedAt: new Date().toISOString(),
            }
          : null,
        completedAt: new Date().toISOString(),
      });

      router.replace('/screens/Audits/MyAuditsScreen');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udalo sie zapisac audytu';
      setError(message);
      Alert.alert('Błąd zapisu audytu', message);
    } finally {
      setFinalizing(false);
    }
  };

  const handleOpenTasks = () => {
    router.push({
      pathname: '/screens/Audits/AuditCarouselScreen',
      params: {
        auditId: audit.id,
        readonly: isCompleted ? 'true' : 'false',
      },
    });
  };

  const handleReopenAudit = async () => {
    try {
      setFinalizing(true);
      await reopenAudit(audit.id);
      const nextScreen = userRole === 'MANAGER' || userRole === 'ADMIN'
        ? '/screens/Audits/CompletedAuditsScreen'
        : '/screens/Audits/MyAuditsScreen';
      router.replace(nextScreen);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udalo sie przywrocic audytu');
    } finally {
      setFinalizing(false);
    }
  };

  const actionSection = !isCompleted ? (
    <View style={styles.actionBlock}>
      <Pressable style={styles.primaryButton} onPress={handleOpenTasks}>
        <Text style={styles.primaryButtonText}>{canFinalize ? 'Edytuj karte audytu' : 'Podglad zadan audytu'}</Text>
      </Pressable>

      {canFinalize ? (
        <Pressable
          style={[styles.secondaryButton, finalizing && styles.buttonDisabled]}
          onPress={handleFinalizeAudit}
          disabled={finalizing}
        >
          <Text style={styles.secondaryButtonText}>{finalizing ? 'Zapisywanie...' : 'Zapisz audyt'}</Text>
        </Pressable>
      ) : (
        <View style={styles.readonlyBox}>
          <Text style={styles.readonlyText}>Tylko audytor przypisany do audytu moze go zamknac.</Text>
        </View>
      )}
    </View>
  ) : (
    <View style={styles.actionBlock}>
      <View style={styles.readonlyBox}>
        <Text style={styles.readonlyText}>Audyt zakonczony - podglad tylko do odczytu.</Text>
      </View>

          <Pressable style={styles.primaryButton} onPress={handleOpenTasks}>
        <Text style={styles.primaryButtonText}>Przejdz do podgladu zadan</Text>
      </Pressable>

      {canReopen ? (
        <Pressable
          style={[styles.secondaryButton, finalizing && styles.buttonDisabled]}
          onPress={handleReopenAudit}
          disabled={finalizing}
        >
          <Text style={styles.secondaryButtonText}>{finalizing ? 'Przywracanie...' : 'Wroc do wykonania'}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>SSKS</Text>
      <Text style={styles.title}>Karta audytu</Text>
      <Text style={styles.subtitle}>Szczegóły audytu sklepu</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryTitleWrapper}>
            <Text style={styles.storeName}>{storeNameLabel}</Text>
            <Text style={styles.gpsText}>{gpsLabel}</Text>
            <Text style={styles.city}>{cityLabel}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Termin:</Text>
          <Text style={styles.metaValue}>{deadlineLabel}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Audytor:</Text>
          <Text style={styles.metaValue}>{auditorLabel}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Kategorie audytu</Text>

      <FlatList
        data={audit.categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={styles.listFooter}>{actionSection}</View>}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryCounter}>
                {item.completedCount}/{item.itemsCount}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(item.completedCount / item.itemsCount) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryTitleWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  city: {
    fontSize: 14,
    color: '#8c8c8c',
    marginTop: 4,
  },
  gpsText: {
    fontSize: 13,
    color: '#595959',
    marginTop: 6,
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#e6f4ff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 8,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 12,
  },
  errorText: {
    color: '#cf1322',
    marginTop: 8,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 112,
  },
  listFooter: {
    marginTop: 6,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f1f1f',
    paddingRight: 12,
  },
  categoryCounter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1677ff',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1677ff',
  },
  primaryButton: {
    backgroundColor: '#1677ff',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  actionBlock: {
    gap: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#1677ff',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#1677ff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  readonlyBox: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  readonlyText: {
    color: '#595959',
    fontSize: 14,
  },
});