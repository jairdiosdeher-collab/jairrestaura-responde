import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Compass,
  PhoneCall,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { CONVERSATION_STARTERS } from '../data/microinterventions';
import type {
  ChatMessage,
  MicroInterventionSuggestion,
} from '../types/jairrestaura';

interface ConversationViewProps {
  sessionTitle: string;
  messages: ChatMessage[];
  isLoading: boolean;
  errorMessage: string | null;
  isOnline: boolean;
  justReconnected: boolean;
  offlineTurnsPending: number;
  onDismissReconnect: () => void;
  onSyncOfflineContextWithGemini: () => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
  onOpenSuggestedExercise: (exercise: MicroInterventionSuggestion) => void;
  onGoToProfile: () => void;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function ConversationView({
  sessionTitle,
  messages,
  isLoading,
  errorMessage,
  isOnline,
  justReconnected,
  offlineTurnsPending,
  onDismissReconnect,
  onSyncOfflineContextWithGemini,
  onSendMessage,
  onOpenSuggestedExercise,
  onGoToProfile,
}: ConversationViewProps) {
  const [input, setInput] = useState('');
  const [expandedInsightIds, setExpandedInsightIds] = useState<Record<string, boolean>>({});
  const [imgFailed, setImgFailed] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const toggleInsight = (id: string) => {
    setExpandedInsightIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const latestUrgentMessage = [...messages]
    .reverse()
    .find((m) => m.analysis?.safetyFlag && m.analysis.safetyFlag.level !== 'none');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[920px] mx-auto w-full">
      {/* Transparent Offline or Reconnection Status Bar */}
      {!isOnline && (
        <div
          role="status"
          className="mx-4 sm:mx-8 mt-4 p-3.5 bg-[#FFFBEB] dark:bg-[#261E0F] border border-[#FDE68A] dark:border-[#5C4417] rounded-xl flex items-start gap-3 text-xs sm:text-sm text-[#78350F] dark:text-[#FDE68A]"
        >
          <WifiOff className="w-4 h-4 shrink-0 mt-0.5 text-[#B45309] dark:text-[#FBBF24]" />
          <p className="leading-relaxed">
            Modo sin conexión: estás utilizando el acompañamiento local de JAIRRESTAURA. Las respuestas generativas de Gemini estarán disponibles nuevamente cuando recuperes internet.
          </p>
        </div>
      )}

      {isOnline && justReconnected && (
        <div
          role="status"
          className="mx-4 sm:mx-8 mt-4 p-4 bg-[#F2F6F4] dark:bg-[#17231F] border border-[#C6D5CE] dark:border-[#2F4A40] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#18201E] dark:text-[#EDF2EF]"
        >
          <div className="flex items-start gap-3">
            <Wifi className="w-4 h-4 shrink-0 mt-0.5 text-[#2E5A4C] dark:text-[#7EC4AA]" />
            <div className="space-y-0.5">
              <p className="font-semibold">
                Conexión restablecida · Ya puedes continuar con Gemini
              </p>
              <p className="text-xs text-[#3A4743] dark:text-[#C7D2CD] leading-relaxed">
                Tus mensajes escritos sin internet se conservaron localmente y no se han enviado automáticamente.
                {offlineTurnsPending > 0
                  ? ' Si lo deseas, puedes compartir el resumen de lo conversado offline para actualizar tu acompañamiento con Gemini.'
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {offlineTurnsPending > 0 && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void onSyncOfflineContextWithGemini()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2E5A4C] hover:bg-[#24483D] dark:bg-[#356959] dark:hover:bg-[#2B5649] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Continuar con Gemini usando este contexto
              </button>
            )}
            <button
              type="button"
              onClick={onDismissReconnect}
              className="px-3 py-1.5 text-xs font-medium text-[#3A4743] dark:text-[#EDF2EF] bg-white dark:bg-[#1E2824] border border-[#D4DBD8] dark:border-[#34423D] hover:border-[#2E5A4C] dark:hover:border-[#65B397] rounded-lg transition-colors whitespace-nowrap"
            >
              Solo continuar normalmente
            </button>
          </div>
        </div>
      )}

      {/* Scrollable conversation canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
        {messages.length === 0 ? (
          <div className="space-y-8">
            {/* Editorial Welcome Split */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch bg-white dark:bg-[#18201D] border border-[#E2E6E4] dark:border-[#2A3531] rounded-xl overflow-hidden">
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-[#52605C] dark:text-[#9AA8A2]">
                    Acompañamiento psicológico personalizado ·{' '}
                    {isOnline ? 'Modo en línea (Gemini)' : 'Modo local sin conexión'}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#18201E] dark:text-[#EDF2EF] leading-tight text-balance">
                    Comprender antes de aconsejar. Acompañar antes de confrontar.
                  </h1>
                  <p className="text-sm sm:text-base text-[#3A4743] dark:text-[#C7D2CD] leading-relaxed max-w-[60ch]">
                    Este es un espacio sereno para explorar lo que sientes, entender qué buscan proteger tus respuestas habituales y dar pasos realistas hacia una vida más auténtica y libre.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#52605C] dark:text-[#9AA8A2]">
                  <span>Sin etiquetas ni diagnósticos apresurados</span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={onGoToProfile}
                    className="text-[#2E5A4C] dark:text-[#7EC4AA] font-medium hover:underline"
                  >
                    Ver tu perfil provisional
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 min-h-[200px] bg-[#E8ECEA] dark:bg-[#1E2824] relative">
                {!imgFailed ? (
                  <img
                    src="/src/assets/images/sanctuary_studio_light_1795685678893.jpg"
                    alt="Espacio sereno de conversación terapéutica con luz natural de mañana"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover md:absolute md:inset-0 dark:brightness-90 dark:contrast-105"
                  />
                ) : (
                  <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#ECEFEC] to-[#DCE3DF] dark:from-[#1A2420] dark:to-[#121916]">
                    <Compass className="w-7 h-7 text-[#2E5A4C] dark:text-[#7EC4AA] mb-2" />
                    <span className="text-xs font-medium text-[#3A4743] dark:text-[#C7D2CD]">
                      Espacio de escucha y claridad
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Starting reflection prompts */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-[#52605C] dark:text-[#9AA8A2]">
                Si no sabes por dónde empezar, puedes elegir una puerta de entrada:
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONVERSATION_STARTERS.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    onClick={() => void onSendMessage(starter.prompt)}
                    disabled={isLoading}
                    className="text-left p-4 bg-white dark:bg-[#18201D] border border-[#E2E6E4] dark:border-[#2A3531] hover:border-[#2E5A4C] dark:hover:border-[#65B397] rounded-xl transition-colors group focus-visible:outline-2 focus-visible:outline-[#2E5A4C] dark:focus-visible:outline-[#65B397]"
                  >
                    <div className="text-sm font-semibold text-[#18201E] dark:text-[#EDF2EF] group-hover:text-[#2E5A4C] dark:group-hover:text-[#7EC4AA] transition-colors">
                      {starter.label}
                    </div>
                    <p className="mt-1.5 text-xs sm:text-sm text-[#52605C] dark:text-[#9AA8A2] leading-relaxed line-clamp-3">
                      {starter.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="pb-3 border-b border-[#E2E6E4] dark:border-[#2A3531] flex items-center justify-between gap-4">
              <h1 className="text-lg font-semibold text-[#18201E] dark:text-[#EDF2EF] truncate">
                {sessionTitle}
              </h1>
              <span className="text-xs text-[#52605C] dark:text-[#9AA8A2] tabular-nums shrink-0">
                {messages.length} {messages.length === 1 ? 'intervención' : 'intervenciones'}
              </span>
            </div>

            {latestUrgentMessage?.analysis?.safetyFlag && (
              <div
                role="alert"
                className="p-4 sm:p-5 bg-[#FEF2F2] dark:bg-[#2A1517] border border-[#FECACA] dark:border-[#6B262B] rounded-xl flex items-start gap-3.5"
              >
                <PhoneCall className="w-5 h-5 text-[#B91C1C] dark:text-[#FCA5A5] shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-sm text-[#7F1D1D] dark:text-[#FECACA]">
                  <p className="font-semibold">
                    Prioricemos tu seguridad y cuidado inmediato
                  </p>
                  <p className="leading-relaxed">
                    {latestUrgentMessage.analysis.safetyFlag.guidance ||
                      'Si estás atravesando un momento de peligro, desesperanza intensa o riesgo de hacerte daño, busca apoyo humano cercano ahora mismo. En Colombia, llama al 123 o acude al servicio de urgencias más cercano.'}
                  </p>
                  {!isOnline && (
                    <p className="text-xs font-medium pt-1">
                      Nota de modo sin conexión: sin internet, la aplicación no puede contactar automáticamente servicios de emergencia ni verificar líneas de atención.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-7">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isExpanded = Boolean(expandedInsightIds[msg.id]);
                const isLocalOffline = !isUser && msg.source === 'local_offline';

                return (
                  <article
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    {/* Metadata row: unboxed text with middot separators */}
                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-[#52605C] dark:text-[#9AA8A2]">
                      <span className="font-semibold text-[#18201E] dark:text-[#EDF2EF]">
                        {isUser
                          ? 'Tú'
                          : isLocalOffline
                            ? 'JAIRRESTAURA (Acompañamiento local)'
                            : 'JAIRRESTAURA'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatTime(msg.timestamp)}</span>
                      {!isUser && msg.analysis?.selectedStyle && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{msg.analysis.selectedStyle}</span>
                        </>
                      )}
                      {isUser && msg.createdOffline && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Escrito sin conexión</span>
                        </>
                      )}
                    </div>

                    {/* Message body */}
                    <div
                      className={`max-w-[70ch] text-[15px] leading-[1.7] dark:tracking-[0.01em] whitespace-pre-wrap ${
                        isUser
                          ? 'bg-[#EAEFED] dark:bg-[#21332C] text-[#18201E] dark:text-[#EDF2EF] px-5 py-3.5 rounded-2xl rounded-tr-sm'
                          : 'bg-white dark:bg-[#18201D] border border-[#E2E6E4] dark:border-[#2A3531] text-[#18201E] dark:text-[#EDF2EF] px-5 sm:px-6 py-4 sm:py-5 rounded-2xl rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Expandable transparent comprehension lens */}
                    {!isUser && msg.analysis && (
                      <div className="mt-2 max-w-[70ch] w-full">
                        <button
                          type="button"
                          onClick={() => toggleInsight(msg.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52605C] dark:text-[#9AA8A2] hover:text-[#18201E] dark:hover:text-[#EDF2EF] transition-colors py-1"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                          <span>Comprensión del momento</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-1.5 p-4 bg-[#F2F4F3] dark:bg-[#141B18] border border-[#E2E6E4] dark:border-[#2A3531] rounded-xl text-xs text-[#3A4743] dark:text-[#C7D2CD] space-y-2">
                            <div>
                              <span className="font-semibold text-[#18201E] dark:text-[#EDF2EF]">
                                Emoción percibida:{' '}
                              </span>
                              <span>{msg.analysis.detectedEmotion}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-[#18201E] dark:text-[#EDF2EF]">
                                Necesidad emocional posible:{' '}
                              </span>
                              <span>{msg.analysis.underlyingNeed}</span>
                            </div>
                            {msg.analysis.protectiveFunctionInsight && (
                              <div>
                                <span className="font-semibold text-[#18201E] dark:text-[#EDF2EF]">
                                  Función protectora observada:{' '}
                                </span>
                                <span>{msg.analysis.protectiveFunctionInsight}</span>
                              </div>
                            )}
                            <div className="pt-1 border-t border-[#E2E6E4] dark:border-[#2A3531] text-[#52605C] dark:text-[#9AA8A2]">
                              Si alguna lectura no te representa, dímelo o ajústala directamente en{' '}
                              <button
                                type="button"
                                onClick={onGoToProfile}
                                className="text-[#2E5A4C] dark:text-[#7EC4AA] font-medium hover:underline"
                              >
                                Mi Perfil
                              </button>
                              .
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Optional suggested micro-intervention */}
                    {!isUser &&
                      msg.suggestedMicroIntervention &&
                      msg.suggestedMicroIntervention.title.trim().length > 0 && (
                        <div className="mt-3 max-w-[70ch] w-full p-4 bg-[#F2F6F4] dark:bg-[#17231F] border border-[#D4E0DA] dark:border-[#2F4A40] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-xs text-[#52605C] dark:text-[#9AA8A2]">
                              Ejercicio sugerido · {msg.suggestedMicroIntervention.durationLabel}
                            </div>
                            <div className="text-sm font-semibold text-[#18201E] dark:text-[#EDF2EF]">
                              {msg.suggestedMicroIntervention.title}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenSuggestedExercise(msg.suggestedMicroIntervention!)
                            }
                            className="px-4 py-2 text-xs font-medium text-[#2E5A4C] dark:text-[#9BD7C1] bg-white dark:bg-[#1E2824] border border-[#C6D5CE] dark:border-[#345448] hover:border-[#2E5A4C] dark:hover:border-[#65B397] rounded-lg transition-colors whitespace-nowrap shrink-0"
                          >
                            Practicar paso a paso
                          </button>
                        </div>
                      )}
                  </article>
                );
              })}

              {isLoading && (
                <div className="flex flex-col items-start">
                  <div className="mb-1.5 text-xs font-semibold text-[#18201E] dark:text-[#EDF2EF]">
                    JAIRRESTAURA
                  </div>
                  <div className="px-5 py-4 bg-white dark:bg-[#18201D] border border-[#E2E6E4] dark:border-[#2A3531] rounded-2xl rounded-tl-sm text-sm text-[#52605C] dark:text-[#9AA8A2]">
                    Leyendo con atención lo que compartes...
                  </div>
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="p-4 bg-[#FEF2F2] dark:bg-[#2A1517] border border-[#FECACA] dark:border-[#6B262B] rounded-xl flex items-start gap-3 text-sm text-[#991B1B] dark:text-[#FCA5A5]"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[#E2E6E4] dark:border-[#2A3531] bg-[#F6F7F6] dark:bg-[#0E1311] px-4 sm:px-8 pt-3.5 pb-[4.5rem] md:pb-20">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#18201D] border border-[#D4DBD8] dark:border-[#34423D] focus-within:border-[#2E5A4C] dark:focus-within:border-[#65B397] rounded-xl p-2 flex items-end gap-2 transition-colors"
        >
          <label htmlFor="accompany-input" className="sr-only">
            Escribe lo que estás sintiendo o viviendo
          </label>
          <textarea
            id="accompany-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isOnline
                ? 'Cuéntame qué estás viviendo o sintiendo hoy...'
                : 'Modo local sin conexión: escribe aquí y tus conversaciones se guardarán en este dispositivo...'
            }
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm sm:text-[15px] text-[#18201E] dark:text-[#EDF2EF] placeholder:text-[#7A8783] dark:placeholder:text-[#7B8B85] focus:outline-none max-h-[180px]"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Enviar mensaje"
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-[#2E5A4C] hover:bg-[#24483D] dark:bg-[#356959] dark:hover:bg-[#2B5649] disabled:bg-[#CBD4D0] dark:disabled:bg-[#27332F] disabled:text-white/70 dark:disabled:text-[#6E7E78] text-white transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E5A4C] dark:focus-visible:outline-[#65B397]"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-2 text-xs text-[#52605C] dark:text-[#8E9C96]">
          {isOnline
            ? 'Modo en línea (Gemini) · Almacenamiento local en IndexedDB · No sustituye psicoterapia ni atención médica.'
            : 'Modo sin conexión activo · Acompañamiento local guardado en IndexedDB · No sustituye atención médica de urgencias.'}
        </p>
      </div>
    </div>
  );
}
