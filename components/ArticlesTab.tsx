'use client';
import { useState } from 'react';

interface Article {
  id: string;
  emoji: string;
  title: string;
  color: string;
  colorSoft: string;
  content: React.ReactNode;
}

const ARTICLES: Article[] = [
  {
    id: 'cuarto',
    emoji: '🧹',
    title: 'Tu cuarto y tu estado de ánimo: por qué ordenar sí importa',
    color: 'var(--teal)',
    colorSoft: 'var(--teal-soft)',
    content: (
      <>
        <p>¿Alguna vez te has sentido ansiosa, con la mente dispersa, y luego te das cuenta de que tu cuarto parece un campo de batalla? No es coincidencia.</p>

        <h4>🧠 Tu cuarto le habla a tu cerebro</h4>
        <p>Cuando tu habitación está desordenada, tu cerebro registra cada cosa fuera de lugar como una tarea pendiente. Eso significa que aunque estés viendo una serie o intentando estudiar, una parte de tu mente sigue procesando el caos que te rodea. El resultado: te cansas más rápido y te cuesta concentrarte.</p>

        <h4>✨ Lo que pasa cuando ordenas</h4>
        <p>Ordenar no es solo limpiar. Es una forma de decirte a ti misma: <em>"Tengo el control de mi espacio."</em> Y esa sensación de control se convierte en calma. Muchas personas reportan que después de ordenar se sienten más despejadas, menos estresadas y hasta más motivadas para estudiar o hacer cosas que les gustan.</p>

        <h4>💡 Truco para no abrumarte</h4>
        <p>No tienes que hacer todo de golpe. Prueba esto: pon un temporizador de 10 minutos y ordena solo lo que esté visible. Cama tendida, ropa en su lugar, escritorio despejado. Con 10 minutos es suficiente para notar la diferencia. Con el tiempo se vuelve un hábito y deja de costar tanto.</p>

        <p style={{ fontWeight: 700, marginTop: 8 }}>Un cuarto ordenado no es perfección — es una forma de cuidarte. 💜</p>
      </>
    ),
  },
  {
    id: 'sueno',
    emoji: '😴',
    title: 'Por qué dormir bien es una de las mejores cosas que puedes hacer por ti',
    color: 'var(--lilac)',
    colorSoft: 'var(--lilac-soft)',
    content: (
      <>
        <p>Dormir no es "perder el tiempo". Es, literalmente, el momento en que tu cuerpo y tu cerebro se reparan, crecen y se preparan para el día siguiente. Y a los 14 años, esto importa más que en casi cualquier otra etapa de tu vida.</p>

        <h4>🔬 ¿Qué pasa mientras duermes?</h4>
        <p>El sueño no es un estado uniforme. Tu cuerpo pasa por ciclos de aproximadamente 90 minutos, y en cada uno ocurren cosas distintas. En las fases más profundas, el cerebro consolida lo que aprendiste durante el día — es decir, estudiar y luego dormir bien hace que recuerdes más que estudiar y quedarte despierta. En la fase REM (la del sueño con imágenes), el cerebro procesa emociones, resuelve problemas y refuerza la creatividad.</p>

        <h4>🌱 La hormona que te hace crecer — en serio</h4>
        <p>Durante el sueño profundo, tu cuerpo libera la <em>hormona del crecimiento</em>. Esta hormona no solo hace que crezcas en estatura: también repara músculos, fortalece huesos, regula el metabolismo y mantiene tu piel sana. El 70% de la hormona del crecimiento del día se libera mientras duermes. Si te acuestas tarde, ese proceso se interrumpe.</p>

        <h4>🧠 Lo que el mal sueño le hace a tu cerebro</h4>
        <p>Dormir poco afecta la memoria, la concentración y el estado de ánimo. Una noche mal dormida puede hacer que te cueste el doble entender algo en clase, que te irrites más fácil y que sientas más ansiedad. Con el tiempo, el sueño insuficiente se asocia con peor rendimiento escolar, menos energía y mayor riesgo de depresión.</p>

        <h4>⏰ ¿Cuánto necesitas a tu edad?</h4>
        <p>La ciencia es clara: los adolescentes necesitan entre <em>8 y 10 horas</em> por noche. No es un capricho — es lo que tu cuerpo en desarrollo requiere para funcionar bien. Acostarte a las 10 pm y levantarte a las 6 am te da exactamente 8 horas. Cada hora que le robas a tu sueño viendo el celular, la pagas al día siguiente con tu energía, tu concentración y tu humor.</p>

        <p style={{ fontWeight: 700, marginTop: 8, borderTop: '1.5px solid var(--line)', paddingTop: 12 }}>
          💜 La enseñanza: dormir bien no es flojera — es inteligencia. Cada vez que respetas tu hora de dormir, le estás regalando a la Carlita de mañana más energía, mejor memoria y un cuerpo que crece sano. El celular puede esperar. Tu sueño no.
        </p>
      </>
    ),
  },
  {
    id: 'equilibrio',
    emoji: '⚖️',
    title: 'El arte de repartir tu tiempo: estudios, baile, amigos, familia y tú',
    color: 'var(--pink)',
    colorSoft: 'var(--pink-soft)',
    content: (
      <>
        <p>Tienes mucho en tus manos: el cole, los estudios, el baile, tus amigas, ayudar en casa, y además ser hija, hermana, sobrina y nieta. A veces puede sentirse como demasiado. La clave no es hacer todo perfecto — es aprender a repartir tu tiempo con intención.</p>

        <h4>📚 Los estudios: tu base</h4>
        <p>El colegio no es lo más divertido del mundo, pero lo que aprendes ahora abre o cierra puertas más adelante. No necesitas ser la número uno de tu clase, pero sí necesitas cumplir: ir preparada a los exámenes, entregar tus trabajos y mantener el ritmo. Cuando estudias con constancia, te queda tiempo libre de verdad — sin culpa y sin estrés de último momento.</p>

        <h4>💃 El baile: más que un pasatiempo</h4>
        <p>El baile no es un extra — es parte de quién eres. Te da disciplina, expresión, conexión con tu cuerpo y una forma de procesar emociones que las palabras a veces no alcanzan. Cuidar ese espacio es cuidarte a ti misma. Cuando ensayas con compromiso, también estás aprendiendo a ser constante y a trabajar por algo que amas.</p>

        <h4>👯 Las amigas: necesarias, no un lujo</h4>
        <p>El tiempo con tus amigas no es tiempo perdido. Las amistades en la adolescencia te enseñan a confiar, a resolver conflictos, a escuchar y a ser escuchada. Lo que sí importa es que ese tiempo no se coma lo que tienes que hacer. Un plan con amigas cuando ya cumpliste tus responsabilidades sabe completamente distinto a uno cuando sabes que tienes algo pendiente.</p>

        <h4>🏠 La familia: tu red más cercana</h4>
        <p>Ser hija, hermana, nieta, sobrina — cada rol tiene algo que darte y algo que pedirte. Ayudar en casa no es un castigo: es aprender a vivir con otros, a ser responsable de un espacio compartido y a mostrar que valoras lo que tus papás construyen todos los días para que tú puedas tener lo que tienes. Una llamada a tu abuela, un momento con tus tíos, estar presente en familia — esas cosas las vas a recordar mucho más que cualquier serie que hayas visto.</p>

        <h4>🌸 Y tú: no te olvides de ti misma</h4>
        <p>En medio de todo lo anterior, necesitas tiempo para ti. Para no hacer nada. Para pensar. Para escuchar música sin distracciones. Para descansar. Una persona que solo da y nunca recarga, se agota. Respetar tu descanso también es una responsabilidad.</p>

        <p style={{ fontWeight: 700, marginTop: 8, borderTop: '1.5px solid var(--line)', paddingTop: 12 }}>
          💜 La enseñanza: no se trata de hacerlo todo al mismo tiempo ni de ser perfecta en cada rol. Se trata de estar presente en cada cosa cuando le toca. Cuando estudias, estudia. Cuando bailas, baila. Cuando estás con tu familia, estás con tu familia. Esa presencia es lo que convierte el tiempo en algo que vale la pena.
        </p>
      </>
    ),
  },
  {
    id: 'estudio',
    emoji: '📖',
    title: 'Por qué estudiar poco a poco te hace ganar en los exámenes',
    color: 'var(--lilac)',
    colorSoft: 'var(--lilac-soft)',
    content: (
      <>
        <p>Seamos honestas: estudiar todo la noche antes del examen parece una solución, pero tu cerebro tiene otra opinión.</p>

        <h4>😴 El problema de estudiar a último momento</h4>
        <p>Cuando estudias todo de golpe, tu cerebro guarda la información en la memoria a corto plazo. Es como escribir en la arena: está ahí por unas horas, pero se borra rápido. Al día siguiente del examen, ¿qué queda? Poco. Y encima llegaste cansada, lo que hace que tu mente no funcione al 100%.</p>

        <h4>🔁 Por qué funciona estudiar todos los días</h4>
        <p>Cuando repasas un tema varias veces a lo largo de los días, tu cerebro lo mueve a la memoria a largo plazo. Es como grabar en roca en lugar de arena. Esto se llama <em>repetición espaciada</em>, y es una de las técnicas de estudio más respaldadas por la ciencia.</p>

        <h4>🎯 Cómo hacerlo sin que se sienta pesado</h4>
        <p>No tienes que estudiar horas. Con 30–45 minutos diarios enfocados — sin celular, sin series de fondo — es más que suficiente para que el material se quede. Cuando llegue el examen, no estarás repasando desde cero. Solo estarás refrescando lo que ya sabes. Esa diferencia se nota en la nota.</p>

        <p style={{ fontWeight: 700, marginTop: 8 }}>Cada vez que estudias hoy, le estás regalando tranquilidad a la Carlita del día del examen. 🌟</p>
      </>
    ),
  },
  {
    id: 'etapas',
    emoji: '🌻',
    title: 'Vivir tu edad: por qué cada etapa tiene su momento',
    color: 'var(--yellow)',
    colorSoft: 'var(--yellow-soft)',
    content: (
      <>
        <p>Hay una frase que parece simple pero que vale mucho: <em>"Cada cosa a su tiempo."</em> Y es que la vida está diseñada en etapas, y cada una tiene cosas que le pertenecen. Saltarse alguna — aunque a veces parezca tentador — casi siempre trae problemas que no estabas lista para manejar.</p>

        <h4>🧩 ¿Qué significa vivir tu edad?</h4>
        <p>A los 14 años hay cosas que te corresponden: aprender, equivocarte sin que las consecuencias sean demasiado grandes, descubrir qué te gusta, construir amistades, bailar, reír, preocuparte por cosas de tu edad. Eso no es poco. Es, de hecho, muchísimo. El problema aparece cuando se mezclan preocupaciones o situaciones que le pertenecen a otra etapa — una más adulta — y para la que todavía no tienes las herramientas emocionales ni la experiencia para manejarla bien.</p>

        <h4>⚠️ Lo que pasa cuando uno se adelanta</h4>
        <p>No se trata de que no puedas hacer ciertas cosas porque "eres chica". Se trata de que algunas experiencias, cuando llegan demasiado temprano, pesan más de lo que uno puede cargar. Una responsabilidad que no te toca todavía, una relación con una dinámica que no entiendes del todo, una decisión que necesita más madurez de la que tienes en este momento — todo eso puede generar ansiedad, confusión o consecuencias que te acompañan mucho tiempo.</p>

        <h4>🌱 Lo bonito de respetar el proceso</h4>
        <p>Las personas que viven cada etapa bien — que no se saltaron nada — suelen llegar a la siguiente con más recursos. Llegan con más confianza, más claridad sobre quiénes son y qué quieren. En cambio, las que intentaron crecer demasiado rápido suelen tener que volver atrás en algún momento, a resolver cosas que quedaron pendientes.</p>

        <h4>💛 Disfrutar de lo que tienes ahora</h4>
        <p>Ser adolescente tiene cosas únicas que no vas a volver a tener: la ligereza de no tener que pagar cuentas, el tiempo para explorar quién eres, el permiso social de equivocarte y aprender. Eso tiene un valor enorme que muchas personas adultas recuerdan con nostalgia. Aprovéchalo.</p>

        <p style={{ fontWeight: 700, marginTop: 8, borderTop: '1.5px solid var(--line)', paddingTop: 12 }}>
          💜 La enseñanza: no hay apuro. Las cosas que le corresponden a los 20, a los 25 o a los 30 van a llegar. Lo que no regresa es la etapa que estás viviendo ahora. Vívela completa, sin querer adelantar el capítulo.
        </p>
      </>
    ),
  },
  {
    id: 'abrazo',
    emoji: '🤗',
    title: 'El poder del abrazo: la forma más honesta de decir "te quiero"',
    color: 'var(--pink)',
    colorSoft: 'var(--pink-soft)',
    content: (
      <>
        <p>Hay cosas que las palabras no alcanzan a decir del todo. A veces una frase bonita se queda corta, y lo que de verdad comunica lo que sientes es algo mucho más simple: un abrazo.</p>

        <h4>🔬 Lo que le pasa a tu cuerpo cuando abrazas</h4>
        <p>Cuando abrazas a alguien que quieres, tu cuerpo libera <em>oxitocina</em>, una hormona que se llama coloquialmente "la hormona del amor". Esta hormona reduce el estrés, baja la presión arterial, mejora el estado de ánimo y fortalece el vínculo con esa persona. No es magia — es biología. Y funciona tanto en quien abraza como en quien recibe el abrazo.</p>

        <h4>👵 Los que más lo necesitan y menos lo piden</h4>
        <p>Tus abuelos, tus tíos, tus papás — los adultos que te rodean muchas veces no piden un abrazo aunque lo necesiten. La vida adulta va llenando de distancia física sin que nadie lo note demasiado. Un abrazo tuyo, dado de corazón, puede cambiarle el día a alguien que lleva semanas sin sentir ese calor. No lo subestimes.</p>

        <h4>💛 Abrazar también te ayuda a ti</h4>
        <p>Cuando estás ansiosa, cuando algo te preocupa o cuando simplemente estás de mal humor, buscar el abrazo de alguien de confianza tiene un efecto real y medible en cómo te sientes. No es debilidad — es inteligencia emocional. Saber pedir y dar afecto es una de las habilidades más importantes que puedes desarrollar.</p>

        <h4>🌸 La gratitud que se siente, no solo se dice</h4>
        <p>Muchas veces queremos agradecer algo pero no sabemos cómo decirlo sin que suene raro. Un abrazo largo dice "gracias por estar", "gracias por todo lo que haces", "te quiero más de lo que sé expresar con palabras". Es la forma más honesta de gratitud que existe.</p>

        <p style={{ fontWeight: 700, marginTop: 8, borderTop: '1.5px solid var(--line)', paddingTop: 12 }}>
          💜 La enseñanza: no esperes una ocasión especial para abrazar a quienes quieres. No esperes que ellos lo pidan. Hazlo hoy — a tu mamá, a tu papá, a tu abuela, a quien tengas cerca. Ese gesto pequeño puede ser el momento más importante del día de esa persona, y del tuyo.
        </p>
      </>
    ),
  },
];

