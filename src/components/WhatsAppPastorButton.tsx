import { useState } from 'react';
import { WifiOff, X } from 'lucide-react';

export const PASTOR_WHATSAPP_NUMBER = '+57 312 471 0702';
export const PASTOR_WHATSAPP_URL =
  'https://wa.me/573124710702?text=Hola%20Pastor%20Jair%2C%20deseo%20hablar%20con%20usted%20y%20recibir%20orientaci%C3%B3n.';
export const PASTOR_WHATSAPP_LABEL = 'HABLAR CON EL PASTOR JAIR POR WHATSAPP';

function WhatsAppGlyph({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.77 14.07c-.24.68-1.4 1.3-1.94 1.38-.49.08-1.11.11-1.79-.11-.41-.13-.95-.31-1.63-.6-2.87-1.24-4.74-4.13-4.88-4.32-.14-.19-1.16-1.55-1.16-2.95 0-1.4.73-2.09.99-2.38.26-.29.57-.36.76-.36.19 0 .38.01.55.01.18 0 .41-.07.65.49.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.13.59.17.29.74 1.22 1.59 1.98 1.1.98 2.02 1.28 2.31 1.43.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.66.78 1.94.92.29.14.48.22.55.34.07.12.07.69-.17 1.37z" />
    </svg>
  );
}

interface WhatsAppOfflineModalProps {
  open: boolean;
  onClose: () => void;
}

function WhatsAppOfflineModal({ open, onClose }: WhatsAppOfflineModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-offline-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18201E]/40 dark:bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#18201D] border border-[#E2E6E4] dark:border-[#2A3531] p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-[#18201E] dark:text-[#EDF2EF]">
            <WifiOff className="w-5 h-5 text-[#B45309] dark:text-[#FBBF24] shrink-0" />
            <h3 id="wa-offline-title" className="text-base font-semibold">
              WhatsApp necesita conexión a internet
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar aviso"
            className="p-1 text-[#52605C] dark:text-[#9AA8A2] hover:text-[#18201E] dark:hover:text-[#EDF2EF] rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[#3A4743] dark:text-[#C7D2CD] leading-relaxed">
          En este momento estás en modo sin conexión, por lo que WhatsApp necesita internet para establecer la comunicación con el Pastor Jair (<span className="font-mono">{PASTOR_WHATSAPP_NUMBER}</span>).
        </p>

        <p className="text-xs text-[#52605C] dark:text-[#9AA8A2] leading-relaxed">
          Cuando recuperes conexión podrás abrir el enlace con el mensaje preparado para revisarlo y enviarlo voluntariamente. Tu perfil psicológico, conversaciones y datos de IndexedDB nunca se comparten con WhatsApp. La atención está sujeta a la disponibilidad del pastor.
        </p>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <a
            href={PASTOR_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-[#157F40] dark:text-[#86EFAC] bg-[#F0FBF4] dark:bg-[#13291C] border border-[#BDE5C9] dark:border-[#245A39] hover:border-[#157F40] dark:hover:border-[#4ADE80] rounded-lg transition-colors whitespace-nowrap"
          >
            Intentar abrir enlace
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-[#2E5A4C] hover:bg-[#24483D] dark:bg-[#356959] dark:hover:bg-[#2B5649] rounded-lg transition-colors whitespace-nowrap"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

interface WhatsAppButtonProps {
  isOnline: boolean;
}

export function WhatsAppFloatingButton({ isOnline }: WhatsAppButtonProps) {
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isOnline) {
      e.preventDefault();
      setOfflineModalOpen(true);
    }
  };

  return (
    <>
      <a
        href={PASTOR_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label={PASTOR_WHATSAPP_LABEL}
        title={`${PASTOR_WHATSAPP_LABEL} (${PASTOR_WHATSAPP_NUMBER})`}
        className="fixed bottom-3 right-3 md:bottom-4 md:right-6 z-30 inline-flex items-center gap-2.5 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] whitespace-nowrap"
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#25D366] text-[#0B3B1E] shrink-0">
          <WhatsAppGlyph className="w-4 h-4" />
        </span>
        <span className="hidden md:inline text-xs font-semibold tracking-wide">
          {PASTOR_WHATSAPP_LABEL}
        </span>
        <span className="md:hidden text-xs font-semibold">
          Pastor Jair · WhatsApp
        </span>
      </a>

      <WhatsAppOfflineModal
        open={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
      />
    </>
  );
}

export function WhatsAppMenuAccess({ isOnline }: WhatsAppButtonProps) {
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isOnline) {
      e.preventDefault();
      setOfflineModalOpen(true);
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <a
          href={PASTOR_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="w-full inline-flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-[#15803D]"
        >
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#25D366] text-[#0B3B1E] shrink-0">
            <WhatsAppGlyph className="w-4 h-4" />
          </span>
          <span>{PASTOR_WHATSAPP_LABEL}</span>
        </a>
        <p className="text-[11px] leading-relaxed text-[#52605C] dark:text-[#8E9C96]">
          Contacto pastoral directo ({PASTOR_WHATSAPP_NUMBER}). Mensaje opcional y sujeto a disponibilidad; no comparte tu perfil ni chats.
        </p>
      </div>

      <WhatsAppOfflineModal
        open={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
      />
    </>
  );
}
