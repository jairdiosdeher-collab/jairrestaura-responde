import { useState } from 'react';
import { Download, PhoneCall, Trash2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import type {
  ExerciseProgressEntry,
  PsychologicalProfile,
  SessionRecord,
} from '../types/jairrestaura';

interface PrivacyViewProps {
  sessions: SessionRecord[];
  profile: PsychologicalProfile;
  exerciseProgress: ExerciseProgressEntry[];
  favoriteResourceIds: string[];
  isOnline: boolean;
  onResetAllData: () => void;
}

export function PrivacyView({
  sessions,
  profile,
  exerciseProgress,
  favoriteResourceIds,
  isOnline,
  onResetAllData,
}: PrivacyViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      application: 'JAIRRESTAURA',
      storage: 'IndexedDB',
      profile,
      sessions,
      exerciseProgress,
      favoriteResourceIds,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jairrestaura-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[840px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      <header className="space-y-3 pb-6 border-b border-[#E2E6E4] dark:border-[#2A3531]">
        <div className="text-xs font-medium text-[#52605C] dark:text-[#9AA8A2]">
          Seguridad psicológica · Privacidad local · Límites del modo offline
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#18201E] dark:text-[#EDF2EF] text-balance">
          Privacidad, almacenamiento en IndexedDB y cuidado inmediato
        </h1>
        <p className="text-sm sm:text-base text-[#3A4743] dark:text-[#C7D2CD] leading-relaxed max-w-[68ch]">
          Tu autonomía y seguridad están por encima de todo. Aquí encontrarás con total transparencia cómo protege tus datos el modo local y cuáles son sus limitaciones técnicas.
        </p>
      </header>

      {/* Emergency & Colombia 123 */}
      <section className="bg-[#FEF2F2] dark:bg-[#2A1517] border border-[#FECACA] dark:border-[#6B262B] rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-[#991B1B] dark:text-[#FCA5A5]">
          <PhoneCall className="w-5 h-5 shrink-0" />
          <h2 className="text-base font-semibold">
            Si estás en riesgo inmediato o crisis emocional severa
          </h2>
        </div>
        <p className="text-sm text-[#7F1D1D] dark:text-[#FECACA] leading-relaxed">
          JAIRRESTAURA es un acompañante reflexivo y <strong>no atiende emergencias ni sustituye atención médica o psicoterapéutica</strong>. Si sientes impulso de hacerte daño, estás viviendo violencia, abuso o peligro inmediato, busca ayuda humana ahora mismo:
        </p>
        <ul className="text-sm text-[#7F1D1D] dark:text-[#FECACA] space-y-1.5 list-disc list-inside">
          <li>
            <strong>En Colombia:</strong> llama gratuitamente a la línea de emergencias{' '}
            <strong className="font-mono">123</strong> desde un teléfono con señal o acude al servicio de urgencias más cercano.
          </li>
          <li>
            Contacta de inmediato a un familiar, amigo de confianza o profesional de salud mental en tu localidad.
          </li>
          <li>
            <strong>Limitación importante sin internet:</strong> cuando estás desconectado{!isOnline ? ' (estado actual)' : ''}, la aplicación no puede contactar automáticamente servicios de emergencia ni verificar la disponibilidad de líneas de atención.
          </li>
        </ul>
      </section>

      {/* Ethical boundaries & IndexedDB disclosure */}
      <section className="bg-white dark:bg-[#18201D] border border-[#E2E6E4] dark:border-[#2A3531] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#18201E] dark:text-[#EDF2EF]">
          Almacenamiento local, seguridad y límites honestos
        </h2>
        <div className="space-y-3 text-sm text-[#3A4743] dark:text-[#C7D2CD] leading-relaxed">
          <p>
            <strong className="text-[#18201E] dark:text-[#EDF2EF]">No diagnostica trastornos mentales:</strong> ni el modo con Gemini ni el acompañamiento local sin conexión realizan diagnósticos clínicos de depresión, ansiedad, trauma, autismo o trastornos de personalidad.
          </p>
          <p>
            <strong className="text-[#18201E] dark:text-[#EDF2EF]">Base de datos local (IndexedDB):</strong> tu perfil orientativo, preferencias, objetivos, progreso de ejercicios e historial de conversaciones se almacenan localmente en la base de datos IndexedDB de este dispositivo. Cuando no hay conexión, no se envía ninguna información a servidores externos y las respuestas privadas nunca se guardan en cachés HTTP compartidas.
          </p>
          <p>
            <strong className="text-[#18201E] dark:text-[#EDF2EF]">Transparencia sobre cifrado:</strong> IndexedDB <strong>no está cifrada automáticamente por el navegador</strong>. Cualquier persona con acceso desbloqueado a tu computador, celular o perfil de navegador podría abrir la aplicación y leer tus registros. Protege tu dispositivo con bloqueo de pantalla y usa la opción de borrar datos si compartes el equipo.
          </p>
          <p>
            <strong className="text-[#18201E] dark:text-[#EDF2EF]">Uso en línea con Gemini:</strong> al conversar con internet activo, tus mensajes se envían de forma segura a través del servidor de la aplicación para generar respuestas personalizadas con Gemini; por ello no prometemos confidencialidad clínica absoluta.
          </p>
        </div>
      </section>

      {/* PWA Installation & Data Controls */}
      <section className="bg-white dark:bg-[#18201D] border border-[#E2E6E4] dark:border-[#2A3531] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#18201E] dark:text-[#EDF2EF]">
          Instalación y control sobre tus datos
        </h2>
        <p className="text-sm text-[#3A4743] dark:text-[#C7D2CD] leading-relaxed">
          Guardados localmente en IndexedDB:{' '}
          <span className="font-mono tabular-nums font-medium text-[#18201E] dark:text-[#EDF2EF]">
            {sessions.length}
          </span>{' '}
          {sessions.length === 1 ? 'sesión' : 'sesiones'} ·{' '}
          <span className="font-mono tabular-nums font-medium text-[#18201E] dark:text-[#EDF2EF]">
            {profile.affirmedFacts.length + profile.observedPatterns.length}
          </span>{' '}
          anotaciones de perfil ·{' '}
          <span className="font-mono tabular-nums font-medium text-[#18201E] dark:text-[#EDF2EF]">
            {exerciseProgress.length}
          </span>{' '}
          {exerciseProgress.length === 1 ? 'ejercicio completado' : 'ejercicios completados'}.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <PWAInstallButton />

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#18201E] dark:text-[#EDF2EF] bg-[#F2F4F3] dark:bg-[#1E2824] hover:bg-[#E5EAE8] dark:hover:bg-[#26332E] border border-[#D4DBD8] dark:border-[#34423D] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Exportar respaldo completo (JSON)
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#B91C1C] dark:text-[#FCA5A5] bg-[#FEF2F2] dark:bg-[#2A1517] hover:bg-[#FEE2E2] dark:hover:bg-[#3A1C1F] border border-[#FECACA] dark:border-[#6B262B] rounded-lg transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar todos los datos locales
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-[#FEF2F2] dark:bg-[#2A1517] border border-[#FECACA] dark:border-[#6B262B] rounded-lg">
              <span className="text-xs font-medium text-[#7F1D1D] dark:text-[#FECACA] px-1">
                ¿Seguro que deseas borrar IndexedDB?
              </span>
              <button
                type="button"
                onClick={() => {
                  onResetAllData();
                  setConfirmReset(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#3A4743] dark:text-[#EDF2EF] bg-white dark:bg-[#1E2824] border border-[#D4DBD8] dark:border-[#34423D] rounded-md"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
