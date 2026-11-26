import { Plus, Trash2, X } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import type {
  AccompanimentSettings,
  AccompanimentStyle,
  AppView,
  LanguageDepth,
  SessionRecord,
} from '../types/jairrestaura';

interface SessionSidebarProps {
  sessions: SessionRecord[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  settings: AccompanimentSettings;
  onUpdateSettings: (next: AccompanimentSettings) => void;
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const STYLE_OPTIONS: { value: AccompanimentStyle; label: string }[] = [
  { value: 'auto', label: 'Adaptativo automático' },
  { value: 'empatico_contenedor', label: 'Empático y contenedor' },
  { value: 'reflexivo', label: 'Reflexivo' },
  { value: 'confrontativo_compasivo', label: 'Confrontativo compasivo' },
  { value: 'practico', label: 'Práctico' },
  { value: 'exploratorio', label: 'Exploratorio' },
  { value: 'fortalecedor', label: 'Fortalecedor' },
];

const DEPTH_OPTIONS: { value: LanguageDepth; label: string }[] = [
  { value: 'auto', label: 'Adaptativa' },
  { value: 'claro', label: 'Clara y sencilla' },
  { value: 'profundo', label: 'Profunda' },
  { value: 'breve', label: 'Breve y cálida' },
];

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  settings,
  onUpdateSettings,
  activeView,
  onChangeView,
  mobileOpen,
  onCloseMobile,
}: SessionSidebarProps) {
  const sidebarBody = (
    <div className="flex flex-col h-full bg-[#F2F4F3] border-r border-[#E2E6E4]">
      {/* Mobile navigation strip */}
      <div className="md:hidden px-4 py-3 border-b border-[#E2E6E4] flex items-center justify-between">
        <span className="text-xs font-medium text-[#52605C]">Espacios</span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Cerrar panel"
          className="p-1.5 text-[#52605C] hover:text-[#18201E] rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="md:hidden px-4 py-2 border-b border-[#E2E6E4] grid grid-cols-2 gap-1.5">
        {(
          [
            ['conversation', 'Conversación'],
            ['profile', 'Mi Perfil'],
            ['exercises', 'Ejercicios'],
            ['library', 'Biblioteca'],
            ['privacy', 'Privacidad'],
          ] as [AppView, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              onChangeView(id);
              onCloseMobile();
            }}
            className={`px-3 py-2 text-xs font-medium rounded-md text-left transition-colors whitespace-nowrap truncate ${
              activeView === id
                ? 'bg-white text-[#18201E] border border-[#D4DBD8]'
                : 'text-[#52605C] hover:text-[#18201E]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-[#52605C] tracking-wide">
            Sesiones recientes
          </h2>
          <button
            type="button"
            onClick={() => {
              onNewSession();
              onChangeView('conversation');
              onCloseMobile();
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#2E5A4C] hover:text-[#1F3E34] transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva
          </button>
        </div>

        <ul className="space-y-1">
          {sessions.map((session) => {
            const isSelected = session.id === activeSessionId && activeView === 'conversation';
            const msgCount = session.messages.length;
            return (
              <li key={session.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectSession(session.id);
                    onChangeView('conversation');
                    onCloseMobile();
                  }}
                  className={`flex-1 min-w-0 text-left px-3 py-2.5 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-white text-[#18201E] border border-[#D4DBD8]'
                      : 'text-[#3A4743] hover:bg-white/60 border border-transparent'
                  }`}
                >
                  <div className="text-sm font-medium truncate">{session.title}</div>
                  <div className="mt-0.5 text-xs text-[#52605C] tabular-nums flex items-center gap-1.5">
                    <span>{formatShortDate(session.updatedAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {msgCount} {msgCount === 1 ? 'mensaje' : 'mensajes'}
                    </span>
                  </div>
                </button>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.id)}
                    aria-label={`Eliminar sesión ${session.title}`}
                    className="p-2 text-[#7A8783] hover:text-[#B91C1C] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Accompaniment Preferences */}
      <div className="border-t border-[#E2E6E4] px-4 py-5 space-y-4 bg-[#F6F7F6]">
        <h2 className="text-xs font-semibold text-[#52605C]">
          Preferencias de acompañamiento
        </h2>

        <div>
          <label
            htmlFor="pref-style"
            className="block text-xs font-medium text-[#3A4743] mb-1.5"
          >
            Estilo de respuesta
          </label>
          <select
            id="pref-style"
            value={settings.preferredStyle}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                preferredStyle: e.target.value as AccompanimentStyle,
              })
            }
            className="w-full px-3 py-2 text-xs bg-white border border-[#D4DBD8] rounded-lg text-[#18201E] focus:outline-none focus:border-[#2E5A4C]"
          >
            {STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="pref-depth"
            className="block text-xs font-medium text-[#3A4743] mb-1.5"
          >
            Extensión y claridad
          </label>
          <select
            id="pref-depth"
            value={settings.languageDepth}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                languageDepth: e.target.value as LanguageDepth,
              })
            }
            className="w-full px-3 py-2 text-xs bg-white border border-[#D4DBD8] rounded-lg text-[#18201E] focus:outline-none focus:border-[#2E5A4C]"
          >
            {DEPTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.pastoralIntegration}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  pastoralIntegration: e.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-[#B8C2BE] text-[#2E5A4C] focus:ring-[#2E5A4C]"
            />
            <span className="text-xs leading-relaxed text-[#3A4743]">
              <span className="font-medium text-[#18201E] block">
                Integración pastoral opcional
              </span>
              Incluir perspectiva cristiana evangélica (gracia, esperanza y dignidad), sin culpabilización.
            </span>
          </label>
        </div>

        <div className="pt-2">
          <PWAInstallButton compact />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[272px] shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {sidebarBody}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#18201E]/30 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-[280px] max-w-[85vw] h-full">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
}
