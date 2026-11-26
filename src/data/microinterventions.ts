import type { MicroInterventionTemplate, PsychologicalProfile } from '../types/jairrestaura';

export const EMPTY_PROFILE: PsychologicalProfile = {
  affirmedFacts: [],
  observedPatterns: [],
  explorableHypotheses: [
    'Preferencias de ritmo y cercanía en el acompañamiento',
    'Qué situaciones cotidianas generan mayor desgaste o necesidad de protección',
  ],
  unknownAreas: [
    'Historia personal y vínculos significativos que aún no has compartido',
    'Fortalezas y recursos que te han sostenido en momentos difíciles',
    'Tus metas personales y lo que deseas transformar en esta etapa',
  ],
  protectiveMechanisms: [],
  strengthsAndValues: [],
  personalGoals: [],
  communicationPreferences: [],
  lastUpdatedAt: null,
};

export const MICRO_INTERVENTIONS: MicroInterventionTemplate[] = [
  {
    id: 'facts-vs-interpretations',
    title: 'Diferenciar hechos de interpretaciones',
    category: 'Claridad cognitiva y emocional',
    durationLabel: '5 min',
    description:
      'Cuando sentimos temor al rechazo o hiperalerta, la mente suele mezclar lo que ocurrió objetivamente con la historia que construimos para protegernos.',
    steps: [
      'Describe una situación reciente que te haya generado inquietud usando solo hechos observables (como si lo grabara una cámara).',
      'Escribe aparte qué interpretaste sobre ti o sobre las intenciones de la otra persona.',
      'Formula al menos una explicación alternativa más amable o realista que también sea posible.',
    ],
    reflectionPrompts: [
      '¿Qué ocurrió exactamente (hechos)?',
      '¿Qué historia o temor apareció en mi mente (interpretación)?',
      '¿Qué otra lectura posible existe sin juzgarme?',
    ],
  },
  {
    id: 'observe-social-mask',
    title: 'Observar una máscara social sin juzgarte',
    category: 'Autenticidad y masking',
    durationLabel: '6 min',
    description:
      'El enmascaramiento social suele ser una estrategia aprendida para evitar conflictos o críticas. Antes de cambiarla, obsérvala con comprensión.',
    steps: [
      'Recuerda un momento reciente en el que sentiste que debías actuar, sonreír o agradar para estar seguro.',
      'Pregúntate qué temías que pasara si hubieras mostrado tu estado real.',
      'Identifica un espacio o una persona con quien puedas bajar un 10% esa exigencia esta semana.',
    ],
    reflectionPrompts: [
      '¿En qué momento noté que me puse una máscara?',
      '¿De qué intentaba protegerme esa estrategia?',
      '¿Qué pequeña expresión auténtica sería segura hoy?',
    ],
  },
  {
    id: 'unspoken-need',
    title: 'Reconocer qué necesito y no me atrevo a pedir',
    category: 'Necesidades afectivas',
    durationLabel: '5 min',
    description:
      'A menudo el malestar o el agotamiento esconden una necesidad legítima de descanso, escucha o claridad que aprendimos a callar.',
    steps: [
      'Detente un momento y pregúntate qué emoción ocupa más espacio en tu cuerpo hoy.',
      'Detrás de esa emoción, nombra una necesidad concreta (descanso, límite, compañía, espacio, sinceridad).',
      'Redacta en una frase sencilla cómo podrías pedirla o dártela sin justificarte en exceso.',
    ],
    reflectionPrompts: [
      '¿Qué siento con más fuerza en este momento?',
      '¿Qué necesito realmente detrás de esta emoción?',
      '¿Cómo sonaría pedirlo o cuidarlo con amabilidad?',
    ],
  },
  {
    id: 'gradual-boundary',
    title: 'Practicar un límite saludable y gradual',
    category: 'Autonomía y vínculos',
    durationLabel: '6 min',
    description:
      'Poner límites no requiere confrontaciones bruscas ni desaparecer. Puedes practicar decir no o posponer una respuesta conservando tu calma y dignidad.',
    steps: [
      'Elige una situación pequeña donde sueles decir sí por compromiso o temor a decepcionar.',
      'Escribe una respuesta breve, respetuosa y firme sin dar largas explicaciones.',
      'Observa qué incomodidad aparece al imaginar decirlo y recuerda que tolerar esa incomodidad es parte del aprendizaje.',
    ],
    reflectionPrompts: [
      '¿En qué situación pequeña quiero cuidar mi energía?',
      '¿Cuál sería mi frase breve de límite?',
      '¿Qué pensamiento aparece si imagino la posible reacción del otro?',
    ],
  },
  {
    id: 'emotional-breathing',
    title: 'Respiración y regulación emocional (4-4-6)',
    category: 'Regulación fisiológica',
    durationLabel: '3 min',
    description:
      'Cuando el sistema nervioso está en alerta, pensar con claridad se vuelve difícil. Regular el ritmo respiratorio abre espacio antes de decidir o responder.',
    steps: [
      'Siéntate con los pies apoyados en el suelo y suelta los hombros.',
      'Inhala suavemente por la nariz durante 4 segundos.',
      'Sostén el aire 4 segundos sin tensión y exhala lento por la boca durante 6 segundos.',
    ],
    reflectionPrompts: [
      '¿Cómo notas tu cuerpo y tu ritmo mental después de completar algunos ciclos?',
    ],
    isBreathingExercise: true,
  },
  {
    id: 'non-approval-strengths',
    title: 'Reconocer fortalezas sin aprobación externa',
    category: 'Autoestima sólida',
    durationLabel: '5 min',
    description:
      'Cuando el valor personal depende únicamente de la validación externa, cualquier silencio ajeno duele. Reconocer tus recursos internos devuelve estabilidad.',
    steps: [
      'Piensa en un momento difícil que hayas atravesado en los últimos meses.',
      'Identifica qué cualidad tuya te ayudó a sostenerte (sensibilidad, constancia, honestidad, prudencia, cuidado).',
      'Escríbelo como un hecho propio, sin compararte ni minimizarlo.',
    ],
    reflectionPrompts: [
      '¿Qué situación difícil logré transitar recientemente?',
      '¿Qué capacidad o valor personal estuvo presente ahí?',
    ],
  },
];

export const CONVERSATION_STARTERS = [
  {
    label: 'Agotamiento por agradar',
    prompt:
      'Siento que paso todo el día adaptándome a lo que los demás esperan de mí y al final del día termino completamente agotado, sin saber qué quiero yo.',
  },
  {
    label: 'Miedo al rechazo y límites',
    prompt:
      'Me cuesta mucho decir que no o expresar lo que realmente siento porque temo generar conflicto o que la otra persona se aleje.',
  },
  {
    label: 'Vivir detrás de una máscara',
    prompt:
      'Por fuera parezco tranquilo y funcional, pero siento que sostengo un papel constante para que nadie note mis dudas o mi vulnerabilidad.',
  },
  {
    label: 'Sobrecarga emocional',
    prompt:
      'Últimamente me siento saturado y me cuesta entender qué estoy sintiendo exactamente; solo noto cansancio y ganas de aislarme.',
  },
];
