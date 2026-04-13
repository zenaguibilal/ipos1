'use client';

import { useEffect, useContext } from 'react';
import { KeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';

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
 * Hook pour enregistrer et gérer des raccourcis clavier dans un composant.
 * @param shortcuts Liste des configurations de raccourcis.
 * @param id Identifiant unique pour le composant (pour l'aide).
 * @param active Si les raccourcis doivent être actifs (défaut: true).
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  id: string,
  active: boolean = true
): void {
  const context = useContext(KeyboardShortcutsContext);

  // Enregistrement des raccourcis dans le contexte global (pour l'aide)
  useEffect(() => {
    if (active && context) {
      context.registerShortcuts(id, shortcuts);
      return () => context.unregisterShortcuts(id);
    }
  }, [id, shortcuts, active, context]);

  // Gestionnaire d'événements clavier
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Normalisation de la touche pour la comparaison
      const pressedKey = event.key;
      
      for (const config of shortcuts) {
        const matchKey = config.key.toLowerCase() === pressedKey.toLowerCase();
        const matchCtrl = !!config.ctrl === (event.ctrlKey || event.metaKey);
        const matchShift = !!config.shift === event.shiftKey;
        const matchAlt = !!config.alt === event.altKey;

        if (matchKey && matchCtrl && matchShift && matchAlt) {
          const focused = isInputFocused();
          
          // Exceptions universelles : Escape et Ctrl+Enter se déclenchent toujours
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
  }, [shortcuts, active]);
}
