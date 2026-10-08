import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mi Semana — Carlita',
  description: 'Tracker semanal de responsabilidades de Carlita ✨',
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
      <body>{children}</body>
    </html>
  );
}
