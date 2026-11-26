import { Menu } from 'lucide-react';
import type { AppView } from '../types/jairrestaura';

interface TopBarProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onNewSession: () => void;
  onToggleMobileSidebar: () => void;
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
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-[#E2E6E4] px-4 sm:px-6 flex items-center justify-between gap-8">
      {/* Zone 1: Single-line brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Abrir historial y preferencias"
          className="lg:hidden p-2 -ml-2 text-[#52605C] hover:text-[#18201E] rounded-md focus-visible:outline-2 focus-visible:outline-[#2E5A4C]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => onChangeView('conversation')}
          className="font-editorial text-xl font-semibold tracking-tight text-[#18201E] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E5A4C] rounded-sm"
        >
          JAIRRESTAURA
        </button>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-7">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E5A4C] ${
                isActive
                  ? 'text-[#18201E]'
                  : 'text-[#52605C] hover:text-[#18201E]'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#2E5A4C]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={() => {
            onNewSession();
            onChangeView('conversation');
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-[#2E5A4C] hover:bg-[#24483D] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E5A4C]"
        >
          Nueva sesión
        </button>
      </div>
    </header>
  );
}
