
'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import { Package, AlertTriangle, PackageX, CalendarClock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export const InventoryStats = ({ products, isLoading }: { products: Product[] | undefined, isLoading: boolean }) => {
    const stats = useMemo(() => {
        if (!products) return { total: 0, low: 0, out: 0, expiring: 0 };
        const now = new Date();
        return {
            total: products.length,
            low: products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length,
            out: products.filter(p => p.quantity <= 0).length,
            expiring: products.filter(p => p.dateExpiration && differenceInDays(new Date(p.dateExpiration), now) <= 30 && differenceInDays(new Date(p.dateExpiration), now) >= 0).length,
        };
    }, [products]);

    if (isLoading) {
        return (
             <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="rounded-2xl border-none shadow-sm">
                        <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                        <CardContent><Skeleton className="h-8 w-12" /></CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Produits</CardTitle>
                    <Package className="h-4 w-4 text-primary opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{stats.total}</div>
                </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stock Faible</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-500 opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-amber-500">{stats.low}</div>
                </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">En Rupture</CardTitle>
                    <PackageX className="h-4 w-4 text-destructive opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-destructive">{stats.out}</div>
                </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Péremption Proche</CardTitle>
                    <CalendarClock className="h-4 w-4 text-chart-tertiary opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-chart-tertiary">{stats.expiring}</div>
                </CardContent>
            </Card>
        </div>
    );
};
