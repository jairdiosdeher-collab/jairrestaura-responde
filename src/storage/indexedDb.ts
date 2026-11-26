import { EMPTY_PROFILE } from '../data/microinterventions';
import type {
  AccompanimentSettings,
  ExerciseProgressEntry,
  PsychologicalProfile,
  SessionRecord,
} from '../types/jairrestaura';

const DB_NAME = 'jairrestaura_db';
const DB_VERSION = 1;

const STORES = {
  META: 'meta',
  SESSIONS: 'sessions',
  EXERCISE_PROGRESS: 'exerciseProgress',
} as const;

export const LEGACY_STORAGE_KEYS = {
  SESSIONS: 'jairrestaura_sessions_v1',
  ACTIVE_SESSION: 'jairrestaura_active_session_v1',
  PROFILE: 'jairrestaura_profile_v1',
  SETTINGS: 'jairrestaura_settings_v1',
};

export const THEME_HINT_KEY = 'jairrestaura_theme_hint';

export interface PersistedWorkspaceState {
  sessions: SessionRecord[];
  activeSessionId: string;
  profile: PsychologicalProfile;
  settings: AccompanimentSettings;
  exerciseProgress: ExerciseProgressEntry[];
  favoriteResourceIds: string[];
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este entorno.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META);
      }
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.EXERCISE_PROGRESS)) {
        db.createObjectStore(STORES.EXERCISE_PROGRESS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Error abriendo IndexedDB.'));
  });
}

async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(storeName: string, value: unknown, key?: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    if (key !== undefined) {
      store.put(value, key);
    } else {
      store.put(value);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbReplaceAllSessions(sessions: SessionRecord[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SESSIONS, 'readwrite');
    const store = tx.objectStore(STORES.SESSIONS);
    store.clear();
    for (const session of sessions) {
      store.put(session);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function safeReadLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function loadWorkspaceFromIndexedDB(
  defaultSettings: AccompanimentSettings,
  createFallbackSession: () => SessionRecord
): Promise<PersistedWorkspaceState> {
  try {
    const [storedProfile, storedSettings, storedActiveId, storedFavorites, storedSessions, storedProgress] =
      await Promise.all([
        idbGet<PsychologicalProfile>(STORES.META, 'profile'),
        idbGet<AccompanimentSettings>(STORES.META, 'settings'),
        idbGet<string>(STORES.META, 'activeSessionId'),
        idbGet<string[]>(STORES.META, 'favoriteResourceIds'),
        idbGetAll<SessionRecord>(STORES.SESSIONS),
        idbGetAll<ExerciseProgressEntry>(STORES.EXERCISE_PROGRESS),
      ]);

    // Migrate legacy localStorage data if IndexedDB is empty
    const legacySessions = safeReadLocalStorage<SessionRecord[]>(LEGACY_STORAGE_KEYS.SESSIONS);
    const legacyProfile = safeReadLocalStorage<PsychologicalProfile>(LEGACY_STORAGE_KEYS.PROFILE);
    const legacySettings = safeReadLocalStorage<AccompanimentSettings>(LEGACY_STORAGE_KEYS.SETTINGS);
    const legacyActiveId = safeReadLocalStorage<string>(LEGACY_STORAGE_KEYS.ACTIVE_SESSION);

    const sessions =
      storedSessions.length > 0
        ? storedSessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        : legacySessions && legacySessions.length > 0
          ? legacySessions
          : [createFallbackSession()];

    const profile = storedProfile || legacyProfile || EMPTY_PROFILE;
    const settings: AccompanimentSettings = {
      ...defaultSettings,
      ...(storedSettings || legacySettings || {}),
    };
    const activeSessionId = storedActiveId || legacyActiveId || sessions[0].id;
    const favoriteResourceIds = storedFavorites || [];
    const exerciseProgress = storedProgress.sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt)
    );

    if (!storedProfile && legacyProfile) {
      await idbPut(STORES.META, profile, 'profile');
    }
    if (!storedSettings && legacySettings) {
      await idbPut(STORES.META, settings, 'settings');
    }
    if (storedSessions.length === 0 && legacySessions && legacySessions.length > 0) {
      await idbReplaceAllSessions(sessions);
    }

    return {
      sessions,
      activeSessionId,
      profile,
      settings,
      exerciseProgress,
      favoriteResourceIds,
    };
  } catch {
    const fallbackSession = createFallbackSession();
    return {
      sessions: [fallbackSession],
      activeSessionId: fallbackSession.id,
      profile: EMPTY_PROFILE,
      settings: defaultSettings,
      exerciseProgress: [],
      favoriteResourceIds: [],
    };
  }
}

export async function saveSessionsToIndexedDB(sessions: SessionRecord[]): Promise<void> {
  try {
    await idbReplaceAllSessions(sessions);
  } catch {
    // Fallback cleanly without breaking UX
  }
}

export async function saveProfileToIndexedDB(profile: PsychologicalProfile): Promise<void> {
  try {
    await idbPut(STORES.META, profile, 'profile');
  } catch {
    // Ignore storage error
  }
}

export async function saveSettingsToIndexedDB(settings: AccompanimentSettings): Promise<void> {
  try {
    await idbPut(STORES.META, settings, 'settings');
  } catch {
    // Ignore storage error
  }
}

export async function saveActiveSessionIdToIndexedDB(sessionId: string): Promise<void> {
  try {
    await idbPut(STORES.META, sessionId, 'activeSessionId');
  } catch {
    // Ignore storage error
  }
}

export async function saveFavoritesToIndexedDB(ids: string[]): Promise<void> {
  try {
    await idbPut(STORES.META, ids, 'favoriteResourceIds');
  } catch {
    // Ignore storage error
  }
}

export async function saveExerciseProgressToIndexedDB(
  entry: ExerciseProgressEntry
): Promise<void> {
  try {
    await idbPut(STORES.EXERCISE_PROGRESS, entry);
  } catch {
    // Ignore storage error
  }
}

export async function clearAllIndexedDBData(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(
        [STORES.META, STORES.SESSIONS, STORES.EXERCISE_PROGRESS],
        'readwrite'
      );
      tx.objectStore(STORES.META).clear();
      tx.objectStore(STORES.SESSIONS).clear();
      tx.objectStore(STORES.EXERCISE_PROGRESS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.PROFILE);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(THEME_HINT_KEY);
  } catch {
    // Ignore
  }
}
