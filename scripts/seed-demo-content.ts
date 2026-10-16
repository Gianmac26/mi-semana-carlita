// scripts/seed-demo-content.ts
// Paso 2 de 2 del seed demo.
// Crea: tareas (8), eventos (3), mi_mundo_entries (8), global_resources (3),
//       family_rules (6, de EXAMPLE_RULES), wellness_resources (8).
// Prerrequisito: seed-demo-users.ts ya corrido (familia + profiles en DB)
//                y migración 005_wellness_resources.sql aplicada.
//
// Uso: npx tsx scripts/seed-demo-content.ts

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { getMondayOfWeek, formatWeekKey } from '../lib/utils';
import { EXAMPLE_RULES } from '../lib/contract';

// Carga .env.local sin dotenv
// NOTA: no maneja comillas con contenido interno. Suficiente para el demo.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m) (process.env[m[1]] as string | undefined) ??= m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supa = createClient(SUPA_URL, SUPA_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper: construye strings markdown sin saltos literales en el código fuente
const md = (...lines: string[]) => lines.join('\n');

const BASE = 'gian.marcal26@gmail.com';
const alias = (tag: string) => BASE.replace('@', `+${tag}@`);

const TASKS = [
  { slug: 'ir_al_colegio',    icon: '🏫', label: 'Ir al colegio',              time: '07:00', days: ['mon','tue','wed','thu','fri'],             skippable: false, sort_order: 0 },
  { slug: 'hacer_tarea',      icon: '📝', label: 'Hacer la tarea del colegio', time: '16:00', days: ['mon','tue','wed','thu'],                   skippable: false, sort_order: 1 },
  { slug: 'leer_20min',       icon: '📖', label: 'Leer 20 minutos',             time: '17:00', days: ['mon','tue','wed','thu','fri'],             skippable: false, sort_order: 2 },
  { slug: 'ordenar_cuarto',   icon: '🧹', label: 'Ordenar mi cuarto',           time: '18:00', days: ['mon','wed','fri'],                        skippable: false, sort_order: 3 },
  { slug: 'practicar_ingles', icon: '🗣️', label: 'Practicar inglés',            time: '17:30', days: ['mon','wed','fri'],                        skippable: true,  sort_order: 4 },
  { slug: 'ayudar_en_casa',   icon: '🏠', label: 'Ayudar en casa',              time: '10:00', days: ['sat'],                                    skippable: false, sort_order: 5 },
  { slug: 'deporte',          icon: '⚽', label: 'Hacer deporte',               time: '09:00', days: ['tue','thu','sat'],                        skippable: false, sort_order: 6 },
  { slug: 'dormir_temprano',  icon: '🌙', label: 'Apagar el celular y dormir',  time: '22:00', days: ['mon','tue','wed','thu','fri','sat','sun'], skippable: false, sort_order: 7 },
];

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const EVENTS = [
  { date: daysFromNow(3),  time: '18:00', label: 'Reunión de padres en el colegio' },
  { date: daysFromNow(10), time: '09:00', label: 'Excursión al museo de ciencias'   },
  { date: daysFromNow(30), time: '',      label: 'Vacaciones de verano'             },
];

const MI_MUNDO: { tag: string; key: string; value: string }[] = [
  { tag: 'hijo1.demo', key: 'favorito', value: 'Mi color favorito es el morado y me encanta la música pop' },
  { tag: 'hijo1.demo', key: 'sueno',    value: 'Quiero ser veterinaria cuando sea grande'                  },
  { tag: 'hijo1.demo', key: 'logro',    value: 'Aprendí a tocar la guitarra este año'                      },
  { tag: 'hijo1.demo', key: 'miedo',    value: 'Le tengo miedo a las arañas'                               },
  { tag: 'hijo2.demo', key: 'favorito', value: 'Me encantan los videojuegos y el fútbol'                   },
  { tag: 'hijo2.demo', key: 'sueno',    value: 'Quiero ser programador o astronauta'                       },
  { tag: 'hijo2.demo', key: 'logro',    value: 'Salí campeón del torneo de ajedrez del colegio'            },
  { tag: 'hijo2.demo', key: 'miedo',    value: 'Me dan miedo las tormentas eléctricas'                     },
];

