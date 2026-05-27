import { API_BASE_URL, get, patch, put } from './http';
import {
  cacheRemoteAuditDetails,
  cacheRemoteAuditTasks,
  cacheRemoteAuditsList,
  clearPendingSubmission,
  getOfflineAuditDetails,
  getOfflineAuditsList,
  getOfflineAuditTasks,
  readPendingSubmissions,
  reopenOfflineAudit,
  saveOfflineAuditDraft,
  saveOfflineAuditLocationSnapshot,
  saveOfflineAuditResults,
} from './offlineAuditStore';
import { getStoredToken } from './tokenStorage';

export type AuditStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED';

export type AuditListItem = {
  id: string;
  storeName: string;
  city: string;
  deadline: string;
  status: AuditStatus;
};

export type AuditCategorySummary = {
  id: string;
  name: string;
  itemsCount: number;
  completedCount: number;
};

export type AuditDetails = {
  id: string;
  storeName: string;
  city: string;
  deadline: string;
  status: AuditStatus;
  auditor: string;
  categories: AuditCategorySummary[];
  location?: AuditLocation | null;
  completedAt?: string;
};

export type ResultStatus = 'OK' | 'FAIL' | 'NA' | null;

export type AuditTask = {
  id: string;
  category: string;
  title: string;
  description: string;
  status: ResultStatus;
  note: string;
  responsiblePerson: string;
  photoUris: string[];
};

export type AuditLocation = {
  latitude: number;
  longitude: number;
  city?: string;
  capturedAt?: string;
};

export type SubmitAuditResultsPayload = {
  tasks: AuditTask[];
  location?: AuditLocation | null;
  completedAt?: string;
};

type BackendResultStatus = Exclude<ResultStatus, null>;

type BackendAuditResultPayload = {
  checklistItemId: string;
  status: BackendResultStatus;
  note?: string;
  photoUrl?: string;
};

function toMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

