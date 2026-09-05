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
