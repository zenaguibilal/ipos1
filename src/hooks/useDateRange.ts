'use client';

import { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * useDateRange — Hook pour définir une plage de dates.
 * Initialisé à undefined pour éviter les erreurs de Hydration (conflit serveur/client).
 */
export function useDateRange(defaultDays: number = 6) {
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

    const setRange = (newRange?: DateRange) => {
        if (newRange?.from && newRange.to) {
            // Force hours normalization
            newRange.from = startOfDay(newRange.from);
            newRange.to = endOfDay(newRange.to);
        }
        setDateRange(newRange);
    }

    return { dateRange, setDate: setRange, isMounted };
}