const RESOURCES = [
  {
    slug:          'cuarto-y-animo',
    emoji:         '🧹',
    category:      'bienestar' as const,
    title:         'Tu cuarto y tu estado de ánimo',
    summary:       'El orden de tu espacio afecta cómo te sientes y cuánto rindes.',
    body_markdown: md(
      '## Tu cuarto y tu estado de ánimo',
      '',
      'Cuando tu cuarto está ordenado, tu mente también lo está. El desorden visual consume energía mental sin que te des cuenta.',
      '',
      '**Prueba esto:** dedica 10 minutos al día a ordenar antes de estudiar. Notarás la diferencia.'
    ),
  },
  {
    slug:          'estudiar-poco-poco',
    emoji:         '📖',
    category:      'estudio' as const,
    title:         'Por qué estudiar poco a poco funciona',
    summary:       'El cerebro retiene más con sesiones cortas y frecuentes que con una sola larga.',
    body_markdown: md(
      '## Por qué estudiar poco a poco funciona mejor',
      '',
      'Estudiar 30 minutos al día es más efectivo que 3 horas el día antes del examen. Esto se llama **práctica distribuida** y tiene respaldo científico.',
      '',
      '**Cómo aplicarlo:** divide el material en partes pequeñas y trabaja una cada día.'
    ),
  },
  {
    slug:          'el-poder-del-abrazo',
    emoji:         '🤗',
    category:      'valores' as const,
    title:         'El poder del abrazo familiar',
    summary:       'El contacto físico con tu familia reduce el estrés y fortalece los lazos.',
    body_markdown: md(
      '## El poder del abrazo familiar',
      '',
      'Un abrazo de 20 segundos libera oxitocina, la hormona del bienestar. No importa la edad: todos necesitamos sentir cercanía.',
      '',
      'Las familias que expresan afecto físico tienen hijos con mayor autoestima y menor ansiedad.'
    ),
  },
];

