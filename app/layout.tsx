import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mi Semana',
  description: 'Tu semana familiar organizada ✨',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mi Semana',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* Runs synchronously before first paint to prevent FOUC on theme/palette */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var p=localStorage.getItem('mi-semana-palette')||'vibrante';var m=localStorage.getItem('mi-semana-mode');document.documentElement.setAttribute('data-palette',p);if(m&&m!=='auto')document.documentElement.setAttribute('data-mode',m);}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
