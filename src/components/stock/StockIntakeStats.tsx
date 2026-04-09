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
    <Card className="h-full bg-card border shadow-sm rounded-2xl group overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
            <div className={cn("p-2 rounded-xl shadow-inner", colorClass)}>
                <Icon className="h-4 w-4" />
            </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
            <div className="text-2xl font-black tracking-tight text-foreground mb-0.5">{value}</div>
            {subtitle && <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
    </Card>
);

export const StockIntakeStats = ({ intakes: externalIntakes, isLoading: externalLoading }: StockIntakeStatsProps) => {
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
             <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-2xl bg-card" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
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
                subtitle="Bons enregistrés"
            />
            <StatCard 
                title="Partenaires Actifs" 
                value={String(stats.supplierCount)} 
                icon={Building} 
                colorClass="bg-amber-500/10 text-amber-500"
                subtitle="Fournisseurs sollicités"
            />
        </div>
    );
};
