
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import { Package, AlertTriangle, PackageX, CalendarClock, TrendingUp } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="app-card h-full bg-card/40 backdrop-blur-sm border-white/5 rounded-lg group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
            <CardTitle className="text-[10px] font-semibold uppercase text-muted-foreground group-hover:text-primary transition-all duration-500">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-xl font-semibold tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1">{value}</div>
            {subtitle && <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
    </Card>
);

export const InventoryStats = ({ isLoading: externalLoading }: { isLoading?: boolean }) => {
    // Live query for the products table to update stats instantly
    const products = useLiveQuery(() => db.products.toArray());

    const stats = useMemo(() => {
        if (!products) return { total: 0, low: 0, out: 0, expiring: 0, totalValue: 0 };
        const now = new Date();
        return {
            total: products.length,
            low: products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length,
            out: products.filter(p => p.quantity <= 0).length,
            expiring: products.filter(p => p.dateExpiration && differenceInDays(new Date(p.dateExpiration), now) <= 30 && differenceInDays(new Date(p.dateExpiration), now) >= 0).length,
            totalValue: products.reduce((acc, p) => acc + (p.quantity > 0 ? p.quantity * p.purchasePrice : 0), 0),
        };
    }, [products]);

    if (products === undefined || externalLoading) {
        return (
             <div className="grid gap-6 grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg bg-card/40" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-5">
            <StatCard title="Catalogue" value={String(stats.total)} icon={Package} colorClass="bg-primary/10 text-primary" subtitle="Produits référencés" />
            <StatCard title="Valeur Stock" value={formatCurrency(stats.totalValue)} icon={TrendingUp} colorClass="bg-emerald-500/10 text-emerald-500" subtitle="Investissement total" />
            <StatCard title="Stock Faible" value={String(stats.low)} icon={AlertTriangle} colorClass="bg-amber-500/10 text-amber-500" subtitle="Réapprovisionnement requis" />
            <StatCard title="Ruptures" value={String(stats.out)} icon={PackageX} colorClass="bg-destructive/10 text-destructive" subtitle="Ventes perdues potentielles" />
            <StatCard title="Péremptions" value={String(stats.expiring)} icon={CalendarClock} colorClass="bg-purple-500/10 text-purple-500" subtitle="Échéances < 30 jours" />
        </div>
    );
};