export default function ArticlesTab() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div>
      <h3 style={{
        fontFamily: 'var(--font-title)', fontWeight: 700,
        fontSize: 17, color: 'var(--pink)', marginBottom: 6,
      }}>
        📚 Datos para ti
      </h3>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20 }}>
        Cosas que vale la pena saber. Tómate tu tiempo para leerlas. ✨
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ARTICLES.map(a => {
          const isOpen = open === a.id;
          return (
            <div
              key={a.id}
              style={{
                borderRadius: 18, overflow: 'hidden',
                border: `1.5px solid ${a.color}22`,
                background: 'var(--bg-card)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {/* Header */}
              <button
                onClick={() => setOpen(isOpen ? null : a.id)}
                style={{
                  width: '100%', padding: '16px 18px',
                  background: isOpen ? a.colorSoft : 'var(--bg-card)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  textAlign: 'left', transition: 'background 0.2s',
                }}
              >
                <span style={{ fontSize: 26, flexShrink: 0 }}>{a.emoji}</span>
                <span style={{
                  flex: 1, fontFamily: 'var(--font-title)', fontWeight: 700,
                  fontSize: 15, color: isOpen ? a.color : 'var(--ink)',
                  lineHeight: 1.3,
                }}>
                  {a.title}
                </span>
                <span style={{
                  color: a.color, fontSize: 18, fontWeight: 700,
                  flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}>
                  ›
                </span>
              </button>

              {/* Content */}
              {isOpen && (
                <div style={{
                  padding: '4px 18px 20px',
                  display: 'flex', flexDirection: 'column', gap: 12,
                  fontSize: 14, lineHeight: 1.7, color: 'var(--ink)',
                }}>
                  <style>{`
                    .article-content h4 {
                      font-family: var(--font-title);
                      font-size: 15px;
                      font-weight: 700;
                      color: ${a.color};
                      margin-top: 8px;
                      margin-bottom: 4px;
                    }
                    .article-content p {
                      margin: 0;
                    }
                    .article-content em {
                      font-style: italic;
                      color: ${a.color};
                    }
                  `}</style>
                  <div className="article-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {a.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
