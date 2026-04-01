
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, UserX, Landmark } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export function CustomerStats() {
  const [stats, setStats] = useState<{ total: number; overdue: number; overLimit: number; totalOutstanding: number } | undefined>(undefined);

  const fetchStats = useCallback(async () => {
    try {
        const data = await customerService.getStats();
        setStats(data);
    } catch (error) {
        toast.error("Impossible de charger les statistiques des clients.");
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const isLoading = stats === undefined;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <Card className="rounded-2xl border-none shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-primary opacity-50" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.total}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Créances Totales</CardTitle>
          <Landmark className="h-4 w-4 text-destructive opacity-50" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-black text-destructive truncate">{formatCurrency(stats.totalOutstanding)}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Retards</CardTitle>
          <AlertTriangle className="h-4 w-4 text-chart-secondary opacity-50" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-chart-secondary">{stats.overdue}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plafond Dépassé</CardTitle>
          <UserX className="h-4 w-4 text-destructive opacity-50" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-destructive">{stats.overLimit}</div>
        </CardContent>
      </Card>
    </div>
  );
}
