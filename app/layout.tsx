import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mi Semana — Carlita',
  description: 'Tracker semanal de responsabilidades de Carlita ✨',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
