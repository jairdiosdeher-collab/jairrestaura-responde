import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { ProtectiveMechanism, PsychologicalProfile } from '../types/jairrestaura';

interface ProfileViewProps {
  profile: PsychologicalProfile;
  onUpdateProfile: (next: PsychologicalProfile) => void;
  onSendCorrectionToChat: (correctionText: string) => Promise<void>;
}

type StringArrayKey =
  | 'affirmedFacts'
  | 'observedPatterns'
  | 'explorableHypotheses'
  | 'unknownAreas'
  | 'strengthsAndValues'
  | 'personalGoals'
  | 'communicationPreferences';

interface SectionEditorProps {
  indexLabel: string;
  title: string;
  subtitle: string;
  items: string[];
  emptyText: string;
  placeholder: string;
  onAdd: (value: string) => void;
  onEdit: (idx: number, value: string) => void;
  onRemove: (idx: number) => void;
}

function ProfileListSection({
  indexLabel,
  title,
  subtitle,
  items,
  emptyText,
  placeholder,
  onAdd,
  onEdit,
  onRemove,
}: SectionEditorProps) {
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewItem('');
  };

  const startEdit = (idx: number, current: string) => {
    setEditingIndex(idx);
    setEditingValue(current);
  };

  const saveEdit = (idx: number) => {
    const trimmed = editingValue.trim();
    if (trimmed) {
      onEdit(idx, trimmed);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  return (
    <section className="bg-white dark:bg-[#18201D] border border-[#E2E6E4] dark:border-[#2A3531] rounded-xl p-6 space-y-4">
      <div className="space-y-1">
        <div className="text-xs font-medium text-[#52605C] dark:text-[#9AA8A2] tabular-nums">{indexLabel}</div>
        <h2 className="text-lg font-semibold text-[#18201E] dark:text-[#EDF2EF]">{title}</h2>
        <p className="text-xs sm:text-sm text-[#52605C] dark:text-[#9AA8A2] leading-relaxed">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#7A8783] dark:text-[#8E9C96] py-2">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-[#EEF1EF] dark:divide-[#25302C]">
          {items.map((item, idx) => (
            <li key={`${idx}-${item.slice(0, 12)}`} className="py-3 flex items-start justify-between gap-3">
              {editingIndex === idx ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(idx);
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-[#1E2824] text-[#18201E] dark:text-[#EDF2EF] border border-[#2E5A4C] dark:border-[#65B397] rounded-lg focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(idx)}
                    aria-label="Guardar cambio"
                    className="p-1.5 text-[#2E5A4C] dark:text-[#7EC4AA] hover:bg-[#F2F6F4] dark:hover:bg-[#1F2D27] rounded-md"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    aria-label="Cancelar edición"
                    className="p-1.5 text-[#52605C] dark:text-[#9AA8A2] hover:bg-[#F2F4F3] dark:hover:bg-[#232D29] rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-[#18201E] dark:text-[#EDF2EF] leading-relaxed flex-1">{item}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(idx, item)}
                      aria-label="Corregir elemento"
                      className="p-1.5 text-[#7A8783] dark:text-[#8E9C96] hover:text-[#18201E] dark:hover:text-[#EDF2EF] rounded-md transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      aria-label="Eliminar elemento"
                      className="p-1.5 text-[#7A8783] dark:text-[#8E9C96] hover:text-[#B91C1C] dark:hover:text-[#FCA5A5] rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="pt-2 flex items-center gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm bg-[#F6F7F6] dark:bg-[#131917] text-[#18201E] dark:text-[#EDF2EF] placeholder:text-[#7A8783] dark:placeholder:text-[#7B8B85] border border-[#DCE1DF] dark:border-[#34423D] focus:bg-white dark:focus:bg-[#1E2824] focus:border-[#2E5A4C] dark:focus:border-[#65B397] rounded-lg focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#2E5A4C] dark:text-[#9BD7C1] bg-[#F2F6F4] dark:bg-[#1E2B26] hover:bg-[#E5EEE9] dark:hover:bg-[#25362F] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir
        </button>
      </form>
    </section>
  );
}

export function ProfileView({
  profile,
  onUpdateProfile,
  onSendCorrectionToChat,
}: ProfileViewProps) {
  const [correctionNote, setCorrectionNote] = useState('');
  const [sendingCorrection, setSendingCorrection] = useState(false);

  const updateArrayField = (key: StringArrayKey, updater: (prev: string[]) => string[]) => {
    onUpdateProfile({
      ...profile,
      [key]: updater(profile[key]),
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  const removeMechanism = (id: string) => {
    onUpdateProfile({
      ...profile,
      protectiveMechanisms: profile.protectiveMechanisms.filter((m) => m.id !== id),
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = correctionNote.trim();
    if (!trimmed || sendingCorrection) return;
    setSendingCorrection(true);
    try {
      await onSendCorrectionToChat(trimmed);
      setCorrectionNote('');
    } finally {
      setSendingCorrection(false);
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-3 pb-6 border-b border-[#E2E6E4] dark:border-[#2A3531]">
        <div className="text-xs font-medium text-[#52605C] dark:text-[#9AA8A2]">
          Perfil psicológico orientativo · Dinámico y corregible
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#18201E] dark:text-[#EDF2EF] text-balance">
          Tu mapa emocional y relacional en construcción
        </h1>
        <p className="text-sm sm:text-base text-[#3A4743] dark:text-[#C7D2CD] leading-relaxed max-w-[70ch]">
          Este espacio distingue con claridad entre lo que tú has afirmado directamente, los patrones que parecen repetirse, las hipótesis abiertas por explorar y lo que aún no conocemos. No es un diagnóstico ni una etiqueta fija: puedes editar, eliminar o corregir cualquier punto en todo momento.
        </p>
      </header>

      {/* Direct correction prompt to AI */}
      <section className="bg-[#F2F6F4] dark:bg-[#17231F] border border-[#D4E0DA] dark:border-[#2F4A40] rounded-xl p-6 space-y-3">
        <h2 className="text-base font-semibold text-[#18201E] dark:text-[#EDF2EF]">
          ¿Algo en este perfil no te representa?
        </h2>
        <p className="text-xs sm:text-sm text-[#3A4743] dark:text-[#C7D2CD] leading-relaxed">
          Puedes editar cualquier línea directamente abajo o escribirle una aclaración a JAIRRESTAURA para que actualice su comprensión en la conversación.
        </p>
        <form onSubmit={handleCorrectionSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <input
            type="text"
            value={correctionNote}
            onChange={(e) => setCorrectionNote(e.target.value)}
            placeholder="Ej.: Cuando callo en reuniones no es por miedo al rechazo, sino porque necesito procesar antes de hablar..."
            className="flex-1 px-3.5 py-2.5 text-sm bg-white dark:bg-[#1E2824] text-[#18201E] dark:text-[#EDF2EF] placeholder:text-[#7A8783] dark:placeholder:text-[#7B8B85] border border-[#C6D5CE] dark:border-[#345448] focus:border-[#2E5A4C] dark:focus:border-[#65B397] rounded-lg focus:outline-none"
          />
          <button
            type="submit"
            disabled={!correctionNote.trim() || sendingCorrection}
            className="px-4 py-2.5 text-sm font-medium text-white bg-[#2E5A4C] hover:bg-[#24483D] dark:bg-[#356959] dark:hover:bg-[#2B5649] disabled:bg-[#9FB3AC] dark:disabled:bg-[#27332F] dark:disabled:text-[#6E7E78] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {sendingCorrection ? 'Actualizando...' : 'Enviar aclaración'}
          </button>
        </form>
      </section>

      {/* 4 Epistemic Distinctions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileListSection
          indexLabel="01. Hechos compartidos"
          title="Lo que afirmas directamente"
          subtitle="Experiencias, vivencias y preferencias que tú mismo has expresado en tus palabras."
          items={profile.affirmedFacts}
          emptyText="Aún no hay hechos registrados. Irán apareciendo a medida que converses o puedes añadirlos aquí."
          placeholder="Añadir algo importante sobre tu historia o presente..."
          onAdd={(v) => updateArrayField('affirmedFacts', (prev) => [...prev, v])}
          onEdit={(idx, v) =>
            updateArrayField('affirmedFacts', (prev) => prev.map((it, i) => (i === idx ? v : it)))
          }
          onRemove={(idx) =>
            updateArrayField('affirmedFacts', (prev) => prev.filter((_, i) => i !== idx))
          }
        />

        <ProfileListSection
          indexLabel="02. Recurrencias"
          title="Patrones que parecen repetirse"
          subtitle="Ciclos de pensamiento, emoción o relación que se observan con frecuencia."
          items={profile.observedPatterns}
          emptyText="Todavía no hemos identificado patrones recurrentes juntos."
          placeholder="Añadir un patrón que hayas notado en ti..."
          onAdd={(v) => updateArrayField('observedPatterns', (prev) => [...prev, v])}
          onEdit={(idx, v) =>
            updateArrayField('observedPatterns', (prev) => prev.map((it, i) => (i === idx ? v : it)))
          }
          onRemove={(idx) =>
            updateArrayField('observedPatterns', (prev) => prev.filter((_, i) => i !== idx))
          }
        />

        <ProfileListSection
          indexLabel="03. Exploración abierta"
          title="Hipótesis psicológicas por explorar"
          subtitle="Posibilidades tentativas para reflexionar juntos. Nunca son conclusiones cerradas ni diagnósticos."
          items={profile.explorableHypotheses}
          emptyText="No hay hipótesis abiertas en este momento."
          placeholder="Añadir una pregunta o hipótesis sobre ti..."
          onAdd={(v) => updateArrayField('explorableHypotheses', (prev) => [...prev, v])}
          onEdit={(idx, v) =>
            updateArrayField('explorableHypotheses', (prev) =>
              prev.map((it, i) => (i === idx ? v : it))
            )
          }
          onRemove={(idx) =>
            updateArrayField('explorableHypotheses', (prev) => prev.filter((_, i) => i !== idx))
          }
        />

        <ProfileListSection
          indexLabel="04. Humildad epistémica"
          title="Aspectos que aún no conocemos"
          subtitle="Áreas de tu vida que todavía no has compartido y que evitamos suponer o rellenar."
          items={profile.unknownAreas}
          emptyText="Has compartido bastante contexto hasta ahora."
          placeholder="Añadir un tema que aún no hemos conversado..."
          onAdd={(v) => updateArrayField('unknownAreas', (prev) => [...prev, v])}
          onEdit={(idx, v) =>
            updateArrayField('unknownAreas', (prev) => prev.map((it, i) => (i === idx ? v : it)))
          }
          onRemove={(idx) =>
            updateArrayField('unknownAreas', (prev) => prev.filter((_, i) => i !== idx))
          }
        />
      </div>

      {/* Protective Mechanisms (Section 5) */}
      <section className="bg-white dark:bg-[#18201D] border border-[#E2E6E4] dark:border-[#2A3531] rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-[#52605C] dark:text-[#9AA8A2]">
            05. Comprensión sin culpabilización
          </div>
          <h2 className="text-lg font-semibold text-[#18201E] dark:text-[#EDF2EF]">
            Mecanismos de protección y adaptación
          </h2>
          <p className="text-xs sm:text-sm text-[#52605C] dark:text-[#9AA8A2] leading-relaxed">
            Estrategias como complacer, enmascarar o aislarse suelen haber cumplido una función protectora en algún momento, aunque hoy puedan resultar agotadoras.
          </p>
        </div>

        {profile.protectiveMechanisms.length === 0 ? (
          <p className="text-sm text-[#7A8783] dark:text-[#8E9C96] py-2">
            A medida que explores situaciones difíciles en conversación, aparecerán aquí sus posibles funciones protectoras y costos actuales.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E6E4] dark:border-[#2A3531] text-xs font-semibold text-[#52605C] dark:text-[#9AA8A2]">
                  <th className="py-2.5 pr-4">Estrategia observada</th>
                  <th className="py-2.5 pr-4">Qué pudo proteger</th>
                  <th className="py-2.5 pr-4">Costo en tu presente</th>
                  <th className="py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1EF] dark:divide-[#25302C] text-sm text-[#18201E] dark:text-[#EDF2EF]">
                {profile.protectiveMechanisms.map((mech: ProtectiveMechanism) => (
                  <tr key={mech.id} className="align-top">
                    <td className="py-3 pr-4 font-medium">{mech.behavior}</td>
                    <td className="py-3 pr-4 text-[#3A4743] dark:text-[#C7D2CD]">{mech.possibleFunction}</td>
                    <td className="py-3 pr-4 text-[#3A4743] dark:text-[#C7D2CD]">{mech.presentCost}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeMechanism(mech.id)}
                        aria-label={`Eliminar mecanismo ${mech.behavior}`}
                        className="p-1.5 text-[#7A8783] dark:text-[#8E9C96] hover:text-[#B91C1C] dark:hover:text-[#FCA5A5] rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Strengths, Goals & Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProfileListSection
          indexLabel="06. Recursos internos"
          title="Fortalezas y valores"
          subtitle="Capacidades personales que te sostienen más allá de la aprobación externa."
          items={profile.strengthsAndValues}
          emptyText="Aún por descubrir juntos."
          placeholder="Añadir fortaleza o valor..."
          onAdd={(v) => updateArrayField('strengthsAndValues', (prev) => [...prev, v])}
          onEdit={(idx, v) =>
            updateArrayField('strengthsAndValues', (prev) =>
              prev.map((it, i) => (i === idx ? v : it))
            )
          }
          onRemove={(idx) =>
            updateArrayField('strengthsAndValues', (prev) => prev.filter((_, i) => i !== idx))
          }
        />

        <ProfileListSection
          indexLabel="07. Dirección personal"
          title="Objetivos y cambios"
          subtitle="Lo que tú deseas construir en tu vida y en tus vínculos."
          items={profile.personalGoals}
          emptyText="Sin metas definidas todavía."
          placeholder="Añadir objetivo personal..."
          onAdd={(v) => updateArrayField('personalGoals', (prev) => [...prev, v])}
          onEdit={(idx, v) =>
            updateArrayField('personalGoals', (prev) => prev.map((it, i) => (i === idx ? v : it)))
          }
          onRemove={(idx) =>
            updateArrayField('personalGoals', (prev) => prev.filter((_, i) => i !== idx))
          }
        />

        <ProfileListSection
          indexLabel="08. Forma de conversar"
          title="Preferencias de trato"
          subtitle="Cómo prefieres ser escuchado, acompañado o cuestionado."
          items={profile.communicationPreferences}
          emptyText="Puedes definir cómo te sientes más cómodo al conversar."
          placeholder="Ej.: Prefiero preguntas directas pero suaves..."
          onAdd={(v) => updateArrayField('communicationPreferences', (prev) => [...prev, v])}
          onEdit={(idx, v) =>
            updateArrayField('communicationPreferences', (prev) =>
              prev.map((it, i) => (i === idx ? v : it))
            )
          }
          onRemove={(idx) =>
            updateArrayField('communicationPreferences', (prev) =>
              prev.filter((_, i) => i !== idx)
            )
          }
        />
      </div>
    </div>
  );
}
