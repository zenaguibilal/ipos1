'use client';

import { useEffect, useContext, useRef } from 'react';
import { KeyboardShortcutsActionsContext } from '@/contexts/KeyboardShortcutsContext';

export interface ShortcutConfig {
  key: string;            // 'Enter', 'Escape', 'F2', '+', '-', '?'
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;    // Texte affiché dans l'overlay d'aide
  preventDefault?: boolean;   // défaut : true
  ignoreInputFocus?: boolean; // défaut : false
}

/**
 * Détermine si un champ de saisie est actuellement focalisé.
 */
const isInputFocused = (): boolean => {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  const role = el.getAttribute('role');
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    role === 'combobox' ||
    el.getAttribute('contenteditable') === 'true'
  );
};

/**
 * Hook لبرمجة مختصرات لوحة المفاتيح مع حماية ضد التكرار اللانهائي.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  id: string,
  active: boolean = true
): void {
  const actions = useContext(KeyboardShortcutsActionsContext);
  
  // استخدام مرجع لضمان أن المستمع لديه دائماً أحدث الوظائف دون إعادة تشغيل التأثير
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  // تسجيل المختصرات في النظام (لنافذة المساعدة)
  useEffect(() => {
    if (active && actions) {
      actions.registerShortcuts(id, shortcutsRef.current);
      return () => actions.unregisterShortcuts(id);
    }
  }, [id, active, actions]); // لا نضع 'shortcuts' هنا لمنع حلقات التكرار

  // إدارة مستمع الأحداث
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKey = event.key;
      
      for (const config of shortcutsRef.current) {
        const matchKey = config.key.toLowerCase() === pressedKey.toLowerCase();
        const matchCtrl = !!config.ctrl === (event.ctrlKey || event.metaKey);
        const matchShift = !!config.shift === event.shiftKey;
        const matchAlt = !!config.alt === event.altKey;

        if (matchKey && matchCtrl && matchShift && matchAlt) {
          const focused = isInputFocused();
          
          // الحالات العالمية: Escape و Ctrl+Enter تعمل دائماً
          const isUniversal = pressedKey === 'Escape' || (pressedKey === 'Enter' && (event.ctrlKey || event.metaKey));
          
          if (!isUniversal && focused && !config.ignoreInputFocus) {
            continue;
          }

          if (config.preventDefault !== false) {
            event.preventDefault();
          }
          
          config.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active]); // يعتمد فقط على حالة النشاط
}
