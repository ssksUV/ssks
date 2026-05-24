import * as FileSystem from 'expo-file-system';

import type { AuditDetails, AuditListItem, AuditTask, SubmitAuditResultsPayload } from './audit.service';

type OfflineAuditBundle = {
  audits: AuditDetails[];
  tasksByAuditId: Record<string, AuditTask[]>;
  pendingSubmissions: Array<{
    auditId: string;
    payload: SubmitAuditResultsPayload;
    createdAt: string;
  }>;
};

const OFFLINE_DIR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}audit-data/` : null;
const OFFLINE_FILE = OFFLINE_DIR ? `${OFFLINE_DIR}offline-audits.json` : null;

function createSeedData(): OfflineAuditBundle {
  const now = new Date();

  const audits: AuditDetails[] = [
    {
      id: 'offline-audit-1',
      storeName: 'Biedronka - Srodmiescie',
      city: 'Warszawa',
      deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'IN_PROGRESS',
      auditor: 'Audytor Mobilny',
      categories: [
        { id: 'cat-shelf', name: 'Polka', itemsCount: 2, completedCount: 0 },
        { id: 'cat-clean', name: 'Czystosc', itemsCount: 2, completedCount: 0 },
      ],
    },
    {
      id: 'offline-audit-2',
      storeName: 'Lidl - Mokotow',
      city: 'Warszawa',
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'NEW',
      auditor: 'Audytor Mobilny',
      categories: [
        { id: 'cat-prod', name: 'Produkty', itemsCount: 2, completedCount: 0 },
        { id: 'cat-safe', name: 'BHP', itemsCount: 1, completedCount: 0 },
      ],
    },
  ];

  const tasksByAuditId: Record<string, AuditTask[]> = {
    'offline-audit-1': [
      {
        id: 'offline-audit-1-task-1',
        category: 'Polka',
        title: 'Ekspozycja promocyjna przy wejsciu',
        description: 'Sprawdz, czy stand promocyjny jest kompletny i podpisany.',
        status: null,
        note: '',
        responsiblePerson: '',
        photoUris: [],
      },
      {
        id: 'offline-audit-1-task-2',
        category: 'Polka',
        title: 'Oznaczenia cenowe',
        description: 'Zweryfikuj czy etykiety cenowe sa aktualne i czytelne.',
        status: null,
        note: '',
        responsiblePerson: '',
        photoUris: [],
      },
      {
        id: 'offline-audit-1-task-3',
        category: 'Czystosc',
        title: 'Czystosc alejek',
        description: 'Sprawdz podloge i brak przeszkod dla klientow.',
        status: null,
        note: '',
        responsiblePerson: '',
        photoUris: [],
      },
      {
        id: 'offline-audit-1-task-4',
        category: 'Czystosc',
        title: 'Czystosc strefy kas',
        description: 'Zweryfikuj porzadek i stan stanowisk kasowych.',
        status: null,
        note: '',
        responsiblePerson: '',
        photoUris: [],
      },
    ],
    'offline-audit-2': [
      {
        id: 'offline-audit-2-task-1',
        category: 'Produkty',
        title: 'Daty waznosci nabialu',
        description: 'Skontroluj losowe pozycje nabialowe pod katem dat.',
        status: null,
        note: '',
        responsiblePerson: '',
        photoUris: [],
      },
      {
        id: 'offline-audit-2-task-2',
        category: 'Produkty',
        title: 'Ulozenie pieczywa',
        description: 'Ocena estetyki i uzupelnienia strefy pieczywa.',
        status: null,
        note: '',
        responsiblePerson: '',
        photoUris: [],
      },
      {
        id: 'offline-audit-2-task-3',
        category: 'BHP',
        title: 'Drogi ewakuacyjne',
        description: 'Potwierdz droznosc i oznaczenia drog ewakuacyjnych.',
        status: null,
        note: '',
        responsiblePerson: '',
        photoUris: [],
      },
    ],
  };

  return { audits, tasksByAuditId, pendingSubmissions: [] };
}

async function ensureFile(): Promise<void> {
  if (!OFFLINE_DIR || !OFFLINE_FILE) {
    throw new Error('Offline storage unavailable');
  }

  const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
  }

  const fileInfo = await FileSystem.getInfoAsync(OFFLINE_FILE);
  if (!fileInfo.exists) {
    await FileSystem.writeAsStringAsync(OFFLINE_FILE, JSON.stringify(createSeedData()));
  }
}

async function readBundle(): Promise<OfflineAuditBundle> {
  await ensureFile();

  if (!OFFLINE_FILE) {
    return createSeedData();
  }

  const raw = await FileSystem.readAsStringAsync(OFFLINE_FILE);
  if (!raw.trim()) {
    const seed = createSeedData();
    await writeBundle(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as OfflineAuditBundle;
    const normalized = normalizeBundle(parsed);

    if (normalized.changed) {
      await writeBundle(normalized.bundle);
    }

    return normalized.bundle;
  } catch {
    const seed = createSeedData();
    await writeBundle(seed);
    return seed;
  }
}

async function writeBundle(bundle: OfflineAuditBundle): Promise<void> {
  await ensureFile();

  if (!OFFLINE_FILE) {
    throw new Error('Offline storage unavailable');
  }

  await FileSystem.writeAsStringAsync(OFFLINE_FILE, JSON.stringify(bundle));
}

function toListItem(audit: AuditDetails): AuditListItem {
  return {
    id: audit.id,
    storeName: audit.storeName,
    city: audit.city,
    deadline: audit.deadline,
    status: audit.status,
  };
}

function recomputeCategories(tasks: AuditTask[]): AuditDetails['categories'] {
  const grouped = new Map<string, { total: number; done: number }>();

  for (const task of tasks) {
    const entry = grouped.get(task.category) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (task.status !== null) {
      entry.done += 1;
    }
    grouped.set(task.category, entry);
  }

  return Array.from(grouped.entries()).map(([category, values], index) => ({
    id: `cat-${index + 1}-${category.toLowerCase().replace(/\s+/g, '-')}`,
    name: category,
    itemsCount: values.total,
    completedCount: values.done,
  }));
}

function normalizeBundle(bundle: OfflineAuditBundle): { bundle: OfflineAuditBundle; changed: boolean } {
  let changed = false;

  const audits = bundle.audits.map((audit) => {
    if (audit.status !== 'COMPLETED' || audit.completedAt) {
      return audit;
    }

    const tasks = bundle.tasksByAuditId[audit.id] ?? [];
    const normalizedStatus = computeDraftStatus(tasks);

    changed = true;
    return {
      ...audit,
      status: normalizedStatus,
      completedAt: undefined,
    };
  });

  if (!changed) {
    return { bundle, changed: false };
  }

  return {
    changed: true,
    bundle: {
      ...bundle,
      audits,
    },
  };
}

function computeDraftStatus(tasks: AuditTask[]): AuditListItem['status'] {
  if (tasks.length === 0) {
    return 'NEW';
  }

  const completedCount = tasks.filter((task) => task.status !== null).length;
  return completedCount > 0 ? 'IN_PROGRESS' : 'NEW';
}

export async function getOfflineAuditsList(): Promise<AuditListItem[]> {
  const bundle = await readBundle();
  return bundle.audits.map(toListItem);
}

export async function cacheRemoteAuditsList(list: AuditListItem[]): Promise<void> {
  const bundle = await readBundle();

  for (const item of list) {
    const index = bundle.audits.findIndex((audit) => audit.id === item.id);

    if (index >= 0) {
      bundle.audits[index] = {
        ...bundle.audits[index],
        id: item.id,
        storeName: item.storeName,
        city: item.city,
        deadline: item.deadline,
        status: item.status,
      };
    } else {
      bundle.audits.push({
        id: item.id,
        storeName: item.storeName,
        city: item.city,
        deadline: item.deadline,
        status: item.status,
        auditor: 'Nie przypisano',
        categories: [],
      });
    }
  }

  await writeBundle(bundle);
}

export async function getOfflineAuditDetails(auditId: string): Promise<AuditDetails> {
  const bundle = await readBundle();
  const audit = bundle.audits.find((item) => item.id === auditId);

  if (!audit) {
    throw new Error('Nie znaleziono audytu offline');
  }

  const tasks = bundle.tasksByAuditId[auditId] ?? [];
  return {
    ...audit,
    categories: recomputeCategories(tasks),
  };
}

export async function cacheRemoteAuditDetails(details: AuditDetails): Promise<void> {
  const bundle = await readBundle();
  const index = bundle.audits.findIndex((audit) => audit.id === details.id);

  if (index >= 0) {
    bundle.audits[index] = details;
  } else {
    bundle.audits.push(details);
  }

  await writeBundle(bundle);
}

export async function getOfflineAuditTasks(auditId: string): Promise<AuditTask[]> {
  const bundle = await readBundle();
  const tasks = bundle.tasksByAuditId[auditId];

  if (!tasks) {
    throw new Error('Nie znaleziono punktow audytu offline');
  }

  return tasks;
}

export async function cacheRemoteAuditTasks(auditId: string, tasks: AuditTask[]): Promise<void> {
  const bundle = await readBundle();
  bundle.tasksByAuditId[auditId] = tasks;

  const targetAuditIndex = bundle.audits.findIndex((item) => item.id === auditId);
  if (targetAuditIndex >= 0) {
    bundle.audits[targetAuditIndex] = {
      ...bundle.audits[targetAuditIndex],
      categories: recomputeCategories(tasks),
    };
  }

  await writeBundle(bundle);
}

async function ensureAuditExists(bundle: OfflineAuditBundle, auditId: string): Promise<void> {
  const exists = bundle.audits.some((item) => item.id === auditId);
  if (!exists) {
    bundle.audits.push({
      id: auditId,
      storeName: 'Audyt offline',
      city: 'Nieznane',
      deadline: new Date().toISOString(),
      status: 'IN_PROGRESS',
      auditor: 'Audytor Mobilny',
      categories: [],
    });
  }

  if (!bundle.tasksByAuditId[auditId]) {
    bundle.tasksByAuditId[auditId] = [];
  }
}

export async function saveOfflineAuditResults(auditId: string, payload: SubmitAuditResultsPayload): Promise<void> {
  const bundle = await readBundle();
  await ensureAuditExists(bundle, auditId);

  bundle.tasksByAuditId[auditId] = payload.tasks;

  const targetAuditIndex = bundle.audits.findIndex((item) => item.id === auditId);
  if (targetAuditIndex >= 0) {
    bundle.audits[targetAuditIndex] = {
      ...bundle.audits[targetAuditIndex],
      categories: recomputeCategories(payload.tasks),
      status: 'COMPLETED',
      location: payload.location ?? bundle.audits[targetAuditIndex].location ?? null,
      completedAt: payload.completedAt ?? new Date().toISOString(),
    };
  }

  bundle.pendingSubmissions.push({
    auditId,
    payload,
    createdAt: new Date().toISOString(),
  });

  await writeBundle(bundle);
}

export async function saveOfflineAuditDraft(
  auditId: string,
  payload: Pick<SubmitAuditResultsPayload, 'tasks'>,
): Promise<void> {
  const bundle = await readBundle();
  await ensureAuditExists(bundle, auditId);

  bundle.tasksByAuditId[auditId] = payload.tasks;

  const targetAuditIndex = bundle.audits.findIndex((item) => item.id === auditId);
  if (targetAuditIndex >= 0) {
    bundle.audits[targetAuditIndex] = {
      ...bundle.audits[targetAuditIndex],
      categories: recomputeCategories(payload.tasks),
      status: computeDraftStatus(payload.tasks),
    };
  }

  await writeBundle(bundle);
}

export async function reopenOfflineAudit(auditId: string): Promise<void> {
  const bundle = await readBundle();
  const targetAuditIndex = bundle.audits.findIndex((item) => item.id === auditId);

  if (targetAuditIndex < 0) {
    throw new Error('Nie znaleziono audytu do przywrocenia');
  }

  const tasks = bundle.tasksByAuditId[auditId] ?? [];
  bundle.audits[targetAuditIndex] = {
    ...bundle.audits[targetAuditIndex],
    status: computeDraftStatus(tasks),
    completedAt: undefined,
  };

  await writeBundle(bundle);
}

export async function saveOfflineAuditLocationSnapshot(
  auditId: string,
  location: { latitude: number; longitude: number; city?: string; capturedAt?: string } | null,
): Promise<void> {
  const bundle = await readBundle();
  await ensureAuditExists(bundle, auditId);

  const targetAuditIndex = bundle.audits.findIndex((item) => item.id === auditId);
  if (targetAuditIndex < 0) {
    throw new Error('Nie znaleziono audytu do zapisu GPS');
  }

  bundle.audits[targetAuditIndex] = {
    ...bundle.audits[targetAuditIndex],
    location,
  };

  await writeBundle(bundle);
}

export async function readPendingSubmissions(): Promise<
  Array<{ auditId: string; payload: SubmitAuditResultsPayload; createdAt: string }>
> {
  const bundle = await readBundle();
  return bundle.pendingSubmissions;
}

export async function clearPendingSubmission(createdAt: string): Promise<void> {
  const bundle = await readBundle();
  bundle.pendingSubmissions = bundle.pendingSubmissions.filter((entry) => entry.createdAt !== createdAt);
  await writeBundle(bundle);
}
