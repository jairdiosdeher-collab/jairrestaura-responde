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
  provisionalHypothesis?: string;
}

type ThemeId =
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

type CrisisKind =
  | 'ideacion_suicida_o_plan'
  | 'autolesion_reciente'
  | 'violencia_o_abuso'
  | 'amenaza_a_terceros';

interface CrisisAssessment {
  detected: boolean;
  kind?: CrisisKind;
  level: 'none' | 'elevated' | 'urgent';
}

interface ThemeRule {
  id: ThemeId;
  label: string;
  emotion: string;
  need: string;
  style: string;
  /** Strong emotional/psychological words (score 2.0 each when not negated) */
  strongWords: string[];
  /** Supporting contextual words (score 1.0 each; cannot trigger a theme alone) */
  contextWords: string[];
  /** Multi-word phrases (score 3.5 each) */
  phrases: string[];
  /** Requires at least one emotional/relational tension signal when contextWords are neutral nouns (family/partner) */
  requiresTensionSignal?: boolean;
  recognition: string[];
  reflection: string;
  protectiveLens?: string;
  explorationQuestion: string;
  microInterventionId: string;
  libraryCategory: LocalLibraryResource['category'];
  profileHypothesisHint: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¡!¿?.,;:()[\]"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripFigurativeIdioms(normalized: string): string {
  const idioms = [
    /\bme muero de (risa|pena|verguenza|hambre|sueno|calor|frio|ganas|amor)\b/g,
    /\bmorirme de (risa|pena|verguenza|hambre|sueno)\b/g,
    /\b(este trabajo|el trafico|el estres|la espalda|el calor|la risa|la gripa) me (va a matar|esta matando|mata)\b/g,
    /\bme cortaron (el internet|la luz|el agua|el gas|el servicio|el telefono|la llamada)\b/g,
    /\bme corte (el pelo|el cabello|las unas|cocinando|con papel|con una hoja)\b/g,
    /\b(no me quiero matar|no quiero morir|no pienso hacerme dano|nunca me haria dano)\b/g,
  ];
  let cleaned = normalized;
  for (const pattern of idioms) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWord(normalized: string, word: string): boolean {
  const re = new RegExp(`(?:^|\\s)${escapeRegExp(word)}(?:$|\\s)`, 'i');
  return re.test(normalized);
}

function isNegatedWord(normalized: string, word: string): boolean {
  const re = new RegExp(
    `(?:^|\\s)(no|ni|sin|tampoco|nada de|cero|para nada)(?:\\s+\\w+){0,2}\\s+${escapeRegExp(word)}(?:$|\\s)`,
    'i'
  );
  return re.test(normalized);
}

function assessCrisisRisk(rawNormalized: string): CrisisAssessment {
  const cleaned = stripFigurativeIdioms(rawNormalized);

  const suicideOrPlanPatterns: RegExp[] = [
    /\b(suicid\w*|quitarme la vida|acabar con mi vida|matarme|quiero morirme|me quiero morir)\b/,
    /\b(no quiero vivir|ya no quiero seguir viviendo|no aguanto mas vivir|no vale la pena vivir)\b/,
    /\b(ojala no despertara|no quiero despertar|quiero desaparecer para siempre|irme de este mundo)\b/,
    /\b(estarian mejor sin mi|todos estarian mejor sin mi|soy un estorbo para todos|no le veo salida a nada)\b/,
    /\b(despedirme de todos|ya deje cartas|deje una carta de despedida|regalar mis cosas para irme)\b/,
    /\b(tengo pastillas para|junte pastillas|compre una soga|cuerda para colgarme|subirme al puente)\b/,
    /\b(tirarme del balcon|lanzarme del puente|tirarme al metro|tirarme a un carro|cortarme las venas)\b/,
    /\b(como quitarse la vida|metodos para morir|arma para hacerme dano)\b/,
  ];

  if (suicideOrPlanPatterns.some((rx) => rx.test(cleaned))) {
    return {
      detected: true,
      kind: 'ideacion_suicida_o_plan',
      level: 'urgent',
    };
  }

  const recentSelfHarmPatterns: RegExp[] = [
    /\b(me acabo de cortar|me corte los brazos|me corte las piernas|me estoy cortando)\b/,
    /\b(me hice cortes|me lastime a proposito|me queme a proposito|me autolesion\w*)\b/,
    /\b(ganas de cortarme|necesito hacerme dano|quiero hacerme dano|me golpee fuerte a proposito)\b/,
  ];

  if (recentSelfHarmPatterns.some((rx) => rx.test(cleaned))) {
    return {
      detected: true,
      kind: 'autolesion_reciente',
      level: 'urgent',
    };
  }

  const violenceOrAbusePatterns: RegExp[] = [
    /\b(me esta pegando|me estan golpeando|me pego hoy|me golpeo|me dio una paliza|me ahorco)\b/,
    /\b(me encerro y no|no me deja salir de la casa|me amenaza con|me quiere matar|amenaza de muerte)\b/,
    /\b(tengo miedo de volver a casa|peligro inmediato|violencia intrafamiliar|violencia domestica)\b/,
    /\b(abuso sexual|me toco sin mi permiso|me forzo sexualmente|me maltrata fisicamente)\b/,
    /\b(me persigue y tengo miedo|me esta esperando afuera para)\b/,
  ];

  if (violenceOrAbusePatterns.some((rx) => rx.test(cleaned))) {
    return {
      detected: true,
      kind: 'violencia_o_abuso',
      level: 'urgent',
    };
  }

  const harmToOthersPatterns: RegExp[] = [
    /\b(voy a matar a|quiero matar a|voy a hacerle dano a|voy a atacar a|voy a herir a)\b/,
    /\b(tengo un arma para|quiero hacerle dano fisico a alguien)\b/,
  ];

  if (harmToOthersPatterns.some((rx) => rx.test(cleaned))) {
    return {
      detected: true,
      kind: 'amenaza_a_terceros',
      level: 'urgent',
    };
  }

  return { detected: false, level: 'none' };
}

function buildCrisisResponse(kind: CrisisKind): LocalEngineResponse {
  const kindSpecificOpening: Record<CrisisKind, string> = {
    ideacion_suicida_o_plan:
      'Lo que estás compartiendo señala un dolor muy intenso y tu vida y seguridad importan por encima de todo en este momento.',
    autolesion_reciente:
      'Gracias por decirlo sin esconderlo. Si te lastimaste recientemente o sientes el impulso de hacerlo ahora, tu cuidado físico y emocional es la prioridad inmediata.',
    violencia_o_abuso:
      'Nadie merece vivir bajo golpes, encierro, abuso o amenazas. En este momento tu integridad física es lo primero.',
    amenaza_a_terceros:
      'Cuando aparece impulso o intención de herir a otra persona, es urgente detenerse, poner distancia física inmediata y pedir contención profesional.',
  };

  const directSafetyQuestions =
    kind === 'violencia_o_abuso'
      ? 'Necesito hacerte unas preguntas directas para priorizar tu resguardo: ¿estás en peligro en este preciso instante?, ¿la persona agresora está cerca de ti?, ¿tienes un lugar seguro adonde salir ahora mismo?'
      : 'Necesito preguntarte de forma directa y respetuosa: ¿estás en peligro inmediato en este momento?, ¿tienes intención activa, algún plan pensado o medios disponibles a tu alcance para hacerte daño o lastimar a alguien?';

  return {
    reply: [
      kindSpecificOpening[kind],
      directSafetyQuestions,
      'Pasos inmediatos recomendados:\n• Busca ahora mismo a una persona de confianza (familiar, amigo, vecino o compañero cercano) que pueda acompañarte físicamente y no te deje solo.\n• Aléjate o pide a alguien de confianza que retire cualquier objeto o medio con el que puedas lastimarte.\n• Acude de inmediato al servicio de urgencias médicas más cercano.\n• En Colombia, ante una emergencia inmediata llama gratuitamente a la línea 123 desde un teléfono con señal (o a la línea 155 si se trata de violencia contra la mujer).',
      'Importante: esta orientación es una medida preventiva de seguridad y no constituye una evaluación clínica definitiva. Además, al estar usando JAIRRESTAURA en modo sin conexión, la aplicación no puede llamar, enviar alertas ni contactar servicios de emergencia automáticamente.',
    ].join('\n\n'),
    analysis: {
      detectedEmotion: 'Señal prioritaria de riesgo o crisis aguda',
      underlyingNeed: 'Seguridad física inmediata, acompañamiento humano presencial y atención de urgencias',
      selectedStyle: 'Priorización inmediata de seguridad (Modo local)',
      safetyFlag: {
        level: 'urgent',
        guidance:
          'Busca acompañamiento físico de una persona de confianza y acude a urgencias. En Colombia llama al 123 ante emergencia inmediata. El modo sin conexión no puede contactar servicios de emergencia automáticamente.',
      },
    },
  };
}

const TENSION_SIGNALS = [
  'conflicto',
  'discusion',
  'discutimos',
  'pelea',
  'peleamos',
  'problema',
  'problemas',
  'tension',
  'distancia',
  'distanciamos',
  'herida',
  'dolor',
  'gritos',
  'silencio',
  'reproche',
  'celos',
  'miedo',
  'mal',
  'dificil',
  'desgaste',
  'agobia',
  'abruma',
  'triste',
  'culpa',
  'insiste',
  'invade',
  'controla',
  'critica',
  'rechaza',
];

const THEME_RULES: ThemeRule[] = [
  {
    id: 'enmascaramiento',
    label: 'Enmascaramiento social',
    emotion: 'Agotamiento por sostener una máscara o papel social',
    need: 'Sentir seguridad para mostrarte tal como eres sin temor a ser juzgado',
    style: 'Empático y reflexivo',
    strongWords: ['mascara', 'masking', 'fingir', 'aparentar', 'disimular'],
    contextWords: ['actuar', 'papel', 'imagen', 'ocultar', 'encajar', 'agotado'],
    phrases: [
      'por fuera parezco',
      'no puedo ser yo',
      'me pongo una coraza',
      'sostener una imagen',
      'sostener un papel',
      'fingir que estoy bien',
      'ocultar lo que siento',
      'mascara social',
    ],
    recognition: [
      'Sostener una apariencia constante para que nadie note tu cansancio o tus dudas consume muchísima energía.',
      'Es comprensible que termines exhausto cuando sientes que debes actuar un papel casi todo el día para pasar desapercibido o encajar.',
    ],
    reflection:
      'Muchas veces el enmascaramiento no es falsedad, sino una estrategia aprendida para protegerte de críticas, burlas o incomprensión. Aunque en algún momento te dio resguardo, hoy puede estar impidiéndote descansar en vínculos reales.',
    protectiveLens:
      'Ocultar lo que sientes pudo funcionar como escudo frente a la exposición o el juicio; observarlo con calma permite elegir en qué espacios seguros bajar un poco la guardia.',
    explorationQuestion:
      '¿Qué temes que pasaría si con una persona confiable dejaras de sostener esa apariencia de calma por unos minutos?',
    microInterventionId: 'observe-social-mask',
    libraryCategory: 'autenticidad',
    profileHypothesisHint:
      'Hipótesis por explorar: posible desgaste asociado a sostener una máscara social o rol constante en ciertos entornos.',
  },
  {
    id: 'complacencia',
    label: 'Complacencia excesiva',
    emotion: 'Tensión entre agradar a otros y atender tus propias necesidades',
    need: 'Confirmar que puedes ser querido y respetado sin anularte',
    style: 'Reflexivo y fortalecedor',
    strongWords: ['complacer', 'complacencia', 'agradar', 'sacrificarme'],
    contextWords: ['ceder', 'decepcionar', 'quedar bien', 'compromiso', 'aprobar', 'aprobacion'],
    phrases: [
      'digo que si a todo',
      'siempre cedo',
      'pienso primero en los demas',
      'miedo a decepcionar',
      'agradar a todo el mundo',
      'evitar conflictos',
      'no incomodar a nadie',
    ],
    recognition: [
      'Vivir pendiente de no incomodar ni decepcionar a nadie termina dejándote sin espacio ni voz propia.',
      'Se siente muy pesado cuidar la comodidad de todos mientras tus propios deseos quedan al final.',
    ],
    reflection:
      'Complacer suele funcionar como un puente rápido para evitar conflictos o asegurar pertenencia. Cuando se vuelve automático, cuesta distinguir lo que tú deseas de lo que los demás esperan de ti.',
    protectiveLens:
      'Decir que sí automáticamente pudo protegerte de discusiones o rechazo, aunque hoy genere cansancio o resentimiento silencioso.',
    explorationQuestion:
      'En la última situación donde cediste por compromiso, ¿qué estabas intentando evitar que ocurriera?',
    microInterventionId: 'unspoken-need',
    libraryCategory: 'autoestima',
    profileHypothesisHint:
      'Hipótesis por explorar: posible tendencia a complacer o postergar necesidades propias para preservar armonía.',
  },
  {
    id: 'miedo_rechazo',
    label: 'Miedo al rechazo',
    emotion: 'Inquietud ante la posibilidad de ser rechazado o excluido',
    need: 'Seguridad afectiva y aceptación sin exigencias imposibles',
    style: 'Empático y contenedor',
    strongWords: ['rechazo', 'rechacen', 'rechazado', 'abandono', 'abandonen', 'desaprobacion'],
    contextWords: ['alejen', 'excluido', 'excluida', 'juzguen', 'critiquen', 'encajar', 'miedo'],
    phrases: [
      'miedo a que se alejen',
      'que van a pensar',
      'no le caigo bien',
      'miedo al rechazo',
      'temor al rechazo',
      'siento que me rechazan',
      'me da miedo que me dejen',
    ],
    recognition: [
      'El temor a quedar fuera o a que alguien importante se aleje activa una alarma muy dolorosa y real.',
      'Cuando aparece el miedo al rechazo, hasta un silencio breve o un gesto neutro puede sentirse como amenaza.',
    ],
    reflection:
      'Tu mente intenta anticipar el rechazo para prepararse y no salir herida, pero a veces interpreta señales ambiguas como confirmación antes de revisar los hechos.',
    protectiveLens:
      'Estar atento a señales de desaprobación puede haber buscado prevenir una herida afectiva, aunque hoy eleve tu ansiedad.',
    explorationQuestion:
      '¿Qué diferencia habría entre lo que viste objetivamente y lo que temes que la otra persona esté pensando?',
    microInterventionId: 'facts-vs-interpretations',
    libraryCategory: 'ansiedad',
    profileHypothesisHint:
      'Hipótesis por explorar: posible sensibilidad alta frente a señales percibidas de rechazo o desaprobación.',
  },
  {
    id: 'limites',
    label: 'Necesidad de establecer límites',
    emotion: 'Incomodidad o culpa al intentar proteger tu tiempo y espacio',
    need: 'Respeto a tu energía, privacidad y ritmo personal',
    style: 'Práctico y fortalecedor',
    strongWords: ['limites', 'limite', 'invaden', 'abusan'],
    contextWords: ['espacio', 'tiempo', 'respeten', 'respeto', 'culpa', 'cuesta', 'no'],
    phrases: [
      'me cuesta decir no',
      'me cuesta decir que no',
      'no se poner limites',
      'poner limites',
      'establecer limites',
      'no respetan mi tiempo',
      'no respetan mi espacio',
      'se aprovechan de mi',
    ],
    recognition: [
      'Cuesta mucho poner un límite cuando aprendiste que decir "no" equivale a ser egoísta o provocar un conflicto.',
      'Notar que tu espacio o energía están siendo invadidos ya es una señal clara de cuidado personal.',
    ],
    reflection:
      'Establecer un límite no es atacar al otro ni romper el vínculo; es definir con serenidad hasta dónde puedes dar sin desgastarte. Sentir incomodidad al practicarlo es parte normal del cambio.',
    protectiveLens:
      'Evitar los límites pudo sostener una paz superficial en otros momentos, pero hoy tiene un costo alto en tu bienestar.',
    explorationQuestion:
      '¿Cuál sería el límite más pequeño y manejable que podrías expresar esta semana con una frase breve?',
    microInterventionId: 'gradual-boundary',
    libraryCategory: 'autoestima',
    profileHypothesisHint:
      'Hipótesis por explorar: posible dificultad para expresar límites claros sin culpa o exceso de explicaciones.',
  },
  {
    id: 'ansiedad',
    label: 'Ansiedad y preocupación',
    emotion: 'Inquietud anticipatoria y sobrecarga mental',
    need: 'Calma corporal, anclaje en el presente y claridad paso a paso',
    style: 'Contenedor y práctico',
    strongWords: ['ansiedad', 'ansioso', 'ansiosa', 'angustia', 'angustiado', 'panico', 'incertidumbre'],
    contextWords: ['nervioso', 'nerviosa', 'preocupacion', 'preocupado', 'preocupada', 'miedo', 'mente'],
    phrases: [
      'no dejo de pensar',
      'no puedo parar de pensar',
      'pecho apretado',
      'me falta el aire',
      'pienso lo peor',
      'la cabeza no me para',
      'ataque de ansiedad',
    ],
    recognition: [
      'Cuando la ansiedad se instala, el cuerpo y la mente actúan como si todo tuviera que resolverse en este mismo instante.',
      'Resulta agotador convivir con pensamientos que anticipan escenarios difíciles uno tras otro.',
    ],
    reflection:
      'No podemos asegurar desde aquí qué originó toda esta activación, pero sí podemos ayudar a tu cuerpo a bajar un punto la intensidad antes de intentar resolverlo todo.',
    protectiveLens:
      'Preocuparse intensamente suele ser un intento de la mente por anticipar y prevenir sorpresas dolorosas.',
    explorationQuestion:
      'De todo lo que ronda tu mente ahora, ¿qué parte depende de un paso pequeño hoy y qué parte está fuera de tu control inmediato?',
    microInterventionId: 'emotional-breathing',
    libraryCategory: 'ansiedad',
    profileHypothesisHint:
      'Hipótesis por explorar: posible patrón de preocupación anticipatoria o rumiación ante la incertidumbre.',
  },
  {
    id: 'hiperalerta',
    label: 'Hiperalerta',
    emotion: 'Tensión sostenida y dificultad para bajar la guardia',
    need: 'Sensación de seguridad y permiso para descansar',
    style: 'Contenedor y regulador',
    strongWords: ['hiperalerta', 'hipervigilante', 'vigilante', 'sobresalto'],
    contextWords: ['alerta', 'tenso', 'tensa', 'tension', 'relajarme', 'guardia', 'descansar'],
    phrases: [
      'no puedo relajarme',
      'siempre estoy alerta',
      'esperando lo peor',
      'no bajo la guardia',
      'pendiente de todo',
      'alerta todo el tiempo',
    ],
    recognition: [
      'Estar en guardia todo el tiempo deja el cuerpo exhausto incluso cuando aparentemente no ocurre nada urgente.',
      'Tu cuerpo parece seguir preparado para reaccionar rápido, como si descansar todavía no fuera del todo seguro.',
    ],
    reflection:
      'La hiperalerta suele cumplir una función de vigilancia cuando en algún momento fue necesario anticiparse a problemas. Soltarla no se logra exigiéndote relajarte, sino ofreciendo señales pequeñas de seguridad en el presente.',
    protectiveLens:
      'Permanecer vigilante pudo darte sensación de prevención frente a entornos impredecibles.',
    explorationQuestion:
      '¿En qué momento o lugar del día notas que tu cuerpo baja aunque sea un 10% esa vigilancia?',
    microInterventionId: 'emotional-breathing',
    libraryCategory: 'regulacion',
    profileHypothesisHint:
      'Hipótesis por explorar: estado frecuente de hiperalerta o dificultad para descansar sin vigilancia.',
  },
  {
    id: 'tristeza',
    label: 'Tristeza',
    emotion: 'Tristeza, desánimo o peso emocional',
    need: 'Escucha sin prisa por forzarte a estar alegre',
    style: 'Empático y contenedor',
    strongWords: ['triste', 'tristeza', 'llorar', 'llanto', 'desanimo', 'duelo', 'melancolia', 'decaido'],
    contextWords: ['vacio', 'dolor', 'ganas', 'animo', 'pesado', 'apagado'],
    phrases: [
      'sin ganas de nada',
      'ganas de llorar',
      'me siento vacio',
      'me siento vacia',
      'me duele el alma',
      'no tengo animo',
      'llevo dias llorando',
    ],
    recognition: [
      'Lo que describes suena pesado y doloroso. No tienes que apresurarte a ponerle buena cara ni justificar tu tristeza.',
      'Hay momentos en los que el desánimo pide simplemente espacio para ser escuchado con respeto.',
    ],
    reflection:
      'La tristeza no es una falla personal; suele acompañar una pérdida, un desgaste acumulado o algo valioso que te importaba mucho. Tratarte con suavidad hoy ayuda más que exigirte ánimo inmediato.',
    explorationQuestion:
      'Si esa tristeza pudiera resumir en una frase qué está doliendo o extrañando hoy, ¿qué diría?',
    microInterventionId: 'unspoken-need',
    libraryCategory: 'regulacion',
    profileHypothesisHint:
      'Hipótesis por explorar: vivencia de tristeza o desánimo que requiere espacio contenedor gradual.',
  },
  {
    id: 'soledad',
    label: 'Soledad',
    emotion: 'Sensación de aislamiento o desconexión afectiva',
    need: 'Sentir compañía genuina y comprensión sin actuar',
    style: 'Empático y exploratorio',
    strongWords: ['soledad', 'aislado', 'aislada', 'aislarme', 'incomprendido', 'incomprendida'],
    contextWords: ['solo', 'sola', 'desconectado', 'desconectada', 'acompanado', 'nadie'],
    phrases: [
      'nadie me entiende',
      'me siento solo',
      'me siento sola',
      'aunque este con gente',
      'no tengo con quien hablar',
      'me aislo de todos',
    ],
    recognition: [
      'Sentirte solo —incluso rodeado de otras personas— deja una sensación muy fría de invisibilidad.',
      'Duele sentir que nadie termina de conocer lo que realmente cargas por dentro.',
    ],
    reflection:
      'A veces el aislamiento funciona como refugio para no exponerse a incomprensión, pero con el tiempo termina reforzando la misma soledad que intentaba evitar.',
    protectiveLens:
      'Tomar distancia pudo resguardarte de conversaciones superficiales o decepciones, aunque hoy te prive de apoyo real.',
    explorationQuestion:
      '¿Qué te haría sentir acompañado de verdad: alguien que dé consejos o alguien que simplemente escuche sin juzgar?',
    microInterventionId: 'observe-social-mask',
    libraryCategory: 'relaciones',
    profileHypothesisHint:
      'Hipótesis por explorar: posible tendencia al aislamiento o sensación de desconexión en vínculos cercanos.',
  },
  {
    id: 'culpa',
    label: 'Culpa y autoreproche',
    emotion: 'Peso de culpa o vergüenza',
    need: 'Distinguir responsabilidad real de castigo excesivo',
    style: 'Compasivo y clarificador',
    strongWords: ['culpa', 'culpable', 'remordimiento', 'reprocho', 'verguenza'],
    contextWords: ['perdonarme', 'error', 'equivoque', 'arrepentido', 'fallar', 'falle'],
    phrases: [
      'todo es mi culpa',
      'debi haber hecho',
      'me siento culpable',
      'no me lo perdono',
      'fue mi culpa',
      'me reprocho mucho',
    ],
    recognition: [
      'Cargar con culpa constante desgasta profundamente y te deja atrapado mirando hacia atrás.',
      'Se nota cuánto te importa hacer lo correcto, al punto de volverte muy severo contigo mismo.',
    ],
    reflection:
      'Conviene distinguir entre una responsabilidad concreta que puede repararse y un autoreproche interminable que solo castiga. Cometer un error no anula tu dignidad como persona.',
    explorationQuestion:
      '¿Existe una acción concreta de reparación posible aquí, o estás cargando culpa por algo que no dependía solo de ti?',
    microInterventionId: 'facts-vs-interpretations',
    libraryCategory: 'autoestima',
    profileHypothesisHint:
      'Hipótesis por explorar: posible tendencia al autoreproche severo o culpa desproporcionada.',
  },
  {
    id: 'baja_autoestima',
    label: 'Baja autoestima y autocrítica',
    emotion: 'Desvalorización personal o dureza interna',
    need: 'Reconocer tu valor más allá del desempeño o la crítica',
    style: 'Fortalecedor y empático',
    strongWords: ['insuficiente', 'fracaso', 'inutil', 'autocritica', 'inferior'],
    contextWords: ['inseguro', 'insegura', 'comparo', 'valgo', 'capaz', 'critico', 'torpe'],
    phrases: [
      'no valgo nada',
      'no soy suficiente',
      'no sirvo para nada',
      'todo lo hago mal',
      'no soy capaz',
      'me siento un fracaso',
      'me comparo con todos',
    ],
    recognition: [
      'Escucharte hablar con tanta dureza de ti mismo duele, porque refleja el peso que llevas encima.',
      'Cuando la autocrítica toma el control, borra tus esfuerzos reales y convierte cualquier tropiezo en sentencia.',
    ],
    reflection:
      'Que hoy te sientas insuficiente no es un dato objetivo sobre tu valor humano; suele ser el eco de exigencias muy altas o comparaciones injustas. Tu valía no depende de ser impecable.',
    explorationQuestion:
      'Si alguien a quien aprecias estuviera atravesando exactamente esto, ¿qué le dirías con honestidad y respeto?',
    microInterventionId: 'non-approval-strengths',
    libraryCategory: 'autoestima',
    profileHypothesisHint:
      'Hipótesis por explorar: autocrítica exigente o duda frecuente sobre el propio valor personal.',
  },
  {
    id: 'agotamiento_emocional',
    label: 'Agotamiento emocional',
    emotion: 'Saturación física y emocional',
    need: 'Descanso real, reducción de exigencias y pausa',
    style: 'Breve, cálido y contenedor',
    strongWords: ['agotado', 'agotada', 'agotamiento', 'saturado', 'saturada', 'quemado', 'exhausto', 'sobrecarga'],
    contextWords: ['cansado', 'cansada', 'cansancio', 'energia', 'fuerzas', 'descansar'],
    phrases: [
      'no doy mas',
      'estoy saturado',
      'estoy saturada',
      'no tengo energia',
      'todo me pesa',
      'agotamiento emocional',
      'estoy fundido',
    ],
    recognition: [
      'Cuando estás emocionalmente saturado, hasta las decisiones cotidianas parecen una montaña.',
      'Tu cansancio no es pereza: es la señal honesta de que llevas tiempo sosteniendo más de la cuenta.',
    ],
    reflection:
      'En momentos de saturación, no necesitas más exigencias ni análisis extensos; necesitas simplificar el día, reducir estímulos y permitirte parar sin culpa.',
    explorationQuestion:
      '¿Qué única tarea no urgente podrías soltar o posponer hoy para regalarte una hora de respiro?',
    microInterventionId: 'emotional-breathing',
    libraryCategory: 'regulacion',
    profileHypothesisHint:
      'Hipótesis por explorar: posible saturación por sostener demandas continuas sin pausas suficientes.',
  },
  {
    id: 'conflictos_familiares',
    label: 'Conflictos familiares',
    emotion: 'Desgaste o tensión en vínculos familiares',
    need: 'Claridad de límites y resguardo emocional dentro de la familia',
    style: 'Reflexivo y respetuoso',
    strongWords: ['intrafamiliar'],
    contextWords: ['familia', 'familiar', 'mama', 'papa', 'madre', 'padre', 'hermano', 'hermana', 'hijos', 'casa', 'hogar'],
    phrases: [
      'problemas en mi familia',
      'discusion familiar',
      'pelea en casa',
      'ambiente tenso en casa',
      'conflicto con mis padres',
      'mi mama me critica',
      'mi papa me exige',
      'discuto mucho con mi familia',
    ],
    requiresTensionSignal: true,
    recognition: [
      'Las tensiones familiares tocan fibras profundas porque suelen mezclar afecto, historia y expectativas difíciles.',
      'Es comprensible sentir desgaste cuando en casa se repiten discusiones, reproches o silencios tensos.',
    ],
    reflection:
      'En la familia muchas veces reaccionamos desde roles antiguos sin notarlo. Cambiar tu forma de responder —hacer una pausa o expresar un límite breve— protege tu paz aunque los demás no cambien de inmediato.',
    explorationQuestion:
      'En esas interacciones familiares, ¿qué papel sientes que esperan que cumplas y qué te cuesta más sostener?',
    microInterventionId: 'gradual-boundary',
    libraryCategory: 'relaciones',
    profileHypothesisHint:
      'Hipótesis por explorar: desgaste o tensión recurrente en dinámicas familiares.',
  },
  {
    id: 'dificultades_pareja',
    label: 'Dificultades de pareja',
    emotion: 'Incertidumbre, herida o desgaste en la relación de pareja',
    need: 'Escucha mutua, claridad afectiva y seguridad relacional',
    style: 'Reflexivo y exploratorio',
    strongWords: ['celos', 'infidelidad'],
    contextWords: ['pareja', 'novio', 'novia', 'esposo', 'esposa', 'matrimonio', 'relacion'],
    phrases: [
      'problemas con mi pareja',
      'discusion con mi pareja',
      'nos distanciamos mucho',
      'discutimos todo el tiempo',
      'mi pareja me ignora',
      'dudas en mi relacion',
      'crisis de pareja',
    ],
    requiresTensionSignal: true,
    recognition: [
      'Cuando una relación importante atraviesa distancia o conflicto, es natural sentir mezcla de dolor, duda y cansancio.',
      'Intentar cuidar el vínculo sin saber cómo dialogar sin herirse genera mucha tensión.',
    ],
    reflection:
      'En pareja suelen chocar no solo opiniones, sino miedos y necesidades afectivas distintas. Hablar desde lo que tú sientes ayuda a abrir diálogo sin entrar en ataque o defensa.',
    explorationQuestion:
      '¿Qué es lo que más deseas cuidar hoy: expresar algo que callaste o entender qué está ocurriendo entre ambos?',
    microInterventionId: 'unspoken-need',
    libraryCategory: 'relaciones',
    profileHypothesisHint:
      'Hipótesis por explorar: posible desgaste o incertidumbre en la relación de pareja.',
  },
];

function detectExplicitPastoralRequest(normalized: string): boolean {
  // Casual Colombian idioms ("ay Dios", "por Dios", "gracias a Dios", "si Dios quiere") must NOT trigger pastoral integration.
  const explicitRequests = [
    /\b(perspectiva cristiana|enfoque cristiano|enfoque pastoral|acompanamiento pastoral)\b/,
    /\b(desde la biblia|desde mi fe|texto biblico|versiculo|palabra de dios)\b/,
    /\b(consejo espiritual|hablame de dios|que dice la biblia|orar por esto|como cristiano)\b/,
  ];
  return explicitRequests.some((rx) => rx.test(normalized));
}

function detectUserCorrection(normalized: string, explicitCorrectionNote?: string): boolean {
  if (explicitCorrectionNote && explicitCorrectionNote.trim().length > 0) {
    return true;
  }
  const correctionPatterns = [
    /\b(eso no es asi|no me representa|te equivocas|no es cierto que yo)\b/,
    /\b(corrige eso|corregir esa|no es por miedo|no es lo que quise decir|malinterpretaste)\b/,
    /\b(quiero aclarar algo sobre mi perfil|actualiza mi perfil)\b/,
  ];
  return correctionPatterns.some((rx) => rx.test(normalized));
}

function scoreTheme(normalized: string, rule: ThemeRule): number {
  let score = 0;

  for (const phrase of rule.phrases) {
    if (normalized.includes(phrase)) {
      score += 3.5;
    }
  }

  for (const word of rule.strongWords) {
    if (hasWord(normalized, word) && !isNegatedWord(normalized, word)) {
      score += 2.2;
    }
  }

  let contextHits = 0;
  for (const word of rule.contextWords) {
    if (hasWord(normalized, word) && !isNegatedWord(normalized, word)) {
      contextHits += 1;
    }
  }
  score += Math.min(contextHits, 3) * 1.1;

  if (rule.requiresTensionSignal) {
    const hasTension =
      score >= 3.5 ||
      TENSION_SIGNALS.some((t) => hasWord(normalized, t) && !isNegatedWord(normalized, t));
    if (!hasTension) {
      return 0;
    }
  }

  return score;
}

function buildEpistemicProfilePersonalization(
  profile: PsychologicalProfile,
  detectedTheme: ThemeId
): string | null {
  const parts: string[] = [];

  const factsText = profile.affirmedFacts.join(' ').toLowerCase();
  const patternsText = profile.observedPatterns.join(' ').toLowerCase();
  const hypothesesText = profile.explorableHypotheses.join(' ').toLowerCase();

  // 1. Confirmed facts vs Observed patterns vs Provisional hypotheses (distinctly labeled)
  if (
    (detectedTheme === 'limites' || detectedTheme === 'complacencia') &&
    (patternsText.includes('complac') ||
      patternsText.includes('agradar') ||
      patternsText.includes('limite') ||
      factsText.includes('complac'))
  ) {
    parts.push(
      'A partir de lo que tú mismo has confirmado y de los patrones que hemos venido observando, cuidar la armonía o complacer aparece con fuerza; por eso decir "no" hoy puede sentirse incómodo, sin dejar de ser un paso sano.'
    );
  } else if (
    (detectedTheme === 'ansiedad' || detectedTheme === 'miedo_rechazo') &&
    (patternsText.includes('rechaz') ||
      patternsText.includes('aprobac') ||
      hypothesesText.includes('rechaz'))
  ) {
    parts.push(
      'Como hipótesis provisional que aún estamos explorando —no como un hecho definitivo—, la sensibilidad ante una posible desaprobación podría estar amplificando la inquietud en esta situación.'
    );
  } else if (
    detectedTheme === 'enmascaramiento' &&
    (patternsText.includes('mascara') ||
      factsText.includes('mascara') ||
      hypothesesText.includes('mascara'))
  ) {
    parts.push(
      'Según lo que ya has compartido sobre el cansancio de sostener un rol social, esto no habla de falta de voluntad, sino de desgaste acumulado.'
    );
  } else if (profile.affirmedFacts.length > 0) {
    parts.push(
      `Teniendo en cuenta un hecho que tú ya compartiste ("${profile.affirmedFacts[0]}"), vale mirar cómo se relaciona con lo que vives hoy sin sacar conclusiones apresuradas.`
    );
  } else if (profile.explorableHypotheses.length > 0) {
    parts.push(
      `Como hipótesis abierta para revisar contigo —y que puedes corregir si no aplica—: ${profile.explorableHypotheses[0]}.`
    );
  }

  // 2. Protective mechanisms
  if (profile.protectiveMechanisms.length > 0) {
    const mech = profile.protectiveMechanisms[0];
    parts.push(
      `Recuerda también la posible función protectora de tu estrategia ("${mech.behavior}"): pudo servir para "${mech.possibleFunction}", aunque hoy tenga un costo.`
    );
  }

  // 3. Strengths, values & personal goals
  if (profile.strengthsAndValues.length > 0 && profile.personalGoals.length > 0) {
    parts.push(
      `Cuentas con recursos reales en ti (${profile.strengthsAndValues[0]}) para avanzar hacia tu meta personal (${profile.personalGoals[0]}).`
    );
  } else if (profile.strengthsAndValues.length > 0) {
    parts.push(
      `No pierdas de vista una fortaleza tuya ya reconocida: ${profile.strengthsAndValues[0]}.`
    );
  } else if (profile.personalGoals.length > 0) {
    parts.push(
      `Ten presente el objetivo que tú mismo te propusiste: ${profile.personalGoals[0]}.`
    );
  }

  if (parts.length === 0) return null;
  return parts.join(' ');
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

function adaptStyleTag(ruleStyle: string, settings: AccompanimentSettings): string {
  const prefMap: Record<AccompanimentSettings['preferredStyle'], string> = {
    auto: ruleStyle,
    empatico_contenedor: 'Empático y contenedor',
    reflexivo: 'Reflexivo',
    confrontativo_compasivo: 'Confrontativo compasivo',
    practico: 'Práctico',
    exploratorio: 'Exploratorio',
    fortalecedor: 'Fortalecedor',
  };
  return `${prefMap[settings.preferredStyle] || ruleStyle} (Modo local)`;
}

export function generateLocalOfflineResponse(
  userMessage: string,
  history: ChatMessage[],
  profile: PsychologicalProfile,
  settings: AccompanimentSettings,
  profileCorrectionNote?: string
): LocalEngineResponse {
  const rawNormalized = normalizeText(userMessage);
  const seed = history.length + userMessage.length;

  // 1. Emergency crisis check first (never treat as clinical diagnosis)
  const crisis = assessCrisisRisk(rawNormalized);
  if (crisis.detected && crisis.kind) {
    return buildCrisisResponse(crisis.kind);
  }

  // 2. Respect user correction directly in conversation
  if (detectUserCorrection(rawNormalized, profileCorrectionNote)) {
    const cleanClarification = (profileCorrectionNote || userMessage).trim();
    return {
      reply: [
        'Gracias por corregirme con tanta claridad. Tu propia experiencia va primero que cualquier hipótesis, y valoro que me digas cuando una lectura no te representa.',
        `Tomo nota de lo que aclaras como un hecho tuyo: "${cleanClarification}". No doy por cierta la interpretación anterior y la dejamos abierta a tu criterio.`,
        'Si quieres, también puedes editar o borrar cualquier punto directamente en la pestaña Mi Perfil. ¿Cómo prefieres que abordemos lo que estás viviendo hoy desde esta aclaración?',
      ].join('\n\n'),
      analysis: {
        detectedEmotion: 'Necesidad de ser comprendido con precisión y respeto',
        underlyingNeed: 'Autonomía y fidelidad a tu propia experiencia',
        selectedStyle: 'Respetuoso y corregible (Modo local)',
        safetyFlag: { level: 'none', guidance: '' },
      },
      provisionalAffirmedFact: cleanClarification,
    };
  }

  // 3. Score matching themes with contextual dampening (no single neutral word triggers)
  const scored = THEME_RULES.map((rule) => ({
    rule,
    score: scoreTheme(rawNormalized, rule),
  })).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const pastoralActive =
    settings.pastoralIntegration === true || detectExplicitPastoralRequest(rawNormalized);

  // 4. Honest fallback when message is ambiguous or lacks sufficient emotional/contextual signal
  if (!best || best.score < 2.1) {
    const fallbackPool = LOCAL_PSYCHOLOGICAL_LIBRARY.filter(
      (r) => r.category === 'microintervenciones'
    );
    const suggestionRes = fallbackPool[seed % fallbackPool.length];
    return {
      reply: [
        'Gracias por escribir. Con lo que compartes hasta ahora no cuento con suficiente contexto para identificar qué emoción o situación específica estás atravesando en el modo sin conexión, y prefiero ser honesto antes que adivinar o etiquetar.',
        'Podemos seguir explorándolo sin internet de cualquiera de estas maneras:\n1) Cuéntame qué emoción sientes con más fuerza hoy (por ejemplo: ansiedad, tristeza, agotamiento, culpa o tensión con alguien).\n2) Descríbeme qué pasó concretamente antes de sentirte así.\n3) O prueba esta microintervención breve: "' +
          suggestionRes.title +
          '" — ' +
          suggestionRes.practice,
        '¿Por cuál de estas opciones quieres empezar?',
      ].join('\n\n'),
      analysis: {
        detectedEmotion: 'Contexto aún insuficiente para interpretar sin suposiciones',
        underlyingNeed: 'Escucha abierta y respetuosa de tu ritmo',
        selectedStyle: 'Exploratorio honesto (Modo local)',
        safetyFlag: { level: 'none', guidance: '' },
      },
    };
  }

  const rule = best.rule;
  const recognitionText = rule.recognition[seed % rule.recognition.length];
  const profileSnippet = buildEpistemicProfilePersonalization(profile, rule.id);
  const resources = pickLibraryResource(rule.libraryCategory, pastoralActive, seed);
  const template =
    MICRO_INTERVENTIONS.find((m) => m.id === rule.microInterventionId) ||
    MICRO_INTERVENTIONS[0];

  const isBrief = settings.languageDepth === 'breve';
  const isDeep = settings.languageDepth === 'profundo';
  const paragraphs: string[] = [recognitionText];

  if (!isBrief) {
    paragraphs.push(
      profileSnippet ? `${rule.reflection} ${profileSnippet}` : rule.reflection
    );
  } else if (profileSnippet) {
    paragraphs.push(profileSnippet);
  }

  if (isDeep && rule.protectiveLens) {
    paragraphs.push(`Lectura tentativa de protección: ${rule.protectiveLens}`);
  }

  paragraphs.push(
    `Microintervención sugerida (${resources.main.title}): ${resources.main.practice}`
  );
  paragraphs.push(`Para explorar con calma: ${rule.explorationQuestion}`);
  paragraphs.push(
    `Recurso de apoyo local: ${resources.main.summary} (${resources.main.categoryLabel}, disponible en Biblioteca). Si algo de esta lectura no te representa, dímelo para corregirlo.`
  );

  if (resources.pastoral) {
    paragraphs.push(
      `Acompañamiento pastoral opcional (${resources.pastoral.title}): ${resources.pastoral.summary} ${resources.pastoral.practice} (Recurso espiritual opcional que complementa, sin sustituir el cuidado psicológico).`
    );
  }

  return {
    reply: paragraphs.join('\n\n'),
    analysis: {
      detectedEmotion: rule.emotion,
      underlyingNeed: rule.need,
      selectedStyle: adaptStyleTag(rule.style, settings),
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
    provisionalHypothesis: rule.profileHypothesisHint,
  };
}
