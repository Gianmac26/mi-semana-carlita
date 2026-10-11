'use client';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { GlobalResource, WellnessCategory, WellnessResource } from '@/lib/types';
import { useHelpSheet } from '@/components/HelpSheetProvider';
import WellnessCategorySheet, { type WellnessCategoryMeta } from '@/components/WellnessCategorySheet';
import WellnessDetailSheet, { type WellnessDetailContent } from '@/components/WellnessDetailSheet';

const CATEGORIES: WellnessCategoryMeta[] = [
  { key: 'crisis',    emoji: '🚨', title: 'Crisis y prevención',  color: 'var(--error)',  colorSoft: 'var(--error-soft)'  },
  { key: 'emociones', emoji: '💭', title: 'Emociones',            color: 'var(--yellow)', colorSoft: 'var(--yellow-soft)' },
  { key: 'bullying',  emoji: '🛡️', title: 'Bullying',             color: 'var(--lilac)',  colorSoft: 'var(--lilac-soft)'  },
  { key: 'violencia', emoji: '🏠', title: 'Violencia',            color: 'var(--accent)', colorSoft: 'var(--accent-soft)' },
  { key: 'tca',       emoji: '🍽️', title: 'Alimentación y cuerpo', color: 'var(--teal)',   colorSoft: 'var(--teal-soft)'   },
  { key: 'valores',   emoji: '⭐', title: 'Valores',              color: 'var(--ok)',     colorSoft: 'var(--ok-soft)'     },
];

type LoadState = 'loading' | 'error' | 'ready';

const sectionLabel = {
  fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700,
  textTransform: 'uppercase' as const, letterSpacing: 0.5, margin: '0 0 12px',
};

