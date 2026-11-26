import { Menu, Moon, Sun } from 'lucide-react';
import type { AppView } from '../types/jairrestaura';

interface TopBarProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onNewSession: () => void;
  onToggleMobileSidebar: () => void;
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'conversation', label: 'Conversación' },
  { id: 'profile', label: 'Mi Perfil' },
  { id: 'exercises', label: 'Ejercicios' },
  { id: 'library', label: 'Biblioteca' },
  { id: 'privacy', label: 'Privacidad' },
];

export function TopBar({
  activeView,
  onChangeView,
  onNewSession,
  onToggleMobileSidebar,
  resolvedTheme,
  onToggleTheme,
}: TopBarProps) {
  const isDark = resolvedTheme === 'dark';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#151C19]/95 backdrop-blur-sm border-b border-[#E2E6E4] dark:border-[#2A3531] px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6">
      {/* Zone 1: Single-line brand wordmark */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Abrir historial y preferencias"
          className="lg:hidden p-2 -ml-1.5 text-[#52605C] dark:text-[#9AA8A2] hover:text-[#18201E] dark:hover:text-[#EDF2EF] rounded-md focus-visible:outline-2 focus-visible:outline-[#2E5A4C] dark:focus-visible:outline-[#65B397]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => onChangeView('conversation')}
          className="font-editorial text-lg sm:text-xl font-semibold tracking-tight text-[#18201E] dark:text-[#EDF2EF] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E5A4C] dark:focus-visible:outline-[#65B397] rounded-sm"
        >
          JAIRRESTAURA
        </button>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6 lg:gap-7">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E5A4C] dark:focus-visible:outline-[#65B397] ${
                isActive
                  ? 'text-[#18201E] dark:text-[#EDF2EF]'
                  : 'text-[#52605C] dark:text-[#9AA8A2] hover:text-[#18201E] dark:hover:text-[#EDF2EF]'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#2E5A4C] dark:bg-[#65B397]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Day / Night toggle + New Session action */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
          title={isDark ? 'Modo Noche activo · Cambiar a Modo Día' : 'Modo Día activo · Cambiar a Modo Noche'}
          className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-[#EEF1EF] dark:bg-[#1E2824] border border-[#D4DBD8] dark:border-[#34423D] hover:border-[#2E5A4C] dark:hover:border-[#65B397] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E5A4C] dark:focus-visible:outline-[#65B397]"
        >
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
              !isDark
                ? 'bg-white text-[#B45309] shadow-xs'
                : 'text-[#8E9C96]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
              isDark
                ? 'bg-[#2C3B35] text-[#FDE68A] shadow-xs'
                : 'text-[#52605C]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className="hidden xl:inline px-1.5 text-xs font-medium text-[#18201E] dark:text-[#EDF2EF] whitespace-nowrap">
            {isDark ? 'Noche' : 'Día'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onNewSession();
            onChangeView('conversation');
          }}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#2E5A4C] hover:bg-[#24483D] dark:bg-[#356959] dark:hover:bg-[#2B5649] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E5A4C] dark:focus-visible:outline-[#65B397]"
        >
          Nueva sesión
        </button>
      </div>
    </header>
  );
}
