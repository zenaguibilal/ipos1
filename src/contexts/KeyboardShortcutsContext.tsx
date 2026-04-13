'use client';

import React, { createContext, useState, useCallback } from 'react';
import type { ShortcutConfig } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsContextType {
  registerShortcuts: (id: string, shortcuts: ShortcutConfig[]) => void;
  unregisterShortcuts: (id: string) => void;
  allShortcuts: Record<string, ShortcutConfig[]>;
}

export const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

/**
 * Provider gérant le registre central des raccourcis clavier actifs.
 */
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [allShortcuts, setAllShortcuts] = useState<Record<string, ShortcutConfig[]>>({});

  const registerShortcuts = useCallback((id: string, shortcuts: ShortcutConfig[]) => {
    setAllShortcuts(prev => ({ ...prev, [id]: shortcuts }));
  }, []);

  const unregisterShortcuts = useCallback((id: string) => {
    setAllShortcuts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return (
    <KeyboardShortcutsContext.Provider value={{ registerShortcuts, unregisterShortcuts, allShortcuts }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}
