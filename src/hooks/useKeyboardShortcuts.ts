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
 * Hook pour programmer les raccourcis clavier avec protection contre les boucles de rendu.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  id: string,
  active: boolean = true
): void {
  const actions = useContext(KeyboardShortcutsActionsContext);
  
  // Utilisation d'une référence pour garantir que l'écouteur a toujours les dernières fonctions
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  // Enregistrement des raccourcis dans le système (pour la fenêtre d'aide)
  useEffect(() => {
    if (active && actions) {
      actions.registerShortcuts(id, shortcutsRef.current);
      return () => actions.unregisterShortcuts(id);
    }
  }, [id, active, actions]);

  // Gestion de l'écouteur d'événements
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKey = event.key;
      
      if (!pressedKey) return;
      
      for (const config of shortcutsRef.current) {
        if (!config.key) continue;

        const matchKey = config.key.toLowerCase() === pressedKey.toLowerCase();
        const matchCtrl = !!config.ctrl === (event.ctrlKey || event.metaKey);
        const matchShift = !!config.shift === event.shiftKey;
        const matchAlt = !!config.alt === event.altKey;

        if (matchKey && matchCtrl && matchShift && matchAlt) {
          const focused = isInputFocused();
          
          // Cas universels : Escape et Ctrl+Enter fonctionnent toujours
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
  }, [active]);
}
