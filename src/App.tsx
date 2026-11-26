import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConversationView } from './components/ConversationView';
import { ExercisesView } from './components/ExercisesView';
import { LibraryView } from './components/LibraryView';
import { PrivacyView } from './components/PrivacyView';
import { ProfileView } from './components/ProfileView';
import { SessionSidebar } from './components/SessionSidebar';
import { TopBar } from './components/TopBar';
import { WhatsAppFloatingButton } from './components/WhatsAppPastorButton';
import { EMPTY_PROFILE } from './data/microinterventions';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { generateLocalOfflineResponse } from './offline/localEngine';
import {
  clearAllIndexedDBData,
  loadWorkspaceFromIndexedDB,
  saveActiveSessionIdToIndexedDB,
  saveExerciseProgressToIndexedDB,
  saveFavoritesToIndexedDB,
  saveProfileToIndexedDB,
  saveSessionsToIndexedDB,
  saveSettingsToIndexedDB,
  THEME_HINT_KEY,
} from './storage/indexedDb';
import { postApiJson } from './utils/apiClient';
import type {
  AccompanimentAnalysis,
  AccompanimentSettings,
  AppView,
  ChatMessage,
  ExerciseProgressEntry,
  LocalLibraryResource,
  MicroInterventionSuggestion,
  ProtectiveMechanism,
  PsychologicalProfile,
  SessionRecord,
  ThemePreference,
} from './types/jairrestaura';

interface AccompanyApiResponse {
  reply?: string;
  analysis?: AccompanimentAnalysis;
  suggestedMicroIntervention?: MicroInterventionSuggestion;
  profileUpdates?: {
    newAffirmedFacts?: string[];
    newObservedPatterns?: string[];
    newExplorableHypotheses?: string[];
    updatedUnknownAreas?: string[];
    newProtectiveMechanisms?: {
      behavior: string;
      possibleFunction: string;
      presentCost: string;
    }[];
    newStrengthsAndValues?: string[];
    newPersonalGoals?: string[];
    newCommunicationPreferences?: string[];
  };
}

const DEFAULT_SETTINGS: AccompanimentSettings = {
  preferredStyle: 'auto',
  languageDepth: 'auto',
  pastoralIntegration: false,
  theme: 'system',
};

function readInitialThemeHint(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_HINT_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // Ignore storage access errors
  }
  return 'system';
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptySession(): SessionRecord {
  const now = new Date().toISOString();
  return {
    id: createId('sess'),
    title: 'Nueva conversación',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function deriveSessionTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 44) return cleaned;
  return `${cleaned.slice(0, 44).trim()}...`;
}

function mergeUniqueStrings(existing: string[], incoming: string[] | undefined): string[] {
  if (!Array.isArray(incoming) || incoming.length === 0) return existing;
  const normalizedSet = new Set(existing.map((s) => s.trim().toLowerCase()));
  const next = [...existing];
  for (const item of incoming) {
    const trimmed = item.trim();
    if (trimmed && !normalizedSet.has(trimmed.toLowerCase())) {
      normalizedSet.add(trimmed.toLowerCase());
      next.push(trimmed);
    }
  }
  return next;
}

function mergeProtectiveMechanisms(
  existing: ProtectiveMechanism[],
  incoming:
    | { behavior: string; possibleFunction: string; presentCost: string }[]
    | undefined
): ProtectiveMechanism[] {
  if (!Array.isArray(incoming) || incoming.length === 0) return existing;
  const next = [...existing];
  const existingNames = new Set(existing.map((m) => m.behavior.trim().toLowerCase()));
  for (const item of incoming) {
    const behavior = (item.behavior || '').trim();
    if (!behavior || existingNames.has(behavior.toLowerCase())) continue;
    existingNames.add(behavior.toLowerCase());
    next.push({
      id: createId('mech'),
      behavior,
      possibleFunction: (item.possibleFunction || '').trim(),
      presentCost: (item.presentCost || '').trim(),
    });
  }
  return next;
}

