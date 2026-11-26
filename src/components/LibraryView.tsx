import { useMemo, useState } from 'react';
import { Bookmark, Check, Search } from 'lucide-react';
import { LOCAL_PSYCHOLOGICAL_LIBRARY } from '../data/localLibrary';
import type {
  ExerciseProgressEntry,
  LibraryCategory,
  LocalLibraryResource,
} from '../types/jairrestaura';

interface LibraryViewProps {
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onLogPractice: (resource: LocalLibraryResource) => void;
  exerciseProgress: ExerciseProgressEntry[];
  pastoralIntegration: boolean;
}

type FilterOption = 'all' | 'favorites' | LibraryCategory;

const CATEGORY_TABS: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'Todos (90)' },
  { id: 'microintervenciones', label: 'Microintervenciones (30)' },
  { id: 'regulacion', label: 'Regulación (10)' },
  { id: 'autenticidad', label: 'Autenticidad y masking (10)' },
  { id: 'autoestima', label: 'Autoestima y límites (10)' },
  { id: 'ansiedad', label: 'Ansiedad (10)' },
  { id: 'relaciones', label: 'Relaciones (10)' },
  { id: 'pastoral', label: 'Pastoral opcional (10)' },
  { id: 'favorites', label: 'Guardados' },
];

export function LibraryView({
  favoriteIds,
  onToggleFavorite,
  onLogPractice,
  exerciseProgress,
  pastoralIntegration,
}: LibraryViewProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const practicedIds = useMemo(
    () => new Set(exerciseProgress.map((p) => p.exerciseId)),
    [exerciseProgress]
  );

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LOCAL_PSYCHOLOGICAL_LIBRARY.filter((item) => {
      if (filter === 'favorites' && !favoriteIds.includes(item.id)) return false;
      if (filter !== 'all' && filter !== 'favorites' && item.category !== filter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.practice.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [filter, searchQuery, favoriteIds]);

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <header className="space-y-3 pb-6 border-b border-[#E2E6E4]">
        <div className="text-xs font-medium text-[#52605C]">
          Biblioteca psicológica local · Disponible 100% sin conexión
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#18201E] text-balance">
          Recursos breves para tu autonomía emocional
        </h1>
        <p className="text-sm sm:text-base text-[#3A4743] leading-relaxed max-w-[72ch]">
          Noventa recursos escritos en lenguaje cercano y seguro, almacenados dentro de la aplicación para que puedas consultarlos, guardarlos y practicarlos en cualquier momento, incluso sin señal de internet.
        </p>
      </header>

      {/* Search + Category Filter Controls */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#7A8783] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tema (límites, máscara, calma, culpa...)"
            aria-label="Buscar en la biblioteca local"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D4DBD8] focus:border-[#2E5A4C] rounded-lg focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Categorías de recursos">
          {CATEGORY_TABS.map((tab) => {
            const active = filter === tab.id;
            const suffix =
              tab.id === 'favorites' ? ` (${favoriteIds.length})` : '';
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#2E5A4C] text-white'
                    : 'bg-white border border-[#E2E6E4] text-[#3A4743] hover:border-[#B8C2BE]'
                }`}
              >
                {tab.label}
                {suffix}
              </button>
            );
          })}
        </div>

        {filter === 'pastoral' && !pastoralIntegration && (
          <p className="text-xs text-[#52605C]">
            Los recursos pastorales son completamente opcionales y respetan tu libertad de conciencia. Puedes activar o desactivar el enfoque cristiano evangélico en las preferencias laterales.
          </p>
        )}
      </div>

      {/* Resource grid */}
      {filteredResources.length === 0 ? (
        <div className="bg-white border border-[#E2E6E4] rounded-xl p-8 text-center space-y-2">
          <p className="text-sm font-medium text-[#18201E]">
            No encontramos recursos que coincidan con ese filtro.
          </p>
          <p className="text-xs text-[#52605C]">
            Prueba limpiando la búsqueda o seleccionando otra categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((item) => {
            const isFav = favoriteIds.includes(item.id);
            const isPracticed = practicedIds.has(item.id);
            const isExpanded = expandedId === item.id;

            return (
              <article
                key={item.id}
                className="bg-white border border-[#E2E6E4] rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs text-[#52605C] tabular-nums">
                      {item.categoryLabel} · {item.durationLabel}
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(item.id)}
                      aria-label={isFav ? 'Quitar de guardados' : 'Guardar recurso'}
                      className={`p-1.5 rounded-md transition-colors shrink-0 ${
                        isFav
                          ? 'text-[#2E5A4C] bg-[#F2F6F4]'
                          : 'text-[#7A8783] hover:text-[#18201E]'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <h2 className="text-base font-semibold text-[#18201E]">
                    {item.title}
                  </h2>
                  <p className="text-sm text-[#3A4743] leading-relaxed">
                    {item.summary}
                  </p>

                  {isExpanded && (
                    <div className="pt-3 mt-2 border-t border-[#EEF1EF] space-y-2.5 text-sm">
                      <div>
                        <span className="text-xs font-semibold text-[#2E5A4C] block mb-0.5">
                          Práctica sugerida
                        </span>
                        <p className="text-[#18201E] leading-relaxed">{item.practice}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#52605C] block mb-0.5">
                          Pregunta para observar
                        </span>
                        <p className="text-[#3A4743] leading-relaxed">
                          {item.reflectionQuestion}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="text-xs font-medium text-[#2E5A4C] hover:underline whitespace-nowrap"
                  >
                    {isExpanded ? 'Ocultar práctica' : 'Leer práctica'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onLogPractice(item)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isPracticed
                        ? 'bg-[#F2F6F4] text-[#2E5A4C] border border-[#C6D5CE]'
                        : 'bg-[#F6F7F6] text-[#18201E] border border-[#DCE1DF] hover:border-[#2E5A4C]'
                    }`}
                  >
                    {isPracticed && <Check className="w-3.5 h-3.5" />}
                    <span>{isPracticed ? 'Practicado' : 'Marcar practicado'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
