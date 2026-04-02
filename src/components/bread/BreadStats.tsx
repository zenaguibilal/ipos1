'use client';

import { useMemo } from 'react';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface BreadStatsProps {
    orders?: BreadOrderWithCustomer[];
    isLoading: boolean;
}

export function BreadStats({ orders, isLoading }: BreadStatsProps) {
    const stats = useMemo(() => {
        if (!orders) return { ordered: 0, delivered: 0, remaining: 0, paid: 0 };
        const ordered = orders.reduce((sum, o) => sum + o.quantite, 0);
        const delivered = orders.filter(o => o.est_livre).reduce((sum, o) => sum + o.quantite, 0);
        const paid = orders.filter(o => o.est_paye).reduce((sum, o) => sum + o.quantite, 0);
        return {
            ordered,
            delivered,
            remaining: ordered - delivered,
            paid
        };
    }, [orders]);

    if(isLoading) {
        return (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
        )
    }

    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Commandé</CardTitle>
                    <Package className="h-4 w-4 text-primary opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{stats.ordered} <span className="text-[10px] text-muted-foreground uppercase">pcs</span></div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Livré</CardTitle>
                    <Truck className="h-4 w-4 text-chart-quaternary opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-chart-quaternary">{stats.delivered}</div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reste à Livrer</CardTitle>
                    <Clock className="h-4 w-4 text-amber-500 opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-amber-500">{stats.remaining}</div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Déjà Encaissé</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-emerald-500">{stats.paid}</div>
                </CardContent>
            </Card>
        </div>
    );
}
