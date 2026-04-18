'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Archive, Building, TrendingUp, Sparkles } from 'lucide-react';
import { formatCurrency, cn, safeNumber } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import type { StockIntake } from '@/lib/types';

interface StockIntakeStatsProps {
    intakes?: StockIntake[];
    isLoading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="app-card h-full bg-card/40 backdrop-blur-sm border-white/5 rounded-lg group overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-primary transition-all duration-500 tracking-widest">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 relative z-10">
            <div className="text-2xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1 tabular-nums">{value}</div>
            {subtitle && <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
        <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000">
            <Icon className="h-32 w-32 rotate-12" />
        </div>
    </Card>
);

export const StockIntakeStats = ({ intakes: externalIntakes, isLoading: externalLoading }: StockIntakeStatsProps) => {
    // Live query for stock intakes to update stats instantly in real-time
    const liveIntakes = useLiveQuery(() => db.stock_intakes.toArray());
    
    const intakes = externalIntakes || liveIntakes;

    const stats = useMemo(() => {
        if (!intakes) return { totalValue: 0, intakeCount: 0, supplierCount: 0 };
        
        // المحرك الحسابي بالسنتيمات لضمان الدقة المطلقة
        const totalValCents = intakes.reduce((sum, i) => sum + Math.round(safeNumber(i.totalValue) * 100), 0);
        const supplierUuids = new Set(intakes.map(i => i.supplierUuid).filter(Boolean));
        
        return {
            totalValue: totalValCents / 100,
            intakeCount: intakes.length,
            supplierCount: supplierUuids.size,
        };
    }, [intakes]);

    if (intakes === undefined || externalLoading) {
        return (
             <div className="grid gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg bg-card/40 border border-white/5 animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in duration-700">
            <StatCard 
                title="Investissement Stock" 
                value={formatCurrency(stats.totalValue)} 
                icon={TrendingUp} 
                colorClass="bg-emerald-500/10 text-emerald-500"
                subtitle="Valeur totale injectée"
            />
            <StatCard 
                title="Bons de Réception" 
                value={String(stats.intakeCount)} 
                icon={Archive} 
                colorClass="bg-primary/10 text-primary"
                subtitle="Opérations validées"
            />
            <StatCard 
                title="Réseau Partenaires" 
                value={String(stats.supplierCount)} 
                icon={Building} 
                colorClass="bg-amber-500/10 text-amber-500"
                subtitle="Fournisseurs actifs"
            />
        </div>
    );
};