export default function WellnessTab() {
  const [supabase] = useState(() => createBrowserClient());
  const { open: openHelp } = useHelpSheet();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [articles,  setArticles]  = useState<GlobalResource[]>([]);

  const [category, setCategory] = useState<WellnessCategoryMeta | null>(null);
  const [detail,   setDetail]   = useState<WellnessDetailContent | null>(null);
  const [detailBackLabel, setDetailBackLabel] = useState('Volver');

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase
        .from('wellness_resources')
        .select('id, slug, category, title, emoji, summary, body_markdown, action_steps, helpline_refs, sort_order')
        .eq('active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('global_resources')
        .select('id, slug, title, summary, body_markdown, emoji')
        .eq('active', true)
        .order('published_at', { ascending: false }),
    ]).then(([wellnessRes, articlesRes]) => {
      if (cancelled) return;
      if (wellnessRes.error) {
        console.error('[WellnessTab] wellness_resources:', wellnessRes.error.message);
        setLoadState('error');
        return;
      }
      if (articlesRes.error) console.error('[WellnessTab] global_resources:', articlesRes.error.message);
      setResources((wellnessRes.data ?? []) as WellnessResource[]);
      setArticles((articlesRes.data ?? []) as GlobalResource[]);
      setLoadState('ready');
    });
    return () => { cancelled = true; };
  }, [supabase, reloadKey]);

  const retry = () => { setLoadState('loading'); setReloadKey(k => k + 1); };

  const byCategory = useMemo(() => {
    const map = new Map<WellnessCategory, WellnessResource[]>();
    for (const r of resources) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [resources]);

  const openFromCategory = (r: WellnessResource) => {
    setDetailBackLabel(category ? `Volver a ${category.title}` : 'Volver');
    setDetail(r);
  };

  const openArticle = (a: GlobalResource) => {
    setDetailBackLabel('Volver a Bienestar');
    setDetail(a);
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', margin: 0 }}>
          💚 Bienestar
        </h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', marginTop: 4 }}>
          Recursos para entenderte mejor.
        </p>
      </div>

      {/* Banner de emergencia */}
      <div style={{
        background: 'var(--accent)', color: 'var(--on-accent)',
        borderRadius: 20, padding: '18px 18px 16px', marginBottom: 26,
      }}>
        <p style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17, margin: 0, lineHeight: 1.3 }}>
          ¿Necesitas ayuda ahora?
        </p>
        <p style={{ fontSize: 14.5, margin: '4px 0 14px', lineHeight: 1.45, opacity: 0.95 }}>
          Hay personas listas para escucharte.
        </p>
        <button
          onClick={openHelp}
          aria-haspopup="dialog"
          style={{
            width: '100%', minHeight: 56, borderRadius: 16, border: 'none',
            background: 'var(--bg-card)', color: 'var(--accent)', cursor: 'pointer',
            fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          💙 Abrir líneas de ayuda
        </button>
      </div>

      {/* Categorías */}
      <p style={sectionLabel}>Temas</p>

      {loadState === 'loading' && (
        <div aria-busy="true" aria-label="Cargando fichas" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CATEGORIES.map(c => (
            <div key={c.key} style={{
              minHeight: 108, borderRadius: 18, background: 'var(--line)', opacity: 0.5,
            }} />
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div style={{
          background: 'var(--bg-card)', border: '1.5px solid var(--line)', borderRadius: 18,
          padding: '18px 16px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', margin: '0 0 12px' }}>
            No pudimos cargar las fichas. Revisa tu conexión.
          </p>
          <button
            onClick={retry}
            style={{
              minHeight: 48, padding: '0 22px', borderRadius: 14, border: 'none',
              background: 'var(--accent)', color: 'var(--on-accent)', cursor: 'pointer',
              fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {loadState === 'ready' && resources.length === 0 && (
        <p style={{
          background: 'var(--bg-card)', border: '1.5px solid var(--line)', borderRadius: 18,
          padding: '18px 16px', textAlign: 'center', fontSize: 14.5, color: 'var(--ink-soft)', margin: 0,
        }}>
          Todavía no hay fichas de bienestar. Vuelve pronto 💚
        </p>
      )}

      {loadState === 'ready' && resources.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CATEGORIES.map(c => {
            const count = byCategory.get(c.key)?.length ?? 0;
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c)}
                style={{
                  minHeight: 108, padding: '14px 12px', borderRadius: 18, cursor: 'pointer',
                  border: `1.5px solid color-mix(in srgb, ${c.color} 30%, transparent)`,
                  background: c.colorSoft, textAlign: 'left',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8,
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>{c.emoji}</span>
                <span>
                  <span style={{
                    display: 'block', fontFamily: 'var(--font-title)', fontWeight: 700,
                    fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.25,
                  }}>
                    {c.title}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 3 }}>
                    {count === 1 ? '1 ficha' : `${count} fichas`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Para leer */}
      {loadState === 'ready' && articles.length > 0 && (
        <>
          <p style={{ ...sectionLabel, marginTop: 28 }}>Para leer</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {articles.map(a => (
              <button
                key={a.id}
                onClick={() => openArticle(a)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  width: '100%', minHeight: 64, padding: '12px 14px', borderRadius: 16,
                  border: '1.5px solid var(--line)', background: 'var(--bg-card)', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{a.emoji}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'block', fontFamily: 'var(--font-title)', fontWeight: 700,
                    fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.3,
                  }}>
                    {a.title}
                  </span>
                  {a.summary && (
                    <span style={{
                      display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2,
                    }}>
                      {a.summary}
                    </span>
                  )}
                </span>
                <span aria-hidden style={{ flexShrink: 0, color: 'var(--ink-soft)', fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        </>
      )}

      <WellnessCategorySheet
        category={category}
        resources={category ? byCategory.get(category.key) ?? [] : []}
        onClose={() => setCategory(null)}
        onSelect={openFromCategory}
      />
      <WellnessDetailSheet
        item={detail}
        onClose={() => setDetail(null)}
        backLabel={detailBackLabel}
      />
    </div>
  );
}
