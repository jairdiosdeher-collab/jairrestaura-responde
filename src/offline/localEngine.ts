import { LOCAL_PSYCHOLOGICAL_LIBRARY } from '../data/localLibrary';
import { MICRO_INTERVENTIONS } from '../data/microinterventions';
import type {
  AccompanimentAnalysis,
  AccompanimentSettings,
  ChatMessage,
  LocalLibraryResource,
  MicroInterventionSuggestion,
  PsychologicalProfile,
} from '../types/jairrestaura';

export interface LocalEngineResponse {
  reply: string;
  analysis: AccompanimentAnalysis;
  suggestedMicroIntervention?: MicroInterventionSuggestion;
  provisionalAffirmedFact?: string;
  provisionalPattern?: string;
}

type ThemeId =
  | 'crisis_emergencia'
  | 'enmascaramiento'
  | 'complacencia'
  | 'miedo_rechazo'
  | 'limites'
  | 'ansiedad'
  | 'hiperalerta'
  | 'tristeza'
  | 'soledad'
  | 'culpa'
  | 'baja_autoestima'
  | 'agotamiento_emocional'
  | 'conflictos_familiares'
  | 'dificultades_pareja';

interface ThemeRule {
  id: ThemeId;
  label: string;
  emotion: string;
  need: string;
  style: string;
  keywords: string[];
  phrases: string[];
  recognition: string[];
  reflection: string;
  protectiveLens?: string;
  explorationQuestion: string;
  microInterventionId: string;
  libraryCategory: LocalLibraryResource['category'];
  profilePatternHint: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const CRISIS_PHRASES = [
  'quitarme la vida',
  'no quiero vivir',
  'me quiero morir',
  'quiero morirme',
  'matarme',
  'suicid',
  'autolesion',
  'cortarme',
  'hacerme dano',
  'acabar con todo',
  'me estan golpeando',
  'violencia en casa',
  'abuso sexual',
  'peligro inmediato',
  'me quiere matar',
  'amenaza de muerte',
];

const THEME_RULES: ThemeRule[] = [
  {
    id: 'enmascaramiento',
    label: 'Enmascaramiento social',
    emotion: 'Agotamiento por sostener una máscara o papel social',
    need: 'Sentir seguridad para mostrarte tal como eres sin temor a ser juzgado',
    style: 'Empático y reflexivo',
    keywords: ['mascara', 'masking', 'fingir', 'aparentar', 'actuar', 'papel', 'disimular', 'ocultar'],
    phrases: ['por fuera parezco', 'no puedo ser yo', 'me pongo una coraza', 'sostener una imagen'],
    recognition: [
      'Sostener una apariencia constante para que nadie note tu cansancio o tus dudas consume muchísima energía.',
      'Es comprensible que te sientas agotado cuando sientes que debes actuar un papel casi todo el día.',
    ],
    reflection:
      'Muchas veces el enmascaramiento no es falsedad, sino una estrategia que aprendiste para protegerte de críticas, burlas o incomprensión. Aunque en algún momento te dio seguridad, hoy puede estar alejándote de descansar en vínculos reales.',
    protectiveLens:
      'Es posible que ocultar lo que sientes haya servido para evitar exposición o rechazo; explorarlo con calma ayuda a dosificar en qué espacios seguros sí puedes bajar un poco la guardia.',
    explorationQuestion:
      '¿Qué temes que ocurriría si con una persona de confianza dejaras de actuar calma por unos minutos?',
    microInterventionId: 'observe-social-mask',
    libraryCategory: 'autenticidad',
    profilePatternHint: 'Desgaste al sostener una máscara social o rol en ciertos entornos',
  },
  {
    id: 'complacencia',
    label: 'Complacencia excesiva',
    emotion: 'Tensión entre agradar a otros y atender tus propias necesidades',
    need: 'Confirmar que puedes ser querido y respetado sin anularte',
    style: 'Reflexivo y fortalecedor',
    keywords: ['complacer', 'agradar', 'ceder', 'sacrificarme', 'decepcionar', 'quedar bien'],
    phrases: ['digo que si a todo', 'siempre cedo', 'pienso primero en los demas', 'miedo a decepcionar'],
    recognition: [
      'Vivir pendiente de no incomodar ni decepcionar a nadie termina dejándote sin espacio ni voz propia.',
      'Se siente muy pesado cargar con el bienestar de todos mientras tus propios deseos quedan al final.',
    ],
    reflection:
      'Complacer suele funcionar como un puente rápido para evitar conflictos o asegurar pertenencia. Sin embargo, cuando se vuelve automático, cuesta distinguir qué quieres tú realmente de lo que esperan los demás.',
    protectiveLens:
      'Decir que sí automáticamente pudo protegerte de discusiones o distancia afectiva, aunque hoy te deje vacío o resentido.',
    explorationQuestion:
      'En la última situación donde cediste por compromiso, ¿qué estabas intentando evitar que pasara?',
    microInterventionId: 'unspoken-need',
    libraryCategory: 'autoestima',
    profilePatternHint: 'Tendencia a complacer o postergar necesidades propias para evitar conflictos',
  },
  {
    id: 'miedo_rechazo',
    label: 'Miedo al rechazo',
    emotion: 'Inquietud ante la posibilidad de ser rechazado o abandonado',
    need: 'Seguridad afectiva y aceptación sin condiciones imposibles',
    style: 'Empático y contenedor',
    keywords: ['rechazo', 'rechacen', 'abandono', 'abandonen', 'alejen', 'desaprobacion', 'encajar', 'excluido'],
    phrases: ['miedo a que se alejen', 'que van a pensar', 'no le caigo bien', 'miedo al rechazo'],
    recognition: [
      'El temor a quedar fuera o a que alguien importante se aleje activa una alarma muy dolorosa y real.',
      'Cuando aparece el miedo al rechazo, cualquier silencio o gesto neutro puede sentirse como una amenaza.',
    ],
    reflection:
      'Tu mente intenta anticipar el rechazo para prepararse y no salir herida, pero muchas veces termina interpretando señales ambiguas como confirmación de abandono antes de verificar los hechos.',
    protectiveLens:
      'Vigilar señales de desaprobación puede haber buscado evitar una herida relacional, aunque hoy incremente tu ansiedad.',
    explorationQuestion:
      '¿Qué diferencia habría entre lo que viste objetivamente y lo que temes que la otra persona esté pensando?',
    microInterventionId: 'facts-vs-interpretations',
    libraryCategory: 'ansiedad',
    profilePatternHint: 'Sensibilidad alta frente a señales percibidas de rechazo o desaprobación',
  },
  {
    id: 'limites',
    label: 'Necesidad de establecer límites',
    emotion: 'Incomodidad o culpa al intentar proteger tu tiempo y espacio',
    need: 'Respeto a tu energía, privacidad y ritmo personal',
    style: 'Práctico y fortalecedor',
    keywords: ['limites', 'limite', 'invaden', 'respeten', 'espacio', 'decir no', 'abusan'],
    phrases: ['me cuesta decir no', 'no se poner limites', 'no respetan mi tiempo', 'decir que no'],
    recognition: [
      'Cuesta mucho poner un límite cuando aprendiste que decir "no" equivale a ser egoísta o provocar un problema.',
      'Notar que tu espacio o energía están siendo invadidos ya es una señal valiosa de autocuidado.',
    ],
    reflection:
      'Establecer un límite no es atacar al otro ni romper el vínculo; es definir con claridad hasta dónde puedes dar sin dañarte. Es normal sentir incomodidad al principio mientras practicas.',
    protectiveLens:
      'Evitar los límites pudo mantener la paz superficial en otros momentos, pero hoy cobra un costo alto en tu bienestar.',
    explorationQuestion:
      '¿Cuál sería el límite más pequeño y manejable que podrías expresar esta semana con una frase breve?',
    microInterventionId: 'gradual-boundary',
    libraryCategory: 'autoestima',
    profilePatternHint: 'Dificultad para expresar límites sin culpa o exceso de explicaciones',
  },
  {
    id: 'ansiedad',
    label: 'Ansiedad y preocupación',
    emotion: 'Inquietud anticipatoria y sobrecarga mental',
    need: 'Calma corporal, anclaje en el presente y claridad paso a paso',
    style: 'Contenedor y práctico',
    keywords: ['ansiedad', 'ansioso', 'angustia', 'nervioso', 'panico', 'preocupacion', 'preocupado', 'incertidumbre', 'miedo'],
    phrases: ['no dejo de pensar', 'pecho apretado', 'me falta el aire', 'pienso lo peor'],
    recognition: [
      'Cuando la ansiedad se instala, el cuerpo y la mente actúan como si todo tuviera que resolverse en este mismo segundo.',
      'Es agotador convivir con pensamientos que anticipan escenarios difíciles uno tras otro.',
    ],
    reflection:
      'No sabemos con certeza qué activó exactamente toda esta alerta hoy, pero sí podemos ayudar a tu sistema nervioso a bajar un punto la intensidad antes de intentar resolverlo todo.',
    protectiveLens:
      'Preocuparse intensamente suele ser un intento de la mente por prevenir sorpresas dolorosas.',
    explorationQuestion:
      'De todo lo que ronda tu mente ahora, ¿qué parte sí depende de un paso pequeño hoy y qué parte está fuera de tu control inmediato?',
    microInterventionId: 'emotional-breathing',
    libraryCategory: 'ansiedad',
    profilePatternHint: 'Preocupación anticipatoria o rumiación ante la incertidumbre',
  },
  {
    id: 'hiperalerta',
    label: 'Hiperalerta',
    emotion: 'Tensión sostenida y dificultad para bajar la guardia',
    need: 'Sensación de seguridad física y permiso para descansar',
    style: 'Contenedor y regulador',
    keywords: ['alerta', 'hiperalerta', 'vigilante', 'sobresalto', 'tenso', 'tension', 'relajarme'],
    phrases: ['no puedo relajarme', 'siempre estoy alerta', 'esperando lo peor', 'no bajo la guardia'],
    recognition: [
      'Estar en guardia todo el tiempo deja el cuerpo exhausto incluso en días donde aparentemente no pasa nada grave.',
      'Tu cuerpo parece seguir preparado para defenderse o reaccionar rápido, como si descansar no fuera seguro todavía.',
    ],
    reflection:
      'La hiperalerta suele cumplir una función de vigilancia cuando en algún momento necesitaste anticiparte a problemas. Soltarla no se logra exigiéndote "relájate", sino dándole señales pequeñas de seguridad al presente.',
    protectiveLens:
      'Permanecer vigilante pudo ofrecerte sensación de control o prevención frente a entornos impredecibles.',
    explorationQuestion:
      '¿En qué momento del día notas que tu cuerpo baja aunque sea un 10% esa vigilancia?',
    microInterventionId: 'emotional-breathing',
    libraryCategory: 'regulacion',
    profilePatternHint: 'Estado de hiperalerta o dificultad para descansar sin vigilancia',
  },
  {
    id: 'tristeza',
    label: 'Tristeza',
    emotion: 'Tristeza, desánimo o peso emocional',
    need: 'Escucha sin prisa por forzarte a estar alegre',
    style: 'Empático y contenedor',
    keywords: ['triste', 'tristeza', 'llorar', 'llanto', 'vacio', 'desanimo', 'duelo', 'dolor', 'melancolia'],
    phrases: ['sin ganas de nada', 'ganas de llorar', 'me siento vacio', 'me duele el alma'],
    recognition: [
      'Lo que describes suena pesado y doloroso. No tienes que apresurarte a ponerle buena cara ni justificar tu tristeza.',
      'Hay momentos en los que el desánimo pide simplemente espacio para ser reconocido con respeto.',
    ],
    reflection:
      'La tristeza no es una falla personal; suele señalar una pérdida, un cansancio acumulado o algo importante que te importaba mucho. Acompañarte con suavidad hoy es más útil que exigirte ánimo inmediato.',
    explorationQuestion:
      'Si esa tristeza pudiera expresar en una sola frase qué está doliendo o extrañando hoy, ¿qué diría?',
    microInterventionId: 'unspoken-need',
    libraryCategory: 'regulacion',
    profilePatternHint: 'Vivencia de tristeza o desánimo que requiere contención gradual',
  },
  {
    id: 'soledad',
    label: 'Soledad',
    emotion: 'Sensación de aislamiento o desconexión afectiva',
    need: 'Sentir compañía genuina y ser comprendido sin actuar',
    style: 'Empático y exploratorio',
    keywords: ['solo', 'sola', 'soledad', 'aislado', 'aislarme', 'desconectado', 'incomprendido'],
    phrases: ['nadie me entiende', 'me siento solo', 'aunque este con gente', 'no tengo con quien'],
    recognition: [
      'Sentirte solo —incluso cuando estás rodeado de personas— deja una sensación muy fría de invisibilidad.',
      'Es muy duro sentir que nadie termina de conocer lo que realmente cargas por dentro.',
    ],
    reflection:
      'A veces el aislamiento aparece como refugio para no arriesgarse a ser incomprendido, pero con el tiempo termina alimentando la misma soledad que intentaba aliviar.',
    protectiveLens:
      'Tomar distancia pudo protegerte de decepciones o conversaciones superficiales, aunque hoy te prive de apoyo real.',
    explorationQuestion:
      '¿Qué te haría sentir acompañado de verdad: alguien que dé consejos o alguien que simplemente escuche sin juzgar?',
    microInterventionId: 'observe-social-mask',
    libraryCategory: 'relaciones',
    profilePatternHint: 'Aislamiento o sensación de no ser comprendido en vínculos cercanos',
  },
  {
    id: 'culpa',
    label: 'Culpa y autoreproche',
    emotion: 'Peso de culpa o vergüenza',
    need: 'Distinguir responsabilidad real de castigo excesivo',
    style: 'Compasivo y clarificador',
    keywords: ['culpa', 'culpable', 'remordimiento', 'reprocho', 'verguenza', 'perdonarme'],
    phrases: ['todo es mi culpa', 'debi haber', 'me siento culpable', 'no me perdono'],
    recognition: [
      'Cargar con culpa constante desgasta profundamente y te deja atrapado mirando hacia atrás.',
      'Se nota cuánto te importa hacer lo correcto, al punto de volverte muy duro contigo mismo.',
    ],
    reflection:
      'Vale la pena distinguir entre una responsabilidad concreta que sí puede repararse y un autoreproche interminable que solo te castiga. Errar en algo no borra tu dignidad como persona.',
    explorationQuestion:
      '¿Hay una acción concreta de reparación posible aquí, o estás cargando culpa por algo que no dependía solo de ti?',
    microInterventionId: 'facts-vs-interpretations',
    libraryCategory: 'autoestima',
    profilePatternHint: 'Tendencia al autoreproche o culpa intensa',
  },
  {
    id: 'baja_autoestima',
    label: 'Baja autoestima y autocrítica',
    emotion: 'Desvalorización personal o dureza interna',
    need: 'Reconocer tu valor más allá del desempeño o la crítica',
    style: 'Fortalecedor y empático',
    keywords: ['insuficiente', 'fracaso', 'inutil', 'inseguro', 'comparo', 'autocritica', 'inferior'],
    phrases: ['no valgo', 'no soy suficiente', 'no sirvo para', 'todo lo hago mal', 'no soy capaz'],
    recognition: [
      'Escucharte hablar con tanta dureza de ti mismo duele, porque refleja el peso que llevas encima.',
      'Cuando la autocrítica toma el micrófono, borra tus esfuerzos y convierte cualquier tropiezo en veredicto.',
    ],
    reflection:
      'Que hoy te sientas insuficiente no es una verdad objetiva sobre tu valor humano; suele ser el eco de exigencias muy altas o comparaciones injustas. Tu dignidad no depende de ser perfecto.',
    explorationQuestion:
      'Si alguien a quien quieres estuviera pasando exactamente por esto, ¿qué le dirías con honestidad y respeto?',
    microInterventionId: 'non-approval-strengths',
    libraryCategory: 'autoestima',
    profilePatternHint: 'Autocrítica severa o duda sobre el propio valor personal',
  },
  {
    id: 'agotamiento_emocional',
    label: 'Agotamiento emocional',
    emotion: 'Saturación física y emocional',
    need: 'Descanso real, reducción de exigencias y pausa',
    style: 'Breve, cálido y contenedor',
    keywords: ['agotado', 'agotamiento', 'saturado', 'quemado', 'cansado', 'cansancio', 'sobrecarga', 'exhausto'],
    phrases: ['no doy mas', 'estoy saturado', 'no tengo energia', 'todo me pesa'],
    recognition: [
      'Cuando estás emocionalmente saturado, hasta las decisiones pequeñas parecen una montaña.',
      'Tu cansancio no es pereza: es la señal honesta de que llevas demasiado tiempo sosteniendo más de la cuenta.',
    ],
    reflection:
      'En momentos de agotamiento, no necesitas más exigencias ni análisis largos; necesitas simplificar el día, bajar estímulos y permitirte parar sin culpa.',
    explorationQuestion:
      '¿Qué única cosa no urgente podrías soltar o posponer hoy para regalarte una hora de respiro?',
    microInterventionId: 'emotional-breathing',
    libraryCategory: 'regulacion',
    profilePatternHint: 'Saturación o agotamiento por sostener demandas continuas',
  },
  {
    id: 'conflictos_familiares',
    label: 'Conflictos familiares',
    emotion: 'Desgaste o tensión en vínculos familiares',
    need: 'Claridad de límites y resguardo emocional dentro de la familia',
    style: 'Reflexivo y respetuoso',
    keywords: ['familia', 'mama', 'papa', 'madre', 'padre', 'hermano', 'hermana', 'hijos', 'casa', 'hogar'],
    phrases: ['en mi familia', 'con mis padres', 'discusion familiar', 'ambiente en casa'],
    recognition: [
      'Las tensiones familiares tocan fibras muy profundas porque suelen mezclar afecto, historia y expectativas.',
      'Es comprensible sentirse atrapado cuando en casa se repiten discusiones o silencios tensos.',
    ],
    reflection:
      'En la familia a menudo reaccionamos desde roles antiguos sin darnos cuenta. Cambiar tu forma de responder —haciendo una pausa o poniendo un límite breve— puede proteger tu paz aunque los demás no cambien de inmediato.',
    explorationQuestion:
      'En esas situaciones familiares, ¿qué papel sientes que esperan que cumplas y qué te cuesta más sostener?',
    microInterventionId: 'gradual-boundary',
    libraryCategory: 'relaciones',
    profilePatternHint: 'Tensión o desgaste en dinámicas familiares',
  },
  {
    id: 'dificultades_pareja',
    label: 'Dificultades de pareja',
    emotion: 'Incertidumbre, herida o desgaste en la relación de pareja',
    need: 'Escucha mutua, claridad afectiva y seguridad relacional',
    style: 'Reflexivo y exploratorio',
    keywords: ['pareja', 'novio', 'novia', 'esposo', 'esposa', 'matrimonio', 'celos', 'relacion'],
    phrases: ['con mi pareja', 'mi relacion', 'nos distanciamos', 'discutimos mucho'],
    recognition: [
      'Cuando una relación importante atraviesa distancia o conflicto, es natural sentir mezcla de dolor, duda y desgaste.',
      'Intentar cuidar el vínculo sin saber cómo hablar sin herirse genera mucha tensión.',
    ],
    reflection:
      'En pareja suelen chocar no solo opiniones, sino miedos y necesidades afectivas distintas. Expresar lo que sientes en primera persona ayuda a abrir diálogo sin entrar en defensa.',
    explorationQuestion:
      '¿Qué es lo que más deseas cuidar hoy: expresar algo que callaste o comprender qué está pasando entre ambos?',
    microInterventionId: 'unspoken-need',
    libraryCategory: 'relaciones',
    profilePatternHint: 'Preocupación o tensión en relación de pareja',
  },
];

function detectCrisis(normalized: string): boolean {
  return CRISIS_PHRASES.some((phrase) => normalized.includes(phrase));
}

function buildProfileContextSnippet(
  profile: PsychologicalProfile,
  detectedTheme: ThemeId
): string | null {
  const allSignals = [
    ...profile.observedPatterns,
    ...profile.affirmedFacts,
    ...profile.protectiveMechanisms.map((m) => `${m.behavior} ${m.possibleFunction}`),
  ]
    .join(' ')
    .toLowerCase();

  if (
    (detectedTheme === 'limites' || detectedTheme === 'complacencia') &&
    (allSignals.includes('complac') || allSignals.includes('agradar') || allSignals.includes('conflicto'))
  ) {
    return 'En lo que has compartido anteriormente aparece esa tendencia a cuidar la armonía o complacer para evitar roces; por eso decir "no" hoy puede sentirse especialmente incómodo, aunque siga siendo un paso sano hacia tu autenticidad.';
  }

  if (
    (detectedTheme === 'ansiedad' || detectedTheme === 'miedo_rechazo') &&
    (allSignals.includes('rechaz') || allSignals.includes('aprobac') || allSignals.includes('alerta'))
  ) {
    return 'Considerando que en tu perfil aparece sensibilidad ante el rechazo o la desaprobación, tiene sentido que esta situación active tanta inquietud antes incluso de saber qué piensa la otra persona.';
  }

  if (
    detectedTheme === 'enmascaramiento' &&
    (allSignals.includes('mascara') || allSignals.includes('masking') || allSignals.includes('papel'))
  ) {
    return 'Esto conecta con lo que ya venías observando sobre el cansancio de sostener un rol social; no se trata de debilidad, sino del peso acumulado de actuar normalidad todo el tiempo.';
  }

  if (profile.strengthsAndValues.length > 0) {
    return `Recuerda que ya cuentas con recursos reales que has reconocido en ti, como: ${profile.strengthsAndValues[0]}.`;
  }

  if (profile.personalGoals.length > 0) {
    return `Ten presente el propósito que te has trazado: ${profile.personalGoals[0]}.`;
  }

  return null;
}

function pickLibraryResource(
  category: LocalLibraryResource['category'],
  pastoralEnabled: boolean,
  seed: number
): { main: LocalLibraryResource; pastoral?: LocalLibraryResource } {
  const pool = LOCAL_PSYCHOLOGICAL_LIBRARY.filter((r) => r.category === category);
  const chosen = pool.length > 0 ? pool[seed % pool.length] : LOCAL_PSYCHOLOGICAL_LIBRARY[0];

  if (!pastoralEnabled) {
    return { main: chosen };
  }
  const pastoralPool = LOCAL_PSYCHOLOGICAL_LIBRARY.filter((r) => r.category === 'pastoral');
  const pastoral = pastoralPool[seed % pastoralPool.length];
  return { main: chosen, pastoral };
}

export function generateLocalOfflineResponse(
  userMessage: string,
  history: ChatMessage[],
  profile: PsychologicalProfile,
  settings: AccompanimentSettings
): LocalEngineResponse {
  const normalized = normalizeText(userMessage);
  const seed = history.length + userMessage.length;

  // 1. Emergency crisis check first (Section 9)
  if (detectCrisis(normalized)) {
    return {
      reply: [
        'Lo que estás expresando es muy serio y tu seguridad física y emocional es lo primero en este momento.',
        'Por favor, no atravieses esto a solas. Busca ahora mismo a una persona de confianza cercana (familiar, amigo o vecino) y cuéntale directamente que estás pasando por un momento de riesgo.',
        'Si estás en peligro inmediato o sientes que puedes hacerte daño, acude de inmediato al servicio de urgencias más cercano. En Colombia, llama gratuitamente a la línea de emergencias 123 desde un teléfono con señal.',
        'Importante: estás usando JAIRRESTAURA en modo sin conexión. Sin internet, esta aplicación no puede contactar automáticamente servicios de emergencia ni verificar la disponibilidad de líneas de atención. Por favor, busca ayuda humana directa ahora.',
      ].join('\n\n'),
      analysis: {
        detectedEmotion: 'Angustia aguda o situación de riesgo inmediato',
        underlyingNeed: 'Seguridad física, contención humana directa y atención urgente',
        selectedStyle: 'Priorización inmediata de seguridad (Modo local)',
        safetyFlag: {
          level: 'urgent',
          guidance:
            'Busca a una persona de confianza y acude a urgencias. En Colombia marca el 123 desde un teléfono con señal. Sin internet, la app no puede contactar servicios de emergencia automáticamente.',
        },
      },
    };
  }

  // 2. Score matching themes
  const scored = THEME_RULES.map((rule) => {
    let score = 0;
    for (const phrase of rule.phrases) {
      if (normalized.includes(phrase)) score += 3;
    }
    for (const kw of rule.keywords) {
      if (normalized.includes(kw)) score += 1.5;
    }
    return { rule, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const pastoralRequestedInText =
    normalized.includes('dios') ||
    normalized.includes('orar') ||
    normalized.includes('oracion') ||
    normalized.includes('biblia') ||
    normalized.includes('fe ') ||
    normalized.includes('cristo') ||
    normalized.includes('pastoral');
  const pastoralActive = settings.pastoralIntegration || pastoralRequestedInText;

  // 3. Honest fallback when message cannot be reliably matched
  if (!best || best.score < 1.5) {
    const fallbackPool = LOCAL_PSYCHOLOGICAL_LIBRARY.filter(
      (r) => r.category === 'microintervenciones'
    );
    const suggestionRes = fallbackPool[seed % fallbackPool.length];
    return {
      reply: [
        'Gracias por compartir esto conmigo. Con estas pocas palabras todavía no logro identificar con claridad qué emoción o situación específica estás atravesando en el modo sin conexión, y prefiero ser honesto contigo antes que suponer algo equivocado.',
        'Si quieres seguir explorándolo ahora mismo sin internet, podemos tomar cualquiera de estos caminos:',
        '1) Cuéntame qué emoción pesa más en tu cuerpo hoy (por ejemplo: ansiedad, tristeza, agotamiento, culpa o tensión con alguien).\n2) Descríbeme brevemente qué situación concreta ocurrió antes de sentirte así.\n3) O si prefieres algo práctico ahora, puedes probar esta microintervención breve: "' +
          suggestionRes.title +
          '" — ' +
          suggestionRes.practice,
        '¿Por cuál de estas opciones te gustaría empezar?',
      ].join('\n\n'),
      analysis: {
        detectedEmotion: 'Experiencia aún por explorar con mayor contexto',
        underlyingNeed: 'Escucha abierta sin suposiciones precipitadas',
        selectedStyle: 'Exploratorio honesto (Modo local)',
        safetyFlag: { level: 'none', guidance: '' },
      },
    };
  }

  const rule = best.rule;
  const recognitionText = rule.recognition[seed % rule.recognition.length];
  const profileSnippet = buildProfileContextSnippet(profile, rule.id);
  const resources = pickLibraryResource(rule.libraryCategory, pastoralActive, seed);
  const template =
    MICRO_INTERVENTIONS.find((m) => m.id === rule.microInterventionId) ||
    MICRO_INTERVENTIONS[0];

  const isBrief = settings.languageDepth === 'breve';
  const paragraphs: string[] = [recognitionText];

  if (!isBrief) {
    paragraphs.push(
      profileSnippet ? `${rule.reflection} ${profileSnippet}` : rule.reflection
    );
  } else if (profileSnippet) {
    paragraphs.push(profileSnippet);
  }

  paragraphs.push(
    `Microintervención sugerida (${resources.main.title}): ${resources.main.practice}`
  );
  paragraphs.push(`Para seguir explorando: ${rule.explorationQuestion}`);
  paragraphs.push(
    `Recurso de apoyo local: ${resources.main.summary} (${resources.main.categoryLabel}, disponible en Biblioteca sin internet).`
  );

  if (resources.pastoral) {
    paragraphs.push(
      `Perspectiva pastoral opcional (${resources.pastoral.title}): ${resources.pastoral.summary} ${resources.pastoral.practice}`
    );
  }

  return {
    reply: paragraphs.join('\n\n'),
    analysis: {
      detectedEmotion: rule.emotion,
      underlyingNeed: rule.need,
      selectedStyle: `${rule.style} (Modo local)`,
      protectiveFunctionInsight: rule.protectiveLens,
      safetyFlag: { level: 'none', guidance: '' },
    },
    suggestedMicroIntervention: {
      id: template.id,
      title: template.title,
      category: template.category,
      prompt: template.description,
      steps: template.steps,
      durationLabel: template.durationLabel,
    },
    provisionalPattern: rule.profilePatternHint,
  };
}
