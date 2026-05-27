import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuditTask, getAuditTasks, saveAuditDraft } from '../../../src/services/audit.service';
import { API_BASE_URL } from '../../../src/services/http';
import { useAuth } from '../../../src/context/AuthContext';
import { useCameraCapture } from '../../../src/hooks/useCamera';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function resolvePhotoUri(uri: string): string {
  if (uri.startsWith('/uploads/')) {
    return `${API_ORIGIN}${uri}`;
  }
  return uri;
}

export default function AuditCarouselScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { auditId, readonly } = useLocalSearchParams<{
    auditId?: string;
    readonly?: string;
  }>();
  const { user } = useAuth();
  const isReadonly = readonly === 'true' || user?.role !== 'AUDITOR';
  const [tasks, setTasks] = useState<AuditTask[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { takePhoto } = useCameraCapture();

  useEffect(() => {
    if (!auditId) {
      setError('Brak identyfikatora audytu');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAuditTasks(auditId);
        if (isMounted) {
          setTasks(data);
          setCurrentIndex(0);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Nie udało się pobrać audytu');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, [auditId]);

  const currentTask = tasks[currentIndex];
  const completedCount = useMemo(() => tasks.filter((task) => task.status !== null).length, [tasks]);
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const updateCurrentTask = (changes: Partial<AuditTask>) => {
    setTasks((previousTasks) =>
      previousTasks.map((task, index) => (index === currentIndex ? { ...task, ...changes } : task)),
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((previousIndex) => Math.max(previousIndex - 1, 0));
  };

  const goToNext = () => {
    setCurrentIndex((previousIndex) => Math.min(previousIndex + 1, tasks.length - 1));
  };

  const handleSaveAndExit = async () => {
    if (!auditId) {
      return;
    }

    try {
      setSaving(true);
      await saveAuditDraft(auditId, tasks);
      Alert.alert('Zapisano', `Zapisano postep: ${completedCount}/${tasks.length} punktow.`);
      router.back();
    } catch (err) {
      Alert.alert('Błąd', err instanceof Error ? err.message : 'Nie udało się zapisać postepu');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!currentTask) {
      return;
    }

    const photoUri = await takePhoto();
    if (!photoUri) {
      Alert.alert('Brak zdjecia', 'Nie udalo sie dodac zdjecia z aparatu ani galerii.');
      return;
    }

    updateCurrentTask({ photoUris: [...currentTask.photoUris, photoUri] });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
      </View>
    );
  }

  if (error || !currentTask) {
    return (
      <View style={styles.container}>
        <Text style={styles.kicker}>SSKS</Text>
        <Text style={styles.title}>Punkt kontroli</Text>
        <Text style={styles.subtitle}>Karta audytu sklepu</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>SSKS</Text>
      <Text style={styles.title}>Punkt kontroli</Text>
      <Text style={styles.subtitle}>Karta audytu sklepu</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {currentIndex + 1} z {tasks.length}
          </Text>
          <Text style={styles.progressText}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.taskCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{currentTask.category}</Text>
          </View>

          <Text style={styles.taskTitle}>{currentTask.title}</Text>
          <Text style={styles.taskDescription}>{currentTask.description}</Text>

          <Text style={styles.sectionLabel}>Wynik kontroli</Text>
          <View style={styles.statusRow}>
            <Pressable
              style={[styles.statusButton, currentTask.status === 'OK' && styles.statusButtonOkActive]}
              onPress={() => updateCurrentTask({ status: 'OK' })}
              disabled={isReadonly}
            >
              <Text style={[styles.statusButtonText, currentTask.status === 'OK' && styles.statusButtonTextActive]}>
                OK
              </Text>
            </Pressable>

            <Pressable
              style={[styles.statusButton, currentTask.status === 'FAIL' && styles.statusButtonFailActive]}
              onPress={() => updateCurrentTask({ status: 'FAIL' })}
              disabled={isReadonly}
            >
              <Text style={[styles.statusButtonText, currentTask.status === 'FAIL' && styles.statusButtonTextActive]}>
                FAIL
              </Text>
            </Pressable>

            <Pressable
              style={[styles.statusButton, currentTask.status === 'NA' && styles.statusButtonNaActive]}
              onPress={() => updateCurrentTask({ status: 'NA' })}
              disabled={isReadonly}
            >
              <Text style={[styles.statusButtonText, currentTask.status === 'NA' && styles.statusButtonTextActive]}>
                N/A
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Notatka</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Dodaj komentarz do punktu kontroli"
            placeholderTextColor="#8c8c8c"
            multiline
            value={currentTask.note}
            onChangeText={(text) => updateCurrentTask({ note: text })}
            editable={!isReadonly}
          />

          <Text style={styles.sectionLabel}>Osoba odpowiedzialna</Text>
          <TextInput
            style={styles.input}
            placeholder="np. Kierownik sklepu"
            placeholderTextColor="#8c8c8c"
            value={currentTask.responsiblePerson}
            onChangeText={(text) => updateCurrentTask({ responsiblePerson: text })}
            editable={!isReadonly}
          />

          <Text style={styles.sectionLabel}>Zdjecia</Text>
          {!isReadonly ? (
            <Pressable style={styles.secondaryButton} onPress={handleAddPhoto}>
              <Text style={styles.secondaryButtonText}>📷 Dodaj zdjecie</Text>
            </Pressable>
          ) : null}

          {currentTask.photoUris.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
              {currentTask.photoUris.map((photoUri) => (
                <Image key={photoUri} source={{ uri: resolvePhotoUri(photoUri) }} style={styles.photoThumbnail} />
              ))}
            </ScrollView>
          )}

          <Text style={styles.photoHint}>Dodane zdjęcia: {currentTask.photoUris.length}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 36 + insets.bottom }]}>
        <Pressable
          style={[styles.footerButton, currentIndex === 0 && styles.footerButtonDisabled]}
          onPress={goToPrevious}
          disabled={currentIndex === 0}
        >
          <Text style={styles.footerButtonText}>Poprzednie</Text>
        </Pressable>

        {currentIndex === tasks.length - 1 ? (
          isReadonly ? (
            <Pressable style={styles.primaryButton} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Wroc</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryButton, saving && styles.buttonDisabled]}
              onPress={handleSaveAndExit}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>{saving ? 'Zapisywanie...' : 'Zapisz'}</Text>
            </Pressable>
          )
        ) : (
          <Pressable style={styles.primaryButton} onPress={goToNext}>
            <Text style={styles.primaryButtonText}>Następne</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 16,
  },
  errorText: {
    color: '#cf1322',
    marginTop: 8,
    fontSize: 14,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#595959',
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1677ff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f4ff',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  categoryBadgeText: {
    color: '#1677ff',
    fontSize: 12,
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 15,
    color: '#595959',
    lineHeight: 21,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 8,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  statusButtonOkActive: {
    backgroundColor: '#52c41a',
    borderColor: '#52c41a',
  },
  statusButtonFailActive: {
    backgroundColor: '#ff4d4f',
    borderColor: '#ff4d4f',
  },
  statusButtonNaActive: {
    backgroundColor: '#8c8c8c',
    borderColor: '#8c8c8c',
  },
  statusButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  noteInput: {
    width: '100%',
    minHeight: 96,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    fontSize: 15,
    color: '#1f1f1f',
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    fontSize: 15,
    color: '#1f1f1f',
    marginBottom: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#1f1f1f',
    fontSize: 15,
    fontWeight: '700',
  },
  photoList: {
    marginTop: 12,
  },
  photoThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  photoHint: {
    fontSize: 13,
    color: '#8c8c8c',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 4,
  },
  footerButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  footerButtonDisabled: {
    opacity: 0.45,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1677ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});