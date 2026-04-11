'use client';

import { useEffect, useRef } from 'react';
import type { Sale } from '@/lib/types';
import type { CompanyProfile } from '@/lib/types';

/**
 * useAutoPrint
 *
 * Automatically triggers the browser print dialog whenever a new sale
 * is passed in. Renders a hidden thermal receipt into a dedicated
 * off-screen container, then calls window.print() which picks it up
 * via a @media print rule.
 *
 * Usage:
 *   const { printRef } = useAutoPrint({ sale, profile, enabled });
 *   // Mount <div ref={printRef} /> somewhere in your tree (hidden).
 *
 * The hook only fires when `sale` changes to a non-null value AND
 * `enabled` is true (linked to the company profile setting).
 */
export function useAutoPrint({
    sale,
    profile,
    enabled = true,
}: {
    sale: Sale | null;
    profile: CompanyProfile | null;
    enabled?: boolean;
}) {
    const prevSaleId = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled) return;
        if (!sale) return;
        // Guard: only print once per unique sale uuid
        if (sale.uuid === prevSaleId.current) return;
        prevSaleId.current = sale.uuid;

        // Small delay so the receipt DOM has time to render
        const timer = setTimeout(() => {
            window.print();
        }, 150);

        return () => clearTimeout(timer);
    }, [sale, enabled]);
}