export default function App() {
  const isOnline = useOnlineStatus();
  const prevOnlineRef = useRef<boolean>(isOnline);

  const [hydrated, setHydrated] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>(() => [createEmptySession()]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [profile, setProfile] = useState<PsychologicalProfile>(EMPTY_PROFILE);
  const [settings, setSettings] = useState<AccompanimentSettings>(() => ({
    ...DEFAULT_SETTINGS,
    theme: readInitialThemeHint(),
  }));
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgressEntry[]>([]);
  const [favoriteResourceIds, setFavoriteResourceIds] = useState<string[]>([]);

  const [activeView, setActiveView] = useState<AppView>('conversation');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preselectedExercise, setPreselectedExercise] =
    useState<MicroInterventionSuggestion | null>(null);
  const [justReconnected, setJustReconnected] = useState(false);

  // Track device color scheme preference when no explicit choice is saved
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    setSystemPrefersDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const themePreference: ThemePreference = settings.theme || 'system';
  const resolvedTheme: 'light' | 'dark' =
    themePreference === 'dark'
      ? 'dark'
      : themePreference === 'light'
        ? 'light'
        : systemPrefersDark
          ? 'dark'
          : 'light';

  useEffect(() => {
    const isDark = resolvedTheme === 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#0E1311' : '#2E5A4C');
    }
    if (hydrated) {
      try {
        localStorage.setItem(THEME_HINT_KEY, themePreference);
      } catch {
        // Ignore storage errors
      }
    }
  }, [resolvedTheme, themePreference, hydrated]);

  const handleToggleTheme = useCallback(() => {
    const nextTheme: ThemePreference = resolvedTheme === 'dark' ? 'light' : 'dark';
    setSettings((prev) => ({
      ...prev,
      theme: nextTheme,
    }));
    try {
      localStorage.setItem(THEME_HINT_KEY, nextTheme);
    } catch {
      // Ignore storage errors
    }
  }, [resolvedTheme]);

  // Hydrate full state from IndexedDB (migrating any legacy localStorage)
  useEffect(() => {
    let active = true;
    loadWorkspaceFromIndexedDB(DEFAULT_SETTINGS, createEmptySession).then((data) => {
      if (!active) return;
      setSessions(data.sessions);
      setActiveSessionId(data.activeSessionId);
      setProfile(data.profile);
      setSettings(data.settings);
      setExerciseProgress(data.exerciseProgress);
      setFavoriteResourceIds(data.favoriteResourceIds);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Detect offline -> online transition cleanly
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      setJustReconnected(true);
    }
    if (!isOnline) {
      setJustReconnected(false);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (hydrated && activeSession && activeSession.id !== activeSessionId) {
      setActiveSessionId(activeSession.id);
    }
  }, [hydrated, activeSession, activeSessionId]);

  useEffect(() => {
    if (!hydrated) return;
    void saveSessionsToIndexedDB(sessions);
  }, [hydrated, sessions]);

  useEffect(() => {
    if (!hydrated || !activeSessionId) return;
    void saveActiveSessionIdToIndexedDB(activeSessionId);
  }, [hydrated, activeSessionId]);

  useEffect(() => {
    if (!hydrated) return;
    void saveProfileToIndexedDB(profile);
  }, [hydrated, profile]);

  useEffect(() => {
    if (!hydrated) return;
    void saveSettingsToIndexedDB(settings);
  }, [hydrated, settings]);

  useEffect(() => {
    if (!hydrated) return;
    void saveFavoritesToIndexedDB(favoriteResourceIds);
  }, [hydrated, favoriteResourceIds]);

  const offlineTurnsPending = useMemo(() => {
    if (!activeSession) return 0;
    return activeSession.messages.filter((m) => m.role === 'user' && m.createdOffline).length;
  }, [activeSession]);

  const handleNewSession = useCallback(() => {
    const emptyExisting = sessions.find((s) => s.messages.length === 0);
    if (emptyExisting) {
      setActiveSessionId(emptyExisting.id);
      setErrorMessage(null);
      return;
    }
    const fresh = createEmptySession();
    setSessions((prev) => [fresh, ...prev]);
    setActiveSessionId(fresh.id);
    setErrorMessage(null);
  }, [sessions]);

  const handleDeleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== id);
        if (filtered.length === 0) {
          const fresh = createEmptySession();
          setActiveSessionId(fresh.id);
          return [fresh];
        }
        if (activeSessionId === id) {
          setActiveSessionId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeSessionId]
  );

  const sendMessage = useCallback(
    async (content: string, profileCorrectionNote?: string) => {
      if (!activeSession) return;
      const targetSessionId = activeSession.id;
      const now = new Date().toISOString();
      const currentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine && isOnline : isOnline;

      const userMsg: ChatMessage = {
        id: createId('msg'),
        role: 'user',
        content,
        timestamp: now,
        createdOffline: !currentlyOnline,
      };

      const nextMessages = [...activeSession.messages, userMsg];
      const nextTitle =
        activeSession.messages.length === 0
          ? deriveSessionTitle(content)
          : activeSession.title;

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, title: nextTitle, updatedAt: now, messages: nextMessages }
            : s
        )
      );

      setErrorMessage(null);

      // OFFLINE PATH: Never invoke Gemini when offline; run local engine immediately
      if (!currentlyOnline) {
        const localResult = generateLocalOfflineResponse(
          content,
          activeSession.messages,
          profile,
          settings,
          profileCorrectionNote
        );

        const assistantMsg: ChatMessage = {
          id: createId('msg'),
          role: 'assistant',
          content: localResult.reply,
          timestamp: new Date().toISOString(),
          source: 'local_offline',
          createdOffline: true,
          analysis: localResult.analysis,
          suggestedMicroIntervention: localResult.suggestedMicroIntervention,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  updatedAt: assistantMsg.timestamp,
                  messages: [...nextMessages, assistantMsg],
                }
              : s
          )
        );

        if (
          localResult.provisionalAffirmedFact ||
          localResult.provisionalPattern ||
          localResult.provisionalHypothesis
        ) {
          setProfile((prev) => ({
            ...prev,
            affirmedFacts: localResult.provisionalAffirmedFact
              ? mergeUniqueStrings(prev.affirmedFacts, [localResult.provisionalAffirmedFact])
              : prev.affirmedFacts,
            observedPatterns: localResult.provisionalPattern
              ? mergeUniqueStrings(prev.observedPatterns, [localResult.provisionalPattern])
              : prev.observedPatterns,
            explorableHypotheses: localResult.provisionalHypothesis
              ? mergeUniqueStrings(prev.explorableHypotheses, [localResult.provisionalHypothesis])
              : prev.explorableHypotheses,
            lastUpdatedAt: new Date().toISOString(),
          }));
        }
        return;
      }

      // ONLINE PATH: Gemini API via server proxy
      setIsLoading(true);
      try {
        const data = await postApiJson<AccompanyApiResponse>('/api/accompany', {
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          profile,
          settings,
          profileCorrectionNote,
        });

        if (!data.reply || typeof data.reply !== 'string' || !data.reply.trim()) {
          throw new Error(
            'El servidor respondió sin contenido válido de acompañamiento. Tu mensaje se conservó; intenta nuevamente.'
          );
        }

        const assistantMsg: ChatMessage = {
          id: createId('msg'),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString(),
          source: 'gemini',
          analysis: data.analysis as AccompanimentAnalysis,
          suggestedMicroIntervention:
            data.suggestedMicroIntervention &&
            data.suggestedMicroIntervention.title?.trim()
              ? (data.suggestedMicroIntervention as MicroInterventionSuggestion)
              : undefined,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  updatedAt: assistantMsg.timestamp,
                  messages: [...nextMessages, assistantMsg],
                }
              : s
          )
        );

        if (data.profileUpdates) {
          const updates = data.profileUpdates;
          setProfile((prev) => ({
            affirmedFacts: mergeUniqueStrings(prev.affirmedFacts, updates.newAffirmedFacts),
            observedPatterns: mergeUniqueStrings(
              prev.observedPatterns,
              updates.newObservedPatterns
            ),
            explorableHypotheses: mergeUniqueStrings(
              prev.explorableHypotheses,
              updates.newExplorableHypotheses
            ),
            unknownAreas:
              Array.isArray(updates.updatedUnknownAreas) &&
              updates.updatedUnknownAreas.length > 0
                ? updates.updatedUnknownAreas
                : prev.unknownAreas,
            protectiveMechanisms: mergeProtectiveMechanisms(
              prev.protectiveMechanisms,
              updates.newProtectiveMechanisms
            ),
            strengthsAndValues: mergeUniqueStrings(
              prev.strengthsAndValues,
              updates.newStrengthsAndValues
            ),
            personalGoals: mergeUniqueStrings(prev.personalGoals, updates.newPersonalGoals),
            communicationPreferences: mergeUniqueStrings(
              prev.communicationPreferences,
              updates.newCommunicationPreferences
            ),
            lastUpdatedAt: new Date().toISOString(),
          }));
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Ocurrió un error inesperado al comunicarnos con el servicio.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeSession, isOnline, profile, settings]
  );

  // Retry requesting a response for the latest preserved user message without duplicating it
  const handleRetryLastMessage = useCallback(async () => {
    if (!activeSession || !isOnline || isLoading) return;
    const lastMsg = activeSession.messages[activeSession.messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user') return;

    const targetSessionId = activeSession.id;
    const currentMessages = activeSession.messages;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await postApiJson<AccompanyApiResponse>('/api/accompany', {
        messages: currentMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        profile,
        settings,
      });

      if (!data.reply || typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error(
          'El servidor respondió sin contenido válido de acompañamiento. Tu mensaje sigue conservado.'
        );
      }

      const assistantMsg: ChatMessage = {
        id: createId('msg'),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        source: 'gemini',
        analysis: data.analysis as AccompanimentAnalysis,
        suggestedMicroIntervention:
          data.suggestedMicroIntervention &&
          data.suggestedMicroIntervention.title?.trim()
            ? (data.suggestedMicroIntervention as MicroInterventionSuggestion)
            : undefined,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                updatedAt: assistantMsg.timestamp,
                messages: [...currentMessages, assistantMsg],
              }
            : s
        )
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo obtener respuesta del servidor. Tu mensaje sigue guardado.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, isLoading, isOnline, profile, settings]);

  // Explicit, user-consented synchronization when reconnecting online
  const handleSyncOfflineContextWithGemini = useCallback(async () => {
    if (!activeSession || !isOnline || isLoading) return;
    const targetSessionId = activeSession.id;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await postApiJson<AccompanyApiResponse>('/api/accompany', {
        messages: [
          ...activeSession.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: 'user',
            content:
              'Acabo de recuperar la conexión a internet y quiero continuar contigo con Gemini tomando en cuenta lo que conversé en modo local.',
          },
        ],
        profile,
        settings,
      });

      if (!data.reply || typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('La respuesta recibida no contiene texto de acompañamiento válido.');
      }

      setJustReconnected(false);

      const assistantMsg: ChatMessage = {
        id: createId('msg'),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        source: 'gemini',
        analysis: data.analysis as AccompanimentAnalysis,
        suggestedMicroIntervention:
          data.suggestedMicroIntervention &&
          data.suggestedMicroIntervention.title?.trim()
            ? (data.suggestedMicroIntervention as MicroInterventionSuggestion)
            : undefined,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                updatedAt: assistantMsg.timestamp,
                messages: [
                  ...s.messages.map((m) =>
                    m.createdOffline ? { ...m, createdOffline: false } : m
                  ),
                  assistantMsg,
                ],
              }
            : s
        )
      );

      if (data.profileUpdates) {
        const updates = data.profileUpdates;
        setProfile((prev) => ({
          affirmedFacts: mergeUniqueStrings(prev.affirmedFacts, updates.newAffirmedFacts),
          observedPatterns: mergeUniqueStrings(
            prev.observedPatterns,
            updates.newObservedPatterns
          ),
          explorableHypotheses: mergeUniqueStrings(
            prev.explorableHypotheses,
            updates.newExplorableHypotheses
          ),
          unknownAreas:
            Array.isArray(updates.updatedUnknownAreas) &&
            updates.updatedUnknownAreas.length > 0
              ? updates.updatedUnknownAreas
              : prev.unknownAreas,
          protectiveMechanisms: mergeProtectiveMechanisms(
            prev.protectiveMechanisms,
            updates.newProtectiveMechanisms
          ),
          strengthsAndValues: mergeUniqueStrings(
            prev.strengthsAndValues,
            updates.newStrengthsAndValues
          ),
          personalGoals: mergeUniqueStrings(prev.personalGoals, updates.newPersonalGoals),
          communicationPreferences: mergeUniqueStrings(
            prev.communicationPreferences,
            updates.newCommunicationPreferences
          ),
          lastUpdatedAt: new Date().toISOString(),
        }));
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo completar la continuidad con Gemini.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, isLoading, isOnline, profile, settings]);

  const handleSendCorrectionToChat = useCallback(
    async (correctionText: string) => {
      setActiveView('conversation');
      await sendMessage(
        `Quiero aclarar algo sobre mi perfil para que lo tengas en cuenta: ${correctionText}`,
        correctionText
      );
    },
    [sendMessage]
  );

  const handleOpenSuggestedExercise = useCallback(
    (exercise: MicroInterventionSuggestion) => {
      setPreselectedExercise(exercise);
      setActiveView('exercises');
    },
    []
  );

  const handleSaveExerciseProgress = useCallback((entry: ExerciseProgressEntry) => {
    setExerciseProgress((prev) => [entry, ...prev]);
    void saveExerciseProgressToIndexedDB(entry);
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavoriteResourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleLogLibraryPractice = useCallback(
    (resource: LocalLibraryResource) => {
      handleSaveExerciseProgress({
        id: createId('prog'),
        exerciseId: resource.id,
        exerciseTitle: resource.title,
        category: resource.categoryLabel,
        completedAt: new Date().toISOString(),
        answers: [
          {
            prompt: resource.reflectionQuestion,
            answer: 'Práctica revisada desde la biblioteca local.',
          },
        ],
        reflection: resource.practice,
        mode: isOnline ? 'online' : 'offline',
      });
    },
    [handleSaveExerciseProgress, isOnline]
  );

  const handleResetAllData = useCallback(() => {
    const fresh = createEmptySession();
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
    setProfile(EMPTY_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    setExerciseProgress([]);
    setFavoriteResourceIds([]);
    setErrorMessage(null);
    setJustReconnected(false);
    void clearAllIndexedDBData();
    setActiveView('conversation');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F6] dark:bg-[#0E1311] text-[#18201E] dark:text-[#EDF2EF]">
      <TopBar
        activeView={activeView}
        onChangeView={setActiveView}
        onNewSession={handleNewSession}
        onToggleMobileSidebar={() => setMobileSidebarOpen((v) => !v)}
        resolvedTheme={resolvedTheme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="flex flex-1 min-h-0">
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSession?.id || ''}
          onSelectSession={setActiveSessionId}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          settings={settings}
          onUpdateSettings={setSettings}
          activeView={activeView}
          onChangeView={setActiveView}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          isOnline={isOnline}
        />

        <main className={`flex-1 min-w-0 ${activeView !== 'conversation' ? 'pb-24' : ''}`}>
          {activeView === 'conversation' && activeSession && (
            <ConversationView
              sessionTitle={activeSession.title}
              messages={activeSession.messages}
              isLoading={isLoading}
              errorMessage={errorMessage}
              isOnline={isOnline}
              justReconnected={justReconnected}
              offlineTurnsPending={offlineTurnsPending}
              onDismissReconnect={() => setJustReconnected(false)}
              onSyncOfflineContextWithGemini={handleSyncOfflineContextWithGemini}
              onSendMessage={(text) => sendMessage(text)}
              onRetryLastMessage={() => void handleRetryLastMessage()}
              onOpenSuggestedExercise={handleOpenSuggestedExercise}
              onGoToProfile={() => setActiveView('profile')}
            />
          )}

          {activeView === 'profile' && (
            <ProfileView
              profile={profile}
              onUpdateProfile={setProfile}
              onSendCorrectionToChat={handleSendCorrectionToChat}
            />
          )}

          {activeView === 'exercises' && (
            <ExercisesView
              profile={profile}
              pastoralIntegration={settings.pastoralIntegration}
              isOnline={isOnline}
              exerciseProgress={exerciseProgress}
              onSaveProgress={handleSaveExerciseProgress}
              preselectedExercise={preselectedExercise}
              onClearPreselected={() => setPreselectedExercise(null)}
            />
          )}

          {activeView === 'library' && (
            <LibraryView
              favoriteIds={favoriteResourceIds}
              onToggleFavorite={handleToggleFavorite}
              onLogPractice={handleLogLibraryPractice}
              exerciseProgress={exerciseProgress}
              pastoralIntegration={settings.pastoralIntegration}
            />
          )}

          {activeView === 'privacy' && (
            <PrivacyView
              sessions={sessions}
              profile={profile}
              exerciseProgress={exerciseProgress}
              favoriteResourceIds={favoriteResourceIds}
              isOnline={isOnline}
              onResetAllData={handleResetAllData}
            />
          )}
        </main>
      </div>

      <WhatsAppFloatingButton isOnline={isOnline} />
    </div>
  );
}
