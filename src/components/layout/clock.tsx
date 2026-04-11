'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function Clock() {
    const [time, setTime] = useState('');

    useEffect(() => {
        const tick = () => setTime(format(new Date(), 'HH:mm'));
        tick();
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, []);

    if (!time) return null;

    return (
        <span className="hidden xl:inline-block text-xs font-medium text-muted-foreground tabular-nums px-2">
            {time}
        </span>
    );
}
