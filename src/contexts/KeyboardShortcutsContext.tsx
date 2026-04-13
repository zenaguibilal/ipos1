'use client';

import React, { createContext, useState, useCallback, useMemo } from 'react';
import type { ShortcutConfig } from '@/hooks/useKeyboardShortcuts';

/**
 * @fileOverview نظام إدارة مختصرات لوحة المفاتيح المتقدم.
 * تم تقسيم السياق لمنع حلقات التكرار اللانهائية (Render Loops).
 */

interface KeyboardShortcutsActions {
  registerShortcuts: (id: string, shortcuts: ShortcutConfig[]) => void;
  unregisterShortcuts: (id: string) => void;
}

// سياق العمليات: لا يتغير أبداً لمنع إعادة الرنة للمستهلكين
export const KeyboardShortcutsActionsContext = createContext<KeyboardShortcutsActions | undefined>(undefined);

// سياق البيانات: تستهلكه نافذة المساعدة فقط
export const KeyboardShortcutsDataContext = createContext<Record<string, ShortcutConfig[]>>({});

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [allShortcuts, setAllShortcuts] = useState<Record<string, ShortcutConfig[]>>({});

  const registerShortcuts = useCallback((id: string, shortcuts: ShortcutConfig[]) => {
    setAllShortcuts(prev => {
      // تجنب التحديث إذا كانت البيانات متطابقة مرجعياً (اختياري ولكن آمن)
      if (prev[id] === shortcuts) return prev;
      return { ...prev, [id]: shortcuts };
    });
  }, []);

  const unregisterShortcuts = useCallback((id: string) => {
    setAllShortcuts(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // ميموزا لعمليات التسجيل لضمان استقرارها
  const actions = useMemo(() => ({ registerShortcuts, unregisterShortcuts }), [registerShortcuts, unregisterShortcuts]);

  return (
    <KeyboardShortcutsActionsContext.Provider value={actions}>
      <KeyboardShortcutsDataContext.Provider value={allShortcuts}>
        {children}
      </KeyboardShortcutsDataContext.Provider>
    </KeyboardShortcutsActionsContext.Provider>
  );
}
