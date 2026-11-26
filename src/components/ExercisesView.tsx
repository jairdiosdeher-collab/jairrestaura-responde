import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { MICRO_INTERVENTIONS } from '../data/microinterventions';
import type {
  ExerciseProgressEntry,
  MicroInterventionSuggestion,
  MicroInterventionTemplate,
  PsychologicalProfile,
} from '../types/jairrestaura';

interface ExercisesViewProps {
  profile: PsychologicalProfile;
  pastoralIntegration: boolean;
  isOnline: boolean;
  exerciseProgress: ExerciseProgressEntry[];
  onSaveProgress: (entry: ExerciseProgressEntry) => void;
  preselectedExercise: MicroInterventionSuggestion | null;
  onClearPreselected: () => void;
}

type BreathPhase = 'inhala' | 'sosten' | 'exhala';

const BREATH_PHASES: {
  phase: BreathPhase;
  label: string;
  guidance: string;
  seconds: number;
  scaleClass: string;
}[] = [
  {
    phase: 'inhala',
    label: 'Inhala suave por la nariz',
    guidance: 'Sin forzar la capacidad pulmonar, deja que el aire entre despacio.',
    seconds: 4,
    scaleClass: 'scale-110',
  },
  {
    phase: 'sosten',
    label: 'Sostén con suavidad',
    guidance: 'Relaja mandíbula y hombros mientras sostienes suavemente.',
    seconds: 4,
    scaleClass: 'scale-110',
  },
  {
    phase: 'exhala',
    label: 'Exhala lento por la boca',
    guidance: 'Suelta el aire sin prisa, permitiendo que el cuerpo baje la tensión.',
    seconds: 6,
    scaleClass: 'scale-90',
  },
];

function buildLocalOfflineExerciseGuidance(
  template: MicroInterventionTemplate,
  filled: { prompt: string; answer: string }[],
  profile: PsychologicalProfile,
  pastoralIntegration: boolean
): { reflection: string; gentleNextStep: string } {
  const observationSummary =
    filled.length > 0
      ? `Darte un espacio para escribir "${filled[0].answer.slice(0, 110)}${filled[0].answer.length > 110 ? '...' : ''}" ya es un acto concreto de autoobservación sin juzgarte.`
      : 'Tomarte unos minutos para observar lo que ocurre dentro de ti ya fortalece tu claridad interior.';

  const strengthHint =
    profile.strengthsAndValues.length > 0
      ? ` Apóyate en un recurso real que ya has reconocido en ti: ${profile.strengthsAndValues[0]}.`
      : '';

  const pastoralLine = pastoralIntegration
    ? ' Recuerda también que la gracia no exige perfección inmediata, sino honestidad y pasos sostenibles.'
    : '';

  return {
    reflection: `${observationSummary} (Devolución generada localmente sin conexión a internet).${strengthHint}${pastoralLine}`,
    gentleNextStep: `Durante las próximas 24 horas, elige una sola situación cotidiana de baja exigencia para aplicar "${template.title}" en dosis pequeña y segura.`,
  };
}

