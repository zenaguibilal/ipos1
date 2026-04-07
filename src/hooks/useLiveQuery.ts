'use client';

import { liveQuery } from 'dexie';
import { useState, useEffect } from 'react';

/**
 * Custom hook to observe Dexie queries in real-time.
 * Replaces the 'dexie-react-hook' package to resolve NPM registry issues.
 */
export function useLiveQuery<T>(
    querier: () => T | Promise<T>,
    deps: any[] = [],
): T | undefined {
    const [value, setValue] = useState<T | undefined>(undefined);

    useEffect(() => {
        const observable = liveQuery(querier);
        const subscription = observable.subscribe({
            next:  (val) => setValue(val),
            error: (err) => console.error('LiveQuery error:', err),
        });
        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return value;
}