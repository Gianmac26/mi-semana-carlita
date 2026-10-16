// scripts/wellness-articles.ts
// Artículos completos de Bienestar → "Para leer" (tabla global_resources).
// Fuente única para seed-wellness-articles.ts y seed-demo-content.ts.
// Adaptados de los antiguos ARTICLES de components/ArticlesTab.tsx para adolescentes de 13 a 17
// años (lenguaje neutro). body_markdown usa solo lo que soporta MarkdownLite (WellnessDetailSheet):
// "## heading", listas, "**negrita**" y párrafos separados por línea en blanco.

export type ArticleCategory = 'estudio' | 'bienestar' | 'valores' | 'otro';

export interface WellnessArticle {
  slug:          string;
  emoji:         string;
  category:      ArticleCategory;
  title:         string;
  summary:       string;
  body_markdown: string;
}

const md = (...lines: string[]) => lines.join('\n');

// Orden en "Para leer": WellnessTab ordena por published_at desc → el primero queda arriba.
export const ARTICLES: WellnessArticle[] = [
  {
    slug:     'cuarto-y-animo',
    emoji:    '🧹',
    category: 'bienestar',
    title:    'Tu cuarto y tu estado de ánimo: por qué ordenar sí importa',
    summary:  'El desorden cansa a tu cerebro sin que lo notes. Diez minutos al día cambian cómo te sientes.',
    body_markdown: md(
      '¿Alguna vez te has sentido con ansiedad o con la mente dispersa, y luego te das cuenta de que tu cuarto parece un campo de batalla? No es coincidencia.',
      '',
      '## 🧠 Tu cuarto le habla a tu cerebro',
      'Cuando tu habitación está desordenada, tu cerebro registra cada cosa fuera de lugar como una tarea pendiente. Eso significa que aunque estés viendo una serie o intentando estudiar, una parte de tu mente sigue procesando el caos que te rodea. El resultado: te cansas más rápido y te cuesta concentrarte.',
      '',
      '## ✨ Lo que pasa cuando ordenas',
      'Ordenar no es solo limpiar. Es una forma de decirte: **"Tengo el control de mi espacio."** Y esa sensación de control se convierte en calma. Muchas personas cuentan que después de ordenar se sienten más despejadas, menos estresadas y hasta con más ganas de estudiar o de hacer las cosas que les gustan.',
      '',
      '## 💡 Truco para no abrumarte',
      'No tienes que hacer todo de golpe. Prueba esto: pon un temporizador de 10 minutos y ordena solo lo que esté a la vista. Cama tendida, ropa en su lugar, escritorio despejado. Con 10 minutos es suficiente para notar la diferencia. Con el tiempo se vuelve un hábito y deja de costar tanto.',
      '',
      '**💜 La enseñanza:** un cuarto ordenado no es perfección — es una forma de cuidarte.'
    ),
  },
  {
    slug:     'dormir-bien',
    emoji:    '😴',
    category: 'bienestar',
    title:    'Por qué dormir bien es una de las mejores cosas que puedes hacer por ti',
    summary:  'Mientras duermes, tu cuerpo crece y tu cerebro guarda lo que aprendiste. En la adolescencia necesitas de 8 a 10 horas.',
    body_markdown: md(
      'Dormir no es "perder el tiempo". Es, literalmente, el momento en que tu cuerpo y tu cerebro se reparan, crecen y se preparan para el día siguiente. Y en la adolescencia esto importa más que en casi cualquier otra etapa de tu vida.',
      '',
      '## 🔬 ¿Qué pasa mientras duermes?',
      'El sueño no es un estado uniforme. Tu cuerpo pasa por ciclos de aproximadamente 90 minutos, y en cada uno ocurren cosas distintas. En las fases más profundas, el cerebro consolida lo que aprendiste durante el día: estudiar y luego dormir bien hace que recuerdes más que estudiar y pasar la noche en vela. En la fase REM (la de los sueños con imágenes), el cerebro procesa emociones, resuelve problemas y refuerza la creatividad.',
      '',
      '## 🌱 La hormona que te hace crecer — en serio',
      'Durante el sueño profundo, tu cuerpo libera la **hormona del crecimiento**. Esta hormona no solo hace que crezcas en estatura: también repara músculos, fortalece huesos, regula el metabolismo y mantiene tu piel sana. La mayor parte de la hormona del crecimiento del día se libera mientras duermes. Si te acuestas tarde, ese proceso se interrumpe.',
      '',
      '## 🧠 Lo que el mal sueño le hace a tu cerebro',
      'Dormir poco afecta la memoria, la concentración y el estado de ánimo. Una noche mal dormida puede hacer que te cueste el doble entender algo en clase, que te irrites con más facilidad y que sientas más ansiedad. Con el tiempo, dormir menos de lo necesario se asocia con peor rendimiento escolar, menos energía y mayor riesgo de depresión.',
      '',
      '## ⏰ ¿Cuánto necesitas a tu edad?',
      'La ciencia es clara: en la adolescencia se necesitan entre **8 y 10 horas** por noche. No es un capricho — es lo que tu cuerpo en desarrollo requiere para funcionar bien. Acostarte a las 10 pm y levantarte a las 6 am te da exactamente 8 horas. Cada hora que le robas a tu sueño viendo el celular, la pagas al día siguiente con tu energía, tu concentración y tu humor.',
      '',
      '**💜 La enseñanza:** dormir bien no es flojera — es inteligencia. Cada vez que respetas tu hora de dormir, te regalas más energía, mejor memoria y un cuerpo que crece sano. El celular puede esperar. Tu sueño no.'
    ),
  },
  {
    slug:     'repartir-tu-tiempo',
    emoji:    '⚖️',
    category: 'bienestar',
    title:    'El arte de repartir tu tiempo: estudios, actividades, amigos, familia y tú',
    summary:  'No se trata de hacerlo todo perfecto, sino de estar presente en cada cosa cuando le toca.',
    body_markdown: md(
      'Tienes mucho en tus manos: el cole, los estudios, tus actividades, tus amistades, ayudar en casa, y además tu lugar en la familia. A veces puede sentirse como demasiado. La clave no es hacer todo perfecto — es aprender a repartir tu tiempo con intención.',
      '',
      '## 📚 Los estudios: tu base',
      'El colegio no es lo más divertido del mundo, pero lo que aprendes ahora abre o cierra puertas más adelante. No necesitas tener las mejores notas de tu clase, pero sí necesitas cumplir: llegar con lo estudiado a los exámenes, entregar tus trabajos y mantener el ritmo. Cuando estudias con constancia, te queda tiempo libre de verdad — sin culpa y sin estrés de último momento.',
      '',
      '## 🎨 Tus actividades: más que un pasatiempo',
      'El deporte, la música, el arte o lo que sea que te apasione no es un extra — es parte de quién eres. Te da disciplina, expresión, conexión con tu cuerpo y una forma de procesar emociones que las palabras a veces no alcanzan. Cuidar ese espacio es cuidarte. Cuando practicas con compromiso, también estás aprendiendo a ser constante y a trabajar por algo que amas.',
      '',
      '## 🤝 Tus amistades: necesarias, no un lujo',
      'El tiempo con tus amigos y amigas no es tiempo perdido. Las amistades en la adolescencia te enseñan a confiar, a resolver conflictos, a escuchar y a que te escuchen. Lo que sí importa es que ese tiempo no se coma lo que tienes que hacer. Un plan con amigos cuando ya cumpliste tus responsabilidades se disfruta completamente distinto a uno cuando sabes que tienes algo pendiente.',
      '',
      '## 🏠 La familia: tu red más cercana',
      'Ser hijo o hija, hermano o hermana, nieto o nieta — cada rol tiene algo que darte y algo que pedirte. Ayudar en casa no es un castigo: es aprender a vivir con otros, a ser responsable de un espacio compartido y a mostrar que valoras lo que tu familia construye todos los días para que tengas lo que tienes. Una llamada a tus abuelos, un rato con tus tíos, estar presente en familia — esas cosas las vas a recordar mucho más que cualquier serie que hayas visto.',
      '',
      '## 🌸 Y tú: no te olvides de ti',
      'En medio de todo lo anterior, necesitas tiempo para ti. Para no hacer nada. Para pensar. Para escuchar música sin distracciones. Para descansar. Una persona que solo da y nunca recarga, se agota. Respetar tu descanso también es una responsabilidad.',
      '',
      '**💜 La enseñanza:** no se trata de hacerlo todo al mismo tiempo ni de cumplir cada rol a la perfección. Se trata de estar presente en cada cosa cuando le toca. Cuando estudias, estudia. Cuando estás en tu actividad, dale todo. Cuando estás con tu familia, estás con tu familia. Esa presencia es lo que convierte el tiempo en algo que vale la pena.'
    ),
  },
  {
    slug:     'estudiar-poco-poco',
    emoji:    '📖',
    category: 'estudio',
    title:    'Por qué estudiar poco a poco te hace ganar en los exámenes',
    summary:  'Repasar un poco cada día graba lo aprendido en la memoria a largo plazo. Estudiar todo la noche anterior, no.',
    body_markdown: md(
      'Hablemos claro: estudiar toda la noche antes del examen parece una solución, pero tu cerebro tiene otra opinión.',
      '',
      '## 😴 El problema de estudiar a último momento',
      'Cuando estudias todo de golpe, tu cerebro guarda la información en la memoria a corto plazo. Es como escribir en la arena: está ahí por unas horas, pero se borra rápido. Al día siguiente del examen, ¿qué queda? Poco. Y encima llegas con sueño, lo que hace que tu mente no funcione al 100%.',
      '',
      '## 🔁 Por qué funciona estudiar todos los días',
      'Cuando repasas un tema varias veces a lo largo de los días, tu cerebro lo mueve a la memoria a largo plazo. Es como grabar en roca en lugar de arena. Esto se llama **repetición espaciada**, y es una de las técnicas de estudio con más respaldo científico.',
      '',
      '## 🎯 Cómo hacerlo sin que se sienta pesado',
      'No tienes que estudiar horas. Con 30 a 45 minutos diarios enfocados — sin celular, sin series de fondo — es más que suficiente para que el material se quede. Cuando llegue el examen, no estarás repasando desde cero. Solo estarás refrescando lo que ya sabes. Esa diferencia se nota en la nota.',
      '',
      '**💜 La enseñanza:** cada vez que estudias hoy, te regalas tranquilidad para el día del examen. 🌟'
    ),
  },
  {
    slug:     'vivir-tu-edad',
    emoji:    '🌻',
    category: 'valores',
    title:    'Vivir tu edad: por qué cada etapa tiene su momento',
    summary:  'Cada etapa tiene cosas que le pertenecen. No hay apuro por adelantar el capítulo.',
    body_markdown: md(
      'Hay una frase que parece simple pero que vale mucho: **"Cada cosa a su tiempo."** La vida está hecha de etapas, y cada una tiene cosas que le pertenecen. Saltarse alguna — aunque a veces parezca tentador — casi siempre trae problemas para los que todavía no tenías herramientas.',
      '',
      '## 🧩 ¿Qué significa vivir tu edad?',
      'En la adolescencia hay cosas que te corresponden: aprender, equivocarte sin que las consecuencias sean demasiado grandes, descubrir qué te gusta, construir amistades, hacer lo que te apasiona, reír, preocuparte por cosas de tu edad. Eso no es poco. Es, de hecho, muchísimo. El problema aparece cuando se mezclan preocupaciones o situaciones que le pertenecen a otra etapa — una más adulta — y para la que todavía no tienes las herramientas emocionales ni la experiencia para manejarla bien.',
      '',
      '## ⚠️ Lo que pasa cuando uno se adelanta',
      'No se trata de que no puedas hacer ciertas cosas porque "eres muy joven". Se trata de que algunas experiencias, cuando llegan demasiado temprano, pesan más de lo que uno puede cargar. Una responsabilidad que todavía no te toca, una relación con una dinámica que no entiendes del todo, una decisión que necesita más madurez de la que tienes en este momento — todo eso puede generar ansiedad, confusión o consecuencias que te acompañan mucho tiempo.',
      '',
      '## 🌱 Lo bonito de respetar el proceso',
      'Las personas que viven bien cada etapa — sin saltarse nada — suelen llegar a la siguiente con más recursos: más confianza y más claridad sobre quiénes son y qué quieren. En cambio, quienes intentaron crecer demasiado rápido suelen tener que volver atrás en algún momento, a resolver cosas que quedaron pendientes.',
      '',
      '## 💛 Disfrutar de lo que tienes ahora',
      'La adolescencia tiene cosas únicas que no vas a volver a tener: la ligereza de no tener que pagar cuentas, el tiempo para explorar quién eres, el permiso para equivocarte y aprender. Eso tiene un valor enorme que muchas personas adultas recuerdan con nostalgia. Aprovéchalo.',
      '',
      '**💜 La enseñanza:** no hay apuro. Las cosas que le corresponden a los 20, a los 25 o a los 30 van a llegar. Lo que no regresa es la etapa que estás viviendo ahora. Vívela completa, sin querer adelantar el capítulo.'
    ),
  },
  {
    slug:     'el-poder-del-abrazo',
    emoji:    '🤗',
    category: 'valores',
    title:    'El poder del abrazo: la forma más honesta de decir "te quiero"',
    summary:  'Un abrazo reduce el estrés de quien lo da y de quien lo recibe. No esperes una ocasión especial.',
    body_markdown: md(
      'Hay cosas que las palabras no alcanzan a decir del todo. A veces una frase bonita se queda corta, y lo que de verdad comunica lo que sientes es algo mucho más simple: un abrazo.',
      '',
      '## 🔬 Lo que le pasa a tu cuerpo cuando abrazas',
      'Cuando abrazas a alguien que quieres, tu cuerpo libera **oxitocina**, una hormona a la que se le dice "la hormona del amor". Esta hormona reduce el estrés, baja la presión arterial, mejora el estado de ánimo y fortalece el vínculo con esa persona. No es magia — es biología. Y funciona tanto en quien abraza como en quien recibe el abrazo.',
      '',
      '## 👵 Quienes más lo necesitan y menos lo piden',
      'Tus abuelos, tus tíos, las personas adultas que te cuidan muchas veces no piden un abrazo aunque lo necesiten. La vida adulta se va llenando de distancia física sin que nadie lo note demasiado. Un abrazo tuyo, dado de corazón, puede cambiarle el día a alguien que lleva semanas sin sentir ese calor. No lo subestimes.',
      '',
      '## 💛 Abrazar también te ayuda a ti',
      'Cuando sientes ansiedad, cuando algo te preocupa o cuando simplemente estás de mal humor, buscar el abrazo de alguien de confianza tiene un efecto real en cómo te sientes. No es debilidad — es inteligencia emocional. Saber pedir y dar afecto es una de las habilidades más importantes que puedes desarrollar. Y si en algún momento un abrazo te incomoda, también está bien decir que no. Un abrazo vale cuando las dos personas lo quieren.',
      '',
      '## 🌸 La gratitud que se siente, no solo se dice',
      'Muchas veces queremos agradecer algo pero no sabemos cómo decirlo sin que suene raro. Un abrazo largo dice "gracias por estar", "gracias por todo lo que haces", "te quiero más de lo que sé expresar con palabras". Es la forma más honesta de gratitud que existe.',
      '',
      '**💜 La enseñanza:** no esperes una ocasión especial para abrazar a quienes quieres. Hazlo hoy — a alguien de tu familia o a una persona de confianza que también quiera ese abrazo. Ese gesto pequeño puede ser el momento más importante del día de esa persona, y del tuyo.'
    ),
  },
];

// published_at escalonado (1 min entre artículos) para que "Para leer" respete el orden de ARTICLES.
export function articlePublishedAt(index: number, base = Date.now()): string {
  return new Date(base - index * 60_000).toISOString();
}
