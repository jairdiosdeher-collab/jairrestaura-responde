import { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
          compact
            ? 'w-full px-3 py-2 text-xs text-white bg-[#2E5A4C] hover:bg-[#24483D]'
            : 'px-4 py-2 text-sm text-white bg-[#2E5A4C] hover:bg-[#24483D]'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Instalar aplicación</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#D4DBD8] bg-white hover:bg-[#F2F4F3] font-medium text-[#18201E] transition-colors whitespace-nowrap ${
            compact ? 'w-full px-3 py-2 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>Instalar en iPhone / iPad</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18201E]/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white border border-[#E2E6E4] p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[#18201E]">
                Instalar JAIRRESTAURA en iOS
              </h3>
              <ol className="text-sm text-[#3A4743] space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Toca el botón <strong>Compartir</strong> en la barra de Safari.
                </li>
                <li>
                  Desliza hacia abajo y selecciona <strong>Añadir a pantalla de inicio</strong>.
                </li>
                <li>
                  Confirma tocando <strong>Añadir</strong> para abrir JAIRRESTAURA incluso sin internet.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-[#2E5A4C] hover:bg-[#24483D] py-2 text-sm font-medium text-white transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
