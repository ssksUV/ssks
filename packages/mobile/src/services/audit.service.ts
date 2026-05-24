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
    const remote = await get<AuditListItem[]>('/audits');
    await cacheRemoteAuditsList(remote);
    return remote;
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
    const remote = await get<AuditDetails>(`/audits/${auditId}`);
    await cacheRemoteAuditDetails(remote);
    return remote;
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