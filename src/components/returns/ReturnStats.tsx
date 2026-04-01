
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Undo2, Banknote, PackageOpen } from 'lucide-react';
import type { ProductReturn } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export function ReturnStats({ returns, isLoading }: { returns: ProductReturn[] | undefined, isLoading: boolean }) {
  const stats = useMemo(() => {
    if (!returns) return { count: 0, totalValue: 0, totalRefunded: 0 };
    return {
      count: returns.length,
      totalValue: returns.reduce((sum, r) => sum + r.totalReturnValue, 0),
      totalRefunded: returns.reduce((sum, r) => sum + r.amountRefunded, 0),
    };
  }, [returns]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      <Card className="rounded-2xl border-none shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre de Retours</CardTitle>
          <Undo2 className="h-4 w-4 text-amber-500 opacity-50" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.count}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valeur Marchandise</CardTitle>
          <PackageOpen className="h-4 w-4 text-amber-500 opacity-50" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-black text-amber-500 truncate">{formatCurrency(stats.totalValue)}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Remboursé</CardTitle>
          <Banknote className="h-4 w-4 text-emerald-500 opacity-50" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-black text-emerald-500 truncate">{formatCurrency(stats.totalRefunded)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