export function ExercisesView({
  profile,
  pastoralIntegration,
  isOnline,
  exerciseProgress,
  onSaveProgress,
  preselectedExercise,
  onClearPreselected,
}: ExercisesViewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MicroInterventionTemplate | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [guidanceResult, setGuidanceResult] = useState<{
    reflection: string;
    gentleNextStep: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [skippedNotice, setSkippedNotice] = useState(false);
  const [savedBreathingNotice, setSavedBreathingNotice] = useState(false);

  // Interactive 4-4-6 breathing pacer state
  const [breathingActive, setBreathingActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(BREATH_PHASES[0].seconds);
  const [completedCycles, setCompletedCycles] = useState(0);

  useEffect(() => {
    if (preselectedExercise) {
      const matched = MICRO_INTERVENTIONS.find((m) => m.id === preselectedExercise.id);
      const template: MicroInterventionTemplate = matched || {
        id: preselectedExercise.id,
        title: preselectedExercise.title,
        category: preselectedExercise.category,
        durationLabel: preselectedExercise.durationLabel,
        description: preselectedExercise.prompt,
        steps: preselectedExercise.steps,
        reflectionPrompts: [
          '¿Qué observaste en ti al detenerte en este punto?',
          '¿Qué pequeño paso sientes posible y seguro hoy?',
        ],
      };
      setSelectedTemplate(template);
      setAnswers(template.reflectionPrompts.map(() => ''));
      setGuidanceResult(null);
      setErrorMsg(null);
      setSkippedNotice(false);
      setSavedBreathingNotice(false);
      onClearPreselected();
    }
  }, [preselectedExercise, onClearPreselected]);

  useEffect(() => {
    if (!breathingActive) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        setPhaseIndex((currIdx) => {
          const nextIdx = (currIdx + 1) % BREATH_PHASES.length;
          if (nextIdx === 0) {
            setCompletedCycles((c) => c + 1);
          }
          setSecondsLeft(BREATH_PHASES[nextIdx].seconds);
          return nextIdx;
        });
        return 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [breathingActive]);

  const openExercise = (item: MicroInterventionTemplate) => {
    setSelectedTemplate(item);
    setAnswers(item.reflectionPrompts.map(() => ''));
    setGuidanceResult(null);
    setErrorMsg(null);
    setSkippedNotice(false);
    setSavedBreathingNotice(false);
    setBreathingActive(false);
    setPhaseIndex(0);
    setSecondsLeft(BREATH_PHASES[0].seconds);
    setCompletedCycles(0);
  };

  const resetBreathing = () => {
    setBreathingActive(false);
    setPhaseIndex(0);
    setSecondsLeft(BREATH_PHASES[0].seconds);
    setCompletedCycles(0);
  };

  const skipBreathingExercise = () => {
    setBreathingActive(false);
    setSkippedNotice(true);
  };

  const saveBreathingProgress = () => {
    if (!selectedTemplate) return;
    onSaveProgress({
      id: `prog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      exerciseId: selectedTemplate.id,
      exerciseTitle: selectedTemplate.title,
      category: selectedTemplate.category,
      completedAt: new Date().toISOString(),
      answers: [
        {
          prompt: 'Ciclos completados con ritmo cómodo',
          answer: `${completedCycles} ciclos`,
        },
      ],
      reflection: 'Práctica de regulación respiratoria guardada localmente.',
      mode: isOnline ? 'online' : 'offline',
    });
    setSavedBreathingNotice(true);
  };

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || submitting) return;

    const filled = selectedTemplate.reflectionPrompts
      .map((prompt, i) => ({
        prompt,
        answer: (answers[i] || '').trim(),
      }))
      .filter((entry) => entry.answer.length > 0);

    if (filled.length === 0) {
      setErrorMsg('Escribe al menos una breve observación para guardar o recibir orientación.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let result: { reflection: string; gentleNextStep: string };
      let usedMode: 'online' | 'offline' = 'offline';

      if (!isOnline) {
        // Never invoke Gemini when offline
        result = buildLocalOfflineExerciseGuidance(
          selectedTemplate,
          filled,
          profile,
          pastoralIntegration
        );
      } else {
        const res = await fetch('/api/microintervention/guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseTitle: selectedTemplate.title,
            exerciseCategory: selectedTemplate.category,
            answers: filled,
            profile,
            pastoralIntegration,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'No fue posible procesar el ejercicio.');
        }
        result = data;
        usedMode = 'online';
      }

      setGuidanceResult(result);
      onSaveProgress({
        id: `prog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        exerciseId: selectedTemplate.id,
        exerciseTitle: selectedTemplate.title,
        category: selectedTemplate.category,
        completedAt: new Date().toISOString(),
        answers: filled,
        reflection: result.reflection,
        mode: usedMode,
      });
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Ocurrió un error al procesar tu ejercicio.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedTemplate) {
    const currentPhase = BREATH_PHASES[phaseIndex];
    const phaseProgressPct = Math.round(
      ((currentPhase.seconds - secondsLeft + 1) / currentPhase.seconds) * 100
    );

    return (
      <div className="max-w-[820px] mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => {
            setSelectedTemplate(null);
            setBreathingActive(false);
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#52605C] hover:text-[#18201E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a todos los ejercicios
        </button>

        <article className="bg-white border border-[#E2E6E4] rounded-xl p-6 sm:p-8 space-y-6">
          <header className="space-y-2 border-b border-[#EEF1EF] pb-5">
            <div className="text-xs text-[#52605C]">
              {selectedTemplate.category} · {selectedTemplate.durationLabel} · Disponible sin internet
            </div>
            <h1 className="text-2xl font-semibold text-[#18201E]">
              {selectedTemplate.title}
            </h1>
            <p className="text-sm sm:text-base text-[#3A4743] leading-relaxed">
              {selectedTemplate.description}
            </p>
          </header>

          {/* Steps */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#18201E]">
              Pasos graduales
            </h2>
            <ol className="space-y-2.5 text-sm text-[#3A4743]">
              {selectedTemplate.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-xs font-mono font-medium text-[#2E5A4C] pt-0.5 tabular-nums">
                    0{i + 1}.
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Offline 4-4-6 interactive breathing regulator */}
          {selectedTemplate.isBreathingExercise && (
            <div className="p-6 bg-[#F2F6F4] border border-[#D4E0DA] rounded-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Local geometric breathing circle */}
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <div
                      aria-hidden="true"
                      className={`w-20 h-20 rounded-full border-2 border-[#2E5A4C] bg-[#E3EDE8] transition-transform duration-1000 ease-out flex items-center justify-center ${
                        breathingActive ? currentPhase.scaleClass : 'scale-95'
                      }`}
                    >
                      <span className="text-xl font-mono font-semibold text-[#2E5A4C] tabular-nums">
                        {secondsLeft}s
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-[#52605C]">
                      Ritmo 4-4-6 sin conexión · Ciclos:{' '}
                      <span className="font-mono tabular-nums text-[#18201E]">
                        {completedCycles}
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-[#18201E]">
                      {breathingActive ? currentPhase.label : 'Listo cuando tú decidas'}
                    </div>
                    <p className="text-xs text-[#3A4743] leading-relaxed max-w-[40ch]">
                      {breathingActive
                        ? currentPhase.guidance
                        : 'Puedes probar dos o tres ciclos cortos, detenerte cuando quieras u omitir este ejercicio.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSkippedNotice(false);
                      setBreathingActive((v) => !v);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#2E5A4C] hover:bg-[#24483D] rounded-lg transition-colors whitespace-nowrap"
                  >
                    {breathingActive ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Detener
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Iniciar
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetBreathing}
                    aria-label="Reiniciar temporizador"
                    className="p-2.5 text-[#52605C] hover:text-[#18201E] bg-white border border-[#D4DBD8] rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={skipBreathingExercise}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-[#3A4743] bg-white border border-[#D4DBD8] hover:border-[#2E5A4C] rounded-lg transition-colors whitespace-nowrap"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    Omitir ejercicio
                  </button>
                </div>
              </div>

              {/* Phase progress bar */}
              <div className="w-full h-1.5 bg-[#DCE5E0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2E5A4C] transition-all duration-500"
                  style={{ width: `${breathingActive ? phaseProgressPct : 0}%` }}
                />
              </div>

              {/* Mandatory comfort & safety note */}
              <p className="text-xs text-[#3A4743] leading-relaxed border-t border-[#D4E0DA] pt-3">
                <strong>Cuidado corporal:</strong> no forces respiraciones profundas ni retenciones prolongadas. Si sientes mareo, presión en el pecho o incomodidad, suspende el ejercicio de inmediato y vuelve a tu respiración natural.
              </p>

              {skippedNotice && (
                <div className="p-3 bg-white border border-[#D4DBD8] rounded-lg text-xs text-[#3A4743]">
                  Has elegido omitir la guía respiratoria. Está completamente bien respetar lo que tu cuerpo necesita hoy; puedes volver a tu respiración natural o escribir abajo si deseas reflexionar.
                </div>
              )}

              {completedCycles > 0 && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-[#52605C]">
                    ¿Quieres registrar este momento en tu progreso local?
                  </span>
                  <button
                    type="button"
                    onClick={saveBreathingProgress}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2E5A4C] bg-white border border-[#C6D5CE] hover:border-[#2E5A4C] rounded-lg transition-colors whitespace-nowrap"
                  >
                    {savedBreathingNotice && <Check className="w-3.5 h-3.5" />}
                    <span>
                      {savedBreathingNotice ? 'Guardado en este dispositivo' : 'Guardar progreso'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reflection prompts */}
          <form onSubmit={handleSubmitReflection} className="space-y-4 pt-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#18201E]">
                Tu observación personal
              </h2>
              {!isOnline && (
                <span className="text-xs text-[#52605C]">
                  Modo sin conexión · Guardado local en IndexedDB
                </span>
              )}
            </div>

            {selectedTemplate.reflectionPrompts.map((prompt, idx) => (
              <div key={idx} className="space-y-1.5">
                <label
                  htmlFor={`prompt-${idx}`}
                  className="block text-sm font-medium text-[#3A4743]"
                >
                  {prompt}
                </label>
                <textarea
                  id={`prompt-${idx}`}
                  rows={3}
                  value={answers[idx] || ''}
                  onChange={(e) => {
                    const next = [...answers];
                    next[idx] = e.target.value;
                    setAnswers(next);
                  }}
                  placeholder="Escribe con honestidad y sin exigirte respuestas perfectas..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F6F7F6] focus:bg-white border border-[#DCE1DF] focus:border-[#2E5A4C] rounded-lg focus:outline-none"
                />
              </div>
            ))}

            {errorMsg && (
              <p role="alert" className="text-sm text-[#B91C1C]">
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#2E5A4C] hover:bg-[#24483D] disabled:bg-[#9FB3AC] rounded-lg transition-colors whitespace-nowrap"
              >
                {submitting
                  ? 'Preparando devolución...'
                  : isOnline
                    ? 'Guardar y recibir devolución personalizada'
                    : 'Guardar y recibir orientación local'}
              </button>
            </div>
          </form>

          {guidanceResult && (
            <div className="p-5 bg-[#F6F7F6] border border-[#D4DBD8] rounded-xl space-y-3">
              <h3 className="text-sm font-semibold text-[#18201E]">
                Acompañamiento sobre tu ejercicio
              </h3>
              <p className="text-sm text-[#18201E] leading-relaxed whitespace-pre-wrap">
                {guidanceResult.reflection}
              </p>
              <div className="pt-3 border-t border-[#E2E6E4]">
                <span className="text-xs font-semibold text-[#2E5A4C] block mb-1">
                  Siguiente paso gradual sugerido
                </span>
                <p className="text-sm text-[#3A4743] leading-relaxed">
                  {guidanceResult.gentleNextStep}
                </p>
              </div>
            </div>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      <header className="space-y-3 pb-6 border-b border-[#E2E6E4]">
        <div className="text-xs font-medium text-[#52605C]">
          Microintervenciones psicológicas · Progresión gradual · Funciona sin conexión
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#18201E] text-balance">
          Ejercicios breves para ganar claridad y autenticidad
        </h1>
        <p className="text-sm sm:text-base text-[#3A4743] leading-relaxed max-w-[70ch]">
          No necesitas cambiar todo de golpe. Elige una práctica breve y adaptada a tu ritmo para observar tus emociones, suavizar la máscara social o ensayar un límite sin culpa. Tu progreso se conserva localmente en IndexedDB.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MICRO_INTERVENTIONS.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-[#E2E6E4] rounded-xl p-6 flex flex-col justify-between gap-5"
          >
            <div className="space-y-2">
              <div className="text-xs text-[#52605C] tabular-nums">
                {item.category} · {item.durationLabel}
              </div>
              <h2 className="text-lg font-semibold text-[#18201E]">{item.title}</h2>
              <p className="text-sm text-[#3A4743] leading-relaxed">{item.description}</p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => openExercise(item)}
                className="px-4 py-2 text-xs font-medium text-[#2E5A4C] bg-[#F2F6F4] hover:bg-[#E5EEE9] rounded-lg transition-colors whitespace-nowrap"
              >
                Abrir ejercicio
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Saved Exercise Progress */}
      <section className="bg-white border border-[#E2E6E4] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-[#18201E]">
            Progreso guardado en este dispositivo
          </h2>
          <span className="text-xs text-[#52605C] tabular-nums">
            {exerciseProgress.length} {exerciseProgress.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {exerciseProgress.length === 0 ? (
          <p className="text-sm text-[#7A8783]">
            Cuando completes un ejercicio respiratorio o una reflexión personal, quedará registrado aquí incluso sin conexión.
          </p>
        ) : (
          <ul className="divide-y divide-[#EEF1EF]">
            {exerciseProgress.slice(0, 8).map((entry) => (
              <li key={entry.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <div className="text-sm font-medium text-[#18201E]">{entry.exerciseTitle}</div>
                  {entry.answers[0] && (
                    <p className="text-xs text-[#52605C] line-clamp-1 mt-0.5">
                      {entry.answers[0].answer}
                    </p>
                  )}
                </div>
                <div className="text-xs text-[#52605C] tabular-nums shrink-0">
                  {new Date(entry.completedAt).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                  })}{' '}
                  · {entry.mode === 'offline' ? 'Local sin conexión' : 'En línea'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
