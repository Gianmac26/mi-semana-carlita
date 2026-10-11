'use client';
import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

interface HelpSheetContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const HelpSheetContext = createContext<HelpSheetContextValue | null>(null);

export function HelpSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open  = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return <HelpSheetContext.Provider value={value}>{children}</HelpSheetContext.Provider>;
}

export function useHelpSheet() {
  const ctx = useContext(HelpSheetContext);
  if (!ctx) throw new Error('useHelpSheet must be used inside <HelpSheetProvider>');
  return ctx;
}