async function main() {
  // ── Lookup: obtiene familyId y userIds desde la DB ─────────────────────────

  console.log('\n── Lookup de datos del paso 1');

  const { data: fam, error: famErr } = await supa
    .from('families').select('id').eq('name', 'Familia Demo GlobalTec').single();
  if (famErr || !fam) {
    console.error('Familia demo no encontrada. ¿Corriste seed-demo-users.ts primero?');
    process.exit(1);
  }
  const familyId: string = fam.id;
  console.log(`  • familia: ${familyId}`);

  const { data: profileRows } = await supa
    .from('profiles').select('id, email, role').eq('family_id', familyId);
  if (!profileRows || profileRows.length === 0) {
    console.error('Profiles demo no encontrados. ¿Corriste seed-demo-users.ts primero?');
    process.exit(1);
  }

  const ids: Record<string, string> = {};
  for (const p of profileRows) {
    if (p.email === alias('padre.demo')) ids['padre.demo'] = p.id;
    if (p.email === alias('hijo1.demo')) ids['hijo1.demo'] = p.id;
    if (p.email === alias('hijo2.demo')) ids['hijo2.demo'] = p.id;
  }

  const { data: adminRow } = await supa
    .from('global_admins').select('id').eq('email', alias('admin.demo')).single();
  if (!adminRow) {
    console.error('global_admin demo no encontrado. ¿Corriste seed-demo-users.ts primero?');
    process.exit(1);
  }
  ids['admin.demo'] = adminRow.id;

  const missingIds = ['padre.demo','hijo1.demo','hijo2.demo','admin.demo'].filter(k => !ids[k]);
  if (missingIds.length > 0) {
    console.error(`IDs no encontrados: ${missingIds.join(', ')}. Verifica seed-demo-users.ts.`);
    process.exit(1);
  }
  console.log(`  • userIds: ${Object.keys(ids).join(', ')}`);

  // ── 1. tasks ────────────────────────────────────────────────────────────────

  console.log('\n── 1. tasks');
  for (const t of TASKS) {
    const { error } = await supa.from('tasks').upsert(
      { family_id: familyId, slug: t.slug, icon: t.icon, label: t.label,
        time: t.time, days: t.days, skippable: t.skippable, sort_order: t.sort_order, active: true },
      { onConflict: 'family_id,slug' }
    );
    if (error) throw new Error(`Upsert task ${t.slug}: ${error.message}`);
    console.log(`  • ${t.icon} ${t.label}`);
  }

  // ── 2. events ───────────────────────────────────────────────────────────────

  console.log('\n── 2. events');
  for (const ev of EVENTS) {
    const { data: existing } = await supa
      .from('events').select('id').eq('family_id', familyId).eq('label', ev.label);
    if (existing && existing.length > 0) {
      console.log(`  • ya existe: "${ev.label}"`);
      continue;
    }
    const { error } = await supa.from('events').insert({
      family_id:  familyId,
      date:       ev.date,
      time:       ev.time,
      label:      ev.label,
      created_by: ids['padre.demo'],
    });
    if (error) throw new Error(`Insert event "${ev.label}": ${error.message}`);
    console.log(`  • ${ev.date} — ${ev.label}`);
  }

  // ── 3. mi_mundo_entries ─────────────────────────────────────────────────────

  console.log('\n── 3. mi_mundo_entries');
  const currentWeekKey = formatWeekKey(getMondayOfWeek(new Date()));
  for (const e of MI_MUNDO) {
    const { error } = await supa.from('mi_mundo_entries').upsert(
      { family_id: familyId, author_id: ids[e.tag], key: e.key, value: e.value, week_key: currentWeekKey },
      { onConflict: 'family_id,author_id,key,week_key' }
    );
    if (error) throw new Error(`Upsert mi_mundo ${e.tag}.${e.key}: ${error.message}`);
    console.log(`  • ${e.tag} → ${e.key}`);
  }

  // ── 4. global_resources ─────────────────────────────────────────────────────

  console.log('\n── 4. global_resources');
  for (const r of RESOURCES) {
    const { error } = await supa.from('global_resources').upsert(
      { slug: r.slug, title: r.title, summary: r.summary, body_markdown: r.body_markdown,
        category: r.category, emoji: r.emoji, active: true,
        published_at: new Date().toISOString(), created_by: ids['admin.demo'] },
      { onConflict: 'slug' }
    );
    if (error) throw new Error(`Upsert resource ${r.slug}: ${error.message}`);
    console.log(`  • ${r.emoji} ${r.title}`);
  }

  // ── 5. family_rules ────────────────────────────────────────────────────────

  console.log('\n── 5. family_rules');

  // Desde la migración 013, family_rules solo se escribe vía la RPC create_family_contract, que
  // reemplaza las reglas y guarda el mismo rules_snapshot en una sola transacción. Este seed usa
  // service_role (salta RLS): si la familia ya tiene un contrato activo, escribir aquí dejaría las
  // Reglas de oro de Semana distintas a las del contrato. En ese caso se omite este paso.
  const { data: activeContract, error: contractError } = await supa
    .from('family_contracts').select('version')
    .eq('family_id', familyId).eq('active', true)
    .maybeSingle();
  if (contractError) throw new Error(`Leer contrato activo: ${contractError.message}`);

  if (activeContract) {
    console.log(`  (omitido: la familia tiene el contrato v${activeContract.version} activo; las reglas se editan desde el contrato)`);
  } else {
    // Mismas reglas que los chips "Ideas para empezar" del editor de contrato.
    const RULES = EXAMPLE_RULES.map((r, i) => ({ ...r, sort_order: i }));

    for (const r of RULES) {
      const { error } = await supa.from('family_rules').upsert(
        { family_id: familyId, emoji: r.emoji, text: r.text, sort_order: r.sort_order, active: true },
        { onConflict: 'family_id,sort_order' }
      );
      if (error) throw new Error(`Upsert family_rule "${r.text}": ${error.message}`);
      console.log(`  • ${r.emoji} ${r.text}`);
    }
  }

  // ── 6. wellness_resources ──────────────────────────────────────────────────

  console.log('\n── 6. wellness_resources');

  type HelplineRef = { label: string; tel?: string; url?: string; note?: string };
  type WellnessResource = {
    slug:          string;
    emoji:         string;
    category:      'crisis' | 'tca' | 'bullying' | 'violencia' | 'emociones' | 'valores';
    title:         string;
    summary:       string;
    body_markdown: string;
    action_steps:  string[];
    helpline_refs: HelplineRef[];
    sort_order:    number;
  };

  const WELLNESS: WellnessResource[] = [
    // ── CRISIS
    {
      slug:     'prevencion-suicidio-senales',
      emoji:    '🚨',
      category: 'crisis',
      title:    'Señales de alerta: prevención del suicidio',
      summary:  'Reconocer las señales puede salvar una vida.',
      body_markdown: md(
        '## Señales de alerta',
        'Prestar atención a cambios drásticos en una persona cercana puede marcar la diferencia. Algunas señales:',
        '',
        '- Hablar o escribir sobre la muerte, el suicidio o "desaparecer".',
        '- Sentimientos de desesperanza, sentirse una carga para otros.',
        '- Aislamiento repentino de amigos y familia.',
        '- Cambios drásticos en sueño, alimentación o higiene.',
        '- Regalar objetos personales como si se estuviera despidiendo.',
        '- Conductas de riesgo (cruzar sin mirar, consumir sustancias).',
        '',
        '## Cómo actuar',
        'No necesitas ser psicólogo. Solo estar presente.'
      ),
      action_steps: [
        'Habla claro y directo: "¿Estás pensando en hacerte daño?". Preguntar no incita.',
        'Permanece al lado. No dejes sola a la persona.',
        'Retira objetos peligrosos del alcance si puedes hacerlo sin confrontar.',
        'No minimices con "tienes que ser fuerte" o "otros están peor".',
        'Acompaña a la persona a un establecimiento de salud o llama a la Línea 113.',
        'No prometas guardar el secreto. La vida está primero.',
      ],
      helpline_refs: [
        { label: 'Línea 113, opción 5', tel: '113', note: 'Minsa, 24/7, gratuito' },
        { label: 'WhatsApp Minsa', url: 'https://wa.me/51955557000', note: 'Orientación en salud mental' },
      ],
      sort_order: 1,
    },

    // ── TCA
    {
      slug:     'trastornos-conducta-alimentaria',
      emoji:    '🍽️',
      category: 'tca',
      title:    'Trastornos de la conducta alimentaria',
      summary:  'No es un tema de fuerza de voluntad. Es salud mental.',
      body_markdown: md(
        '## ¿Qué son?',
        'Los TCA son trastornos mentales graves que afectan la relación con la comida, el cuerpo y el peso. No se curan con "querer comer más" o "dejar de comer".',
        '',
        '## Señales de alerta',
        '',
        '- Miedo intenso a subir de peso, incluso estando por debajo del peso saludable.',
        '- Control excesivo de calorías, pesar la comida, evitar comer en público.',
        '- Atracones (comer mucho en poco tiempo) seguidos de culpa o purgas (vómito, laxantes, ejercicio extremo).',
        '- Aislamiento en las comidas, excusas para no comer.',
        '- Obsesión con espejos, balanzas, o el tamaño del cuerpo.',
        '',
        'Si reconoces alguna, no estás sola. No estás solo.'
      ),
      action_steps: [
        'Habla con un adulto de confianza. No tienes que pasar por esto en silencio.',
        'Acude a la Línea 113, opción 5. La atención es gratuita y confidencial.',
        'Evita dietas restrictivas sin supervisión médica. Pueden empeorar el cuadro.',
        'El diagnóstico lo hace un profesional de salud mental, no un test de internet.',
      ],
      helpline_refs: [
        { label: 'Línea 113, opción 5', tel: '113', note: 'Minsa, orientación en TCA' },
      ],
      sort_order: 2,
    },

    // ── BULLYING
    {
      slug:     'bullying-que-hacer',
      emoji:    '🛡️',
      category: 'bullying',
      title:    'Qué hacer si sufres bullying',
      summary:  'No es tu culpa. Buscar ayuda es un acto de valentía.',
      body_markdown: md(
        '## ¿Qué es el bullying?',
        'Es violencia física, psicológica o sexual entre estudiantes, de forma repetida y con desequilibrio de poder. Incluye el ciberacoso.',
        '',
        '## Lo que NO funciona',
        '- Responder con violencia (escala el conflicto).',
        '- Callarlo (protege al agresor, no a ti).',
        '- Creer que "ya pasará" solo.'
      ),
      action_steps: [
        'No respondas con violencia. No es cobardía, es estrategia.',
        'Guarda pruebas: capturas de pantalla, mensajes, testigos. Anota fechas.',
        'Cuéntale a un adulto de confianza: tu mamá, papá, un profesor, el auxiliar.',
        'Reporta en SíseVe: línea (01) 615-5970 o WhatsApp 991 410 000.',
        'No te aísles. Estar con amigos reduce el impacto emocional.',
      ],
      helpline_refs: [
        { label: 'SíseVe (Minedu)', tel: '016155970', note: '(01) 615-5970 · Reporte gratuito y confidencial' },
        { label: 'WhatsApp SíseVe', url: 'https://wa.me/51991410000' },
        { label: 'Línea 113, opción 5', tel: '113', note: 'Apoyo psicológico' },
      ],
      sort_order: 3,
    },
    {
      slug:     'apoyar-amigo-bullying',
      emoji:    '🤝',
      category: 'bullying',
      title:    'Cómo apoyar a un amigo que sufre bullying',
      summary:  'Tu apoyo puede cambiar el día de alguien.',
      body_markdown: md(
        '## Lo que ayuda',
        '',
        '- Escuchar sin juzgar. No digas "¿por qué no te defiendes?".',
        '- No minimizar con "son cosas de chicos".',
        '- Preguntarle qué necesita, no asumir.',
        '- Acompañarlo a hablar con un adulto.',
        '- Incluirlo en actividades. La soledad amplifica el daño.',
        '',
        '## Lo que no ayuda',
        '',
        '- Prometer que no lo contarás si hay riesgo físico o emocional.',
        '- Enfrentar al agresor tú solo.',
        '- Contarlo a todo el mundo sin su permiso.'
      ),
      action_steps: [
        'Pregúntale cómo se siente, sin apurar la respuesta.',
        'Ofrécele acompañarlo a hablar con un adulto de confianza.',
        'Si hay riesgo físico, cuenta a un adulto aunque él no quiera. Su vida está primero.',
      ],
      helpline_refs: [
        { label: 'Línea 113, opción 5', tel: '113', note: 'Orientación para amigos y familia' },
      ],
      sort_order: 4,
    },

    // ── VIOLENCIA
    {
      slug:     'violencia-familiar',
      emoji:    '🏠',
      category: 'violencia',
      title:    'Violencia familiar: a dónde acudir',
      summary:  'Pedir ayuda no es traicionar a tu familia. Es protegerte.',
      body_markdown: md(
        '## Qué es violencia familiar',
        'No es solo golpes. También es:',
        '',
        '- **Psicológica:** insultos, humillaciones, amenazas, control.',
        '- **Sexual:** cualquier acto sexual sin consentimiento.',
        '- **Económica:** controlar el dinero, impedir trabajar o estudiar.',
        '- **Física:** empujones, golpes, cualquier agresión al cuerpo.',
        '',
        '## No es tu culpa',
        'Ninguna situación justifica la violencia. Ni tu comportamiento, ni tus notas, ni tu forma de ser.'
      ),
      action_steps: [
        'Busca un lugar seguro si estás en peligro inmediato.',
        'Llama a la Línea 100. Es gratuita, confidencial, 24/7, atiende en quechua y aimara.',
        'Usa el Chat 100 si no puedes hablar por teléfono: chat100.mimp.gob.pe',
        'Los Centros Emergencia Mujer (CEM) están en todas las provincias. Atención gratuita.',
        'Habla con un adulto de confianza: profesor, tío, vecino, orientador del colegio.',
      ],
      helpline_refs: [
        { label: 'Línea 100', tel: '100', note: 'MIMP, 24/7, gratuito, quechua y aimara' },
        { label: 'Chat 100', url: 'https://chat100.mimp.gob.pe' },
      ],
      sort_order: 5,
    },

    // ── EMOCIONES
    {
      slug:     'emocion-vs-sentimiento',
      emoji:    '💭',
      category: 'emociones',
      title:    'Emoción vs sentimiento: ¿cuál es la diferencia?',
      summary:  'Las emociones son la reacción. Los sentimientos son la historia que te cuentas.',
      body_markdown: md(
        '## Emociones',
        'Son reacciones básicas, automáticas y de corta duración. Las principales:',
        '',
        '- Alegría, tristeza, miedo, ira, sorpresa, asco.',
        '',
        'Aparecen en segundos y duran minutos.',
        '',
        '## Sentimientos',
        'Son interpretaciones más complejas que hacemos de esas emociones. Duran más tiempo y están mediados por nuestros pensamientos.',
        '',
        'Ejemplos: celos, nostalgia, amor, culpa, gratitud, envidia.',
        '',
        '## Cómo se conectan',
        'Algo pasa → sientes una emoción (miedo). Luego tu cabeza la interpreta → construyes un sentimiento (ansiedad, inseguridad).',
        '',
        'Reconocer la emoción antes del sentimiento te da poder para elegir cómo responder.'
      ),
      action_steps: [
        'Cuando sientas algo intenso, pregúntate: ¿qué emoción básica hay debajo?',
        'Nombra la emoción en voz alta. Nombrarla reduce su intensidad.',
        'Practica respiración 4-7-8 cuando la emoción te desborde: inhala 4, sostén 7, exhala 8.',
        'Escribe en un cuaderno qué emoción sentiste hoy y qué sentimiento construiste a partir de ella.',
      ],
      helpline_refs: [],
      sort_order: 6,
    },

    // ── VALORES
    {
      slug:     'valores-responsabilidad',
      emoji:    '⭐',
      category: 'valores',
      title:    'Responsabilidad, disciplina e iniciativa',
      summary:  'Tres valores que cambian cómo vives tu semana.',
      body_markdown: md(
        '## Responsabilidad',
        'Cumplir lo que te comprometes, asumiendo las consecuencias de tus actos. No es "hacer lo que otros quieren". Es "hacer lo que dijiste que harías".',
        '',
        'Ejemplo cotidiano: entregar una tarea el día acordado, aunque no te la revisen.',
        '',
        '## Disciplina',
        'La constancia diaria para lograr algo, incluso cuando no tienes ganas. No es rigidez. Es elegir el largo plazo sobre la comodidad de hoy.',
        '',
        'Ejemplo: practicar guitarra 20 minutos diarios aunque hoy no te apetezca.',
        '',
        '## Iniciativa',
        'Actuar sin que te lo pidan. Ver un problema y proponer una solución.',
        '',
        'Ejemplo: en lugar de esperar a que te asignen limpiar, haces lo que ves que falta.'
      ),
      action_steps: [
        'Elige un solo compromiso esta semana. Uno, no diez.',
        'Anota cada día si lo cumpliste. Marca la racha.',
        'Cuando falle un día, no abandones todo. Vuelve al siguiente.',
      ],
      helpline_refs: [],
      sort_order: 7,
    },
    {
      slug:     'trabajo-equipo-comunicacion',
      emoji:    '🤝',
      category: 'valores',
      title:    'Trabajo en equipo y comunicación',
      summary:  'Nadie logra grandes cosas solo.',
      body_markdown: md(
        '## Trabajo en equipo',
        'No es repartir tareas. Es escuchar las ideas de otros, ceder cuando alguien tiene mejor propuesta, y sumar en vez de competir.',
        '',
        'Ejemplo: en un trabajo grupal, en lugar de imponer tu idea, preguntas "¿qué piensan ustedes?".',
        '',
        '## Comunicación asertiva',
        'Decir lo que piensas sin agredir y sin callarte. Tres pasos:',
        '',
        '1. Describe el hecho sin juzgar: "Cuando llegas tarde...".',
        '2. Expresa cómo te afecta: "...me siento poco valorado."',
        '3. Pide concretamente: "¿Podrías avisarme si vas a llegar tarde?".'
      ),
      action_steps: [
        'En tu próximo trabajo grupal, pide la opinión de alguien que habla poco.',
        'Practica la asertividad: describe → expresa → pide. Sin culpar.',
        'Antes de responder con enojo, respira una vez y pregúntate: ¿qué quiero lograr con lo que voy a decir?',
      ],
      helpline_refs: [],
      sort_order: 8,
    },
  ];

  for (const w of WELLNESS) {
    const { error } = await supa.from('wellness_resources').upsert(
      { slug: w.slug, category: w.category, title: w.title, emoji: w.emoji,
        summary: w.summary, body_markdown: w.body_markdown,
        action_steps: w.action_steps, helpline_refs: w.helpline_refs,
        sort_order: w.sort_order, active: true },
      { onConflict: 'slug' }
    );
    if (error) throw new Error(`Upsert wellness_resource ${w.slug}: ${error.message}`);
    console.log(`  • ${w.emoji} [${w.category}] ${w.title}`);
  }

  console.log('\n✅ seed-demo-content.ts completado.');
  console.log('   Seed demo completo. Revisa scripts/seed-demo.credentials.txt para las credenciales.');
}

main().catch(err => {
  console.error('Error en el seed:', err);
  process.exit(1);
});
