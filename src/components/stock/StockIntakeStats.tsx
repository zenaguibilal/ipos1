
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Archive, Building, TrendingUp } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import type { StockIntake } from '@/lib/types';

interface StockIntakeStatsProps {
    intakes?: StockIntake[];
    isLoading?: boolean;
}

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

export const StockIntakeStats = ({ intakes: externalIntakes, isLoading: externalLoading }: StockIntakeStatsProps) => {
    // Live query for stock intakes to update stats instantly using the internal hook
    const liveIntakes = useLiveQuery(() => db.stock_intakes.toArray());
    
    const intakes = externalIntakes || liveIntakes;

    const stats = useMemo(() => {
        if (!intakes) return { totalValue: 0, intakeCount: 0, supplierCount: 0 };
        const supplierUuids = new Set(intakes.map(i => i.supplierUuid).filter(Boolean));
        return {
            totalValue: intakes.reduce((sum, i) => sum + (Number(i.totalValue) || 0), 0),
            intakeCount: intakes.length,
            supplierCount: supplierUuids.size,
        };
    }, [intakes]);

    if (intakes === undefined || externalLoading) {
        return (
             <div className="grid gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg bg-card/40" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <StatCard 
                title="Investissement Stock" 
                value={formatCurrency(stats.totalValue)} 
                icon={TrendingUp} 
                colorClass="bg-emerald-500/10 text-emerald-500"
                subtitle="Valeur totale des entrées"
            />
            <StatCard 
                title="Bons de Réception" 
                value={String(stats.intakeCount)} 
                icon={Archive} 
                colorClass="bg-primary/10 text-primary"
                subtitle="Opérations enregistrées"
            />
            <StatCard 
                title="Réseau Fournisseurs" 
                value={String(stats.supplierCount)} 
                icon={Building} 
                colorClass="bg-amber-500/10 text-amber-500"
                subtitle="Partenaires actifs"
            />
        </div>
    );
};
