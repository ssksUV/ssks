import { get, post } from './http';
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

function shouldFallbackToOffline(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
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
      await post<void>(`/audits/${submission.auditId}/results`, submission.payload);
      await clearPendingSubmission(submission.createdAt);
    } catch {
      // Skip failed sync attempt and keep data in offline queue.
    }
  }
}

export async function getMyAudits(): Promise<AuditListItem[]> {
  try {
    await trySyncPendingSubmissions();
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
  const audits = await getMyAudits();
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

export async function getAuditTasks(auditId: string): Promise<AuditTask[]> {
  try {
    const remote = await get<AuditTask[]>(`/audits/${auditId}/checklist`);
    await cacheRemoteAuditTasks(auditId, remote);
    return remote;
  } catch (error) {
    if (!shouldFallbackToOffline(error)) {
      throw error;
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

  try {
    await post<void>(`/audits/${auditId}/results`, payload);
    await trySyncPendingSubmissions();
  } catch (error) {
    if (!shouldFallbackToOffline(error)) {
      throw error;
    }
  }
}

export async function reopenAudit(auditId: string): Promise<void> {
  await reopenOfflineAudit(auditId);
}

export async function saveAuditLocationSnapshot(auditId: string, location: AuditLocation | null): Promise<void> {
  await saveOfflineAuditLocationSnapshot(auditId, location);
}