async function uploadPhotoIfNeeded(uri: string): Promise<string> {
  if (uri.startsWith('/uploads/') || uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  const token = await getStoredToken();
  const fileName = uri.split('/').pop() || `photo-${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append('photo', {
    uri,
    name: fileName,
    type: toMimeType(uri),
  } as unknown as Blob);

  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const raw = await response.text();
  const data = raw ? (JSON.parse(raw) as { error?: string; url?: string }) : {};

  if (!response.ok) {
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }

  if (typeof data.url !== 'string' || data.url.length === 0) {
    throw new Error('Brak URL po uploadzie zdjecia');
  }

  return data.url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, fallback = 'Brak danych'): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (isRecord(value)) {
    const firstName = value.firstName;
    const lastName = value.lastName;
    if (typeof firstName === 'string' || typeof lastName === 'string') {
      return [firstName, lastName].filter((part) => typeof part === 'string' && part.trim().length > 0).join(' ');
    }

    if (typeof value.name === 'string') {
      return value.name;
    }
  }
  return fallback;
}

function toAuditStatus(value: unknown): AuditStatus {
  if (value === 'NEW' || value === 'IN_PROGRESS' || value === 'COMPLETED') {
    return value;
  }
  return 'NEW';
}

function normalizeAuditListItem(item: unknown): AuditListItem | null {
  if (!isRecord(item)) {
    return null;
  }

  const store = isRecord(item.store) ? item.store : null;

  const id = asString(item.id, '').trim();
  if (!id) {
    return null;
  }

  return {
    id,
    storeName: asString(item.storeName ?? store?.name, 'Nieznany sklep'),
    city: asString(item.city ?? store?.city, 'Nieznane miasto'),
    deadline: asString(item.deadline, 'Brak terminu'),
    status: toAuditStatus(item.status),
  };
}

function normalizeAuditDetails(payload: unknown): AuditDetails {
  const item = isRecord(payload) ? payload : {};
  const store = isRecord(item.store) ? item.store : null;
  const template = isRecord(item.template) ? item.template : null;
  const templateCategories = Array.isArray(template?.categories) ? template.categories : [];
  const results = Array.isArray(item.results) ? item.results : [];

  const completedByChecklistItem = new Set<string>(
    results
      .map((result) => {
        if (!isRecord(result)) {
          return '';
        }
        const checklistItemId = result.checklistItemId;
        const status = result.status;
        if (typeof checklistItemId !== 'string' || !status) {
          return '';
        }
        return checklistItemId;
      })
      .filter((id) => id.length > 0),
  );

  const categories: AuditCategorySummary[] = templateCategories
    .map((category, index) => {
      if (!isRecord(category)) {
        return null;
      }
      const items = Array.isArray(category.items) ? category.items : [];
      const completedCount = items.filter((entry) => {
        if (!isRecord(entry) || typeof entry.id !== 'string') {
          return false;
        }
        return completedByChecklistItem.has(entry.id);
      }).length;

      return {
        id: asString(category.id, `cat-${index + 1}`),
        name: asString(category.name, `Kategoria ${index + 1}`),
        itemsCount: items.length,
        completedCount,
      };
    })
    .filter((category): category is AuditCategorySummary => category !== null);

  const gpsLat = typeof item.gpsLat === 'number' ? item.gpsLat : null;
  const gpsLng = typeof item.gpsLng === 'number' ? item.gpsLng : null;

  return {
    id: asString(item.id, ''),
    storeName: asString(item.storeName ?? store?.name, 'Nieznany sklep'),
    city: asString(item.city ?? store?.city, 'Nieznane miasto'),
    deadline: asString(item.deadline, 'Brak terminu'),
    status: toAuditStatus(item.status),
    auditor: asString(item.auditor, 'Nie przypisano'),
    categories,
    location:
      gpsLat !== null && gpsLng !== null
        ? {
            latitude: gpsLat,
            longitude: gpsLng,
            city: typeof item.resolvedAddress === 'string' ? item.resolvedAddress : undefined,
            capturedAt: typeof item.startedAt === 'string' ? item.startedAt : undefined,
          }
        : null,
    completedAt: typeof item.completedAt === 'string' ? item.completedAt : undefined,
  };
}

function toResultStatus(value: unknown): ResultStatus {
  if (value === 'OK' || value === 'FAIL' || value === 'NA') {
    return value;
  }
  return null;
}

function normalizeAuditTasksFromDetails(payload: unknown): AuditTask[] {
  const item = isRecord(payload) ? payload : {};
  const template = isRecord(item.template) ? item.template : null;
  const templateCategories = Array.isArray(template?.categories) ? template.categories : [];
  const results = Array.isArray(item.results) ? item.results : [];

  const resultsByChecklistItem = new Map<
    string,
    {
      status: ResultStatus;
      note: string;
      photoUrl?: string;
    }
  >();

  for (const result of results) {
    if (!isRecord(result) || typeof result.checklistItemId !== 'string') {
      continue;
    }

    resultsByChecklistItem.set(result.checklistItemId, {
      status: toResultStatus(result.status),
      note: typeof result.note === 'string' ? result.note : '',
      photoUrl: typeof result.photoUrl === 'string' ? result.photoUrl : undefined,
    });
  }

  const tasks: AuditTask[] = [];

  for (const category of templateCategories) {
    if (!isRecord(category)) {
      continue;
    }

    const categoryName = asString(category.name, 'Kategoria');
    const categoryItems = Array.isArray(category.items) ? category.items : [];

    for (const checklistItem of categoryItems) {
      if (!isRecord(checklistItem) || typeof checklistItem.id !== 'string') {
        continue;
      }

      const result = resultsByChecklistItem.get(checklistItem.id);
      const description = asString(checklistItem.description, 'Punkt kontroli');

      tasks.push({
        id: checklistItem.id,
        category: categoryName,
        title: description,
        description,
        status: result?.status ?? null,
        note: result?.note ?? '',
        responsiblePerson: '',
        photoUris: result?.photoUrl ? [result.photoUrl] : [],
      });
    }
  }

  return tasks;
}

function hasLocalProgress(tasks: AuditTask[]): boolean {
  return tasks.some(
    (task) =>
      task.status !== null ||
      task.note.trim().length > 0 ||
      task.photoUris.length > 0 ||
      task.responsiblePerson.trim().length > 0,
  );
}

function mergeTasksWithLocalProgress(baseTasks: AuditTask[], offlineTasks: AuditTask[] | null): AuditTask[] {
  if (!offlineTasks || offlineTasks.length === 0) {
    return baseTasks;
  }

  const offlineById = new Map(offlineTasks.map((task) => [task.id, task]));

  return baseTasks.map((task) => {
    const local = offlineById.get(task.id);
    if (!local) {
      return task;
    }

    const localHasProgress =
      local.status !== null ||
      local.note.trim().length > 0 ||
      local.photoUris.length > 0 ||
      local.responsiblePerson.trim().length > 0;

    if (!localHasProgress) {
      return task;
    }

    return {
      ...task,
      status: local.status,
      note: local.note,
      responsiblePerson: local.responsiblePerson,
      photoUris: local.photoUris,
    };
  });
}

function shouldFallbackToOffline(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorWithStatus = error as Error & { statusCode?: number };
  if (typeof errorWithStatus.statusCode === 'number') {
    const statusCode = errorWithStatus.statusCode;
    if (statusCode === 401 || statusCode === 403) {
      return false;
    }
    return statusCode === 404 || statusCode >= 500 || statusCode === 408 || statusCode === 429;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror')
  ) {
    return true;
  }

  const httpMatch = message.match(/http\s+(\d{3})/i);
  if (!httpMatch) {
    return false;
  }

  const statusCode = Number(httpMatch[1]);

  // Keep auth errors explicit; fallback for missing endpoint or transient backend problems.
  if (statusCode === 401 || statusCode === 403) {
    return false;
  }

  return statusCode === 404 || statusCode >= 500 || statusCode === 408 || statusCode === 429;
}

async function trySyncPendingSubmissions(): Promise<void> {
  const pending = await readPendingSubmissions();

  for (const submission of pending) {
    try {
      await syncSubmission(submission.auditId, submission.payload);
      await clearPendingSubmission(submission.createdAt);
    } catch {
      // Skip failed sync attempt and keep data in offline queue.
    }
  }
}

async function toBackendResults(tasks: AuditTask[]): Promise<BackendAuditResultPayload[]> {
  const results: BackendAuditResultPayload[] = [];

  for (const task of tasks) {
    if (task.status === null) {
      continue;
    }

    const noteParts = [task.note.trim()];
    if (task.responsiblePerson.trim().length > 0) {
      noteParts.push(`Odpowiedzialny: ${task.responsiblePerson.trim()}`);
    }

    let photoUrl: string | undefined;
    if (task.photoUris.length > 0) {
      photoUrl = await uploadPhotoIfNeeded(task.photoUris[0]);
    }

    results.push({
      checklistItemId: task.id,
      status: task.status,
      note: noteParts.filter((part) => part.length > 0).join('\n') || undefined,
      photoUrl,
    });
  }

  return results;
}

async function syncSubmission(auditId: string, payload: SubmitAuditResultsPayload): Promise<void> {
  const results = await toBackendResults(payload.tasks);

  try {
    await put<void>(`/audits/${auditId}/results`, { results });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    const canRetryAfterStart =
      message.includes('nie jest w toku') || message.includes('not in progress') || message.includes('http 409');

    if (!canRetryAfterStart) {
      throw error;
    }

    await patch<void>(`/audits/${auditId}/start`, {});
    await put<void>(`/audits/${auditId}/results`, { results });
  }

  try {
    await patch<void>(`/audits/${auditId}/complete`);
  } catch (error) {
    if (!shouldFallbackToOffline(error)) {
      throw error;
    }
  }

  const finalized = await get<unknown>(`/audits/${auditId}`);
  if (!isRecord(finalized) || finalized.status !== 'COMPLETED') {
    throw new Error('Audyt nie zostal oznaczony jako zakonczony na serwerze');
  }
}

export async function getMyAudits(): Promise<AuditListItem[]> {
  try {
    void trySyncPendingSubmissions().catch(() => undefined);
    const remote = await get<unknown[]>('/audits');
    const normalized = Array.isArray(remote)
      ? remote
          .map(normalizeAuditListItem)
          .filter((item): item is AuditListItem => item !== null)
      : [];
    await cacheRemoteAuditsList(normalized);
    return normalized;
  } catch (error) {
    if (!shouldFallbackToOffline(error)) {
      throw error;
    }
    return getOfflineAuditsList();
  }
}

export async function getActiveAudits(): Promise<AuditListItem[]> {
  const audits = await getMyAudits();
  return audits.filter((audit) => audit.status !== 'COMPLETED');
}

export async function getCompletedAudits(): Promise<AuditListItem[]> {
  try {
    void trySyncPendingSubmissions().catch(() => undefined);
    const remote = await get<unknown[]>('/audits');
    const normalized = Array.isArray(remote)
      ? remote
          .map(normalizeAuditListItem)
          .filter((item): item is AuditListItem => item !== null)
      : [];
    await cacheRemoteAuditsList(normalized);
  } catch (error) {
    if (!shouldFallbackToOffline(error)) {
      throw error;
    }
  }

  const audits = await getOfflineAuditsList();
  return audits.filter((audit) => audit.status === 'COMPLETED');
}

export async function getAuditDetails(auditId: string): Promise<AuditDetails> {
  try {
    const remote = await get<unknown>(`/audits/${auditId}`);
    const normalized = normalizeAuditDetails(remote);
    await cacheRemoteAuditDetails(normalized);
    return normalized;
  } catch (error) {
    if (!shouldFallbackToOffline(error)) {
      throw error;
    }
    return getOfflineAuditDetails(auditId);
  }
}

export async function getAuditTasks(
  auditId: string,
  options: { preferLocalProgress?: boolean } = {},
): Promise<AuditTask[]> {
  const preferLocalProgress = options.preferLocalProgress ?? true;

  let offlineTasks: AuditTask[] | null = null;

  try {
    offlineTasks = await getOfflineAuditTasks(auditId);
  } catch {
    offlineTasks = null;
  }

  try {
    const remote = await get<AuditTask[]>(`/audits/${auditId}/checklist`);

    if (preferLocalProgress && offlineTasks && hasLocalProgress(offlineTasks)) {
      const merged = mergeTasksWithLocalProgress(remote, offlineTasks);
      await cacheRemoteAuditTasks(auditId, merged);
      return merged;
    }

    await cacheRemoteAuditTasks(auditId, remote);
    return remote;
  } catch (error) {
    if (!shouldFallbackToOffline(error)) {
      throw error;
    }

    try {
      // Fallback for current backend: build tasks from audit details payload.
      const detailsPayload = await get<unknown>(`/audits/${auditId}`);
      const derivedTasks = normalizeAuditTasksFromDetails(detailsPayload);

      if (preferLocalProgress && offlineTasks && hasLocalProgress(offlineTasks)) {
        const merged = mergeTasksWithLocalProgress(derivedTasks, offlineTasks);
        await cacheRemoteAuditTasks(auditId, merged);
        return merged;
      }

      await cacheRemoteAuditTasks(auditId, derivedTasks);
      return derivedTasks;
    } catch (detailsError) {
      if (!shouldFallbackToOffline(detailsError)) {
        throw detailsError;
      }
    }

    if (offlineTasks) {
      return offlineTasks;
    }

    return getOfflineAuditTasks(auditId);
  }
}

export async function saveAuditDraft(auditId: string, tasks: AuditTask[]): Promise<void> {
  await saveOfflineAuditDraft(auditId, { tasks });
}

export async function submitAuditResults(
  auditId: string,
  tasks: AuditTask[],
  metadata?: Omit<SubmitAuditResultsPayload, 'tasks'>,
): Promise<void> {
  const payload: SubmitAuditResultsPayload = {
    tasks,
    ...(metadata ?? {}),
  };

  // Always save locally first (offline-first), then try API sync.
  await saveOfflineAuditResults(auditId, payload);

  await syncSubmission(auditId, payload);
  await trySyncPendingSubmissions();
}

export async function reopenAudit(auditId: string): Promise<void> {
  try {
    await patch<void>(`/audits/${auditId}/reopen`);
  } catch (error) {
    if (!shouldFallbackToOffline(error)) {
      throw error;
    }
  }

  await reopenOfflineAudit(auditId);
}

export async function saveAuditLocationSnapshot(auditId: string, location: AuditLocation | null): Promise<void> {
  await saveOfflineAuditLocationSnapshot(auditId, location);
}

export async function startAudit(auditId: string, location: AuditLocation | null): Promise<void> {
  const body = location
    ? {
        gpsLat: location.latitude,
        gpsLng: location.longitude,
        resolvedAddress: location.city,
      }
    : {};

  try {
    await patch<void>(`/audits/${auditId}/start`, body);
  } catch (error) {
    if (!shouldFallbackToOffline(error)) {
      throw error;
    }
  }
}