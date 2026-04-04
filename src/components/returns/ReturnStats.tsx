'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Undo2, Banknote, PackageOpen, Coins } from 'lucide-react';
import type { ProductReturn } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="luxury-card h-full bg-card/40 backdrop-blur-2xl border-white/5 rounded-[2rem] group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground group-hover:text-primary transition-all duration-500">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-2xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1">{value}</div>
            {subtitle && <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
    </Card>
);

export function ReturnStats({ returns: externalReturns, isLoading: externalLoading }: { returns?: ProductReturn[], isLoading?: boolean }) {
  // Live query for returns table to update stats instantly using the internal hook
  const liveReturns = useLiveQuery(() => db.product_returns.toArray());
  
  const returns = externalReturns || liveReturns;

  const stats = useMemo(() => {
    if (!returns) return { count: 0, totalValue: 0, totalRefunded: 0, creditIssued: 0 };
    const totalValue = returns.reduce((sum, r) => sum + r.totalReturnValue, 0);
    const totalRefunded = returns.reduce((sum, r) => sum + r.amountRefunded, 0);
    return {
      count: returns.length,
      totalValue,
      totalRefunded,
      creditIssued: totalValue - totalRefunded,
    };
  }, [returns]);

  if (returns === undefined || externalLoading) {
    return (
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[2rem] bg-card/40" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Flux Retours" 
        value={String(stats.count)} 
        icon={Undo2} 
        colorClass="bg-amber-500/10 text-amber-500" 
        subtitle="Opérations validées" 
      />
      <StatCard 
        title="Valeur Elite" 
        value={formatCurrency(stats.totalValue)} 
        icon={PackageOpen} 
        colorClass="bg-primary/10 text-primary" 
        subtitle="Stock réintégré" 
      />
      <StatCard 
        title="Impact Caisse" 
        value={formatCurrency(stats.totalRefunded)} 
        icon={Banknote} 
        colorClass="bg-emerald-500/10 text-emerald-500" 
        subtitle="Montants décaissés" 
      />
      <StatCard 
        title="Crédits Émis" 
        value={formatCurrency(stats.creditIssued)} 
        icon={Coins} 
        colorClass="bg-blue-500/10 text-blue-500" 
        subtitle="Avoirs sur comptes" 
      />
    </div>
  );
}