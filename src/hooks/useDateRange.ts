
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * useDateRange — Hook Elite pour la gestion des plages temporelles.
 * Garantit l'immutabilité des objets pour une réactivité React parfaite.
 */
export function useDateRange(defaultDays: number = 29) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const today = new Date();
        setDateRange({
            from: startOfDay(subDays(today, defaultDays)),
            to: endOfDay(today),
        });
        setIsMounted(true);
    }, [defaultDays]);

    /**
     * Met à jour la plage avec normalisation forcée (00:00:00 -> 23:59:59).
     * Crée systématiquement un nouvel objet pour déclencher les LiveQueries.
     */
    const setRange = useCallback((newRange?: DateRange) => {
        if (!newRange) {
            setDateRange(undefined);
            return;
        }

        const normalized: DateRange = {
            from: newRange.from ? startOfDay(newRange.from) : undefined,
            to: newRange.to ? endOfDay(newRange.to) : undefined
        };
        
        setDateRange(normalized);
    }, []);

    return { dateRange, setDate: setRange, isMounted };
}
