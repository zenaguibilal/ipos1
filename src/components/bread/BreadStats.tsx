
'use client';

import { useMemo } from 'react';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, Truck } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface BreadStatsProps {
    orders?: BreadOrderWithCustomer[];
    isLoading: boolean;
}

export function BreadStats({ orders, isLoading }: BreadStatsProps) {
    const stats = useMemo(() => {
        if (!orders) return { totalOrders: 0, totalQuantity: 0, deliveredCount: 0 };
        return {
            totalOrders: orders.length,
            totalQuantity: orders.reduce((sum, o) => sum + o.quantite, 0),
            deliveredCount: orders.filter(o => o.est_livre).length,
        };
    }, [orders]);

    if(isLoading) {
        return (
            <div className="grid gap-4 grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
            </div>
        )
    }

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden group hover:bg-primary/5 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Nb الطلبات</CardTitle>
                    <Users className="h-4 w-4 text-primary opacity-30" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black tracking-tighter">{stats.totalOrders}</div>
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden group hover:bg-primary/5 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">إجمالي الكمية</CardTitle>
                    <Package className="h-4 w-4 text-primary opacity-30" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-primary tracking-tighter">
                        {stats.totalQuantity} 
                        <span className="text-xs text-muted-foreground font-bold ml-2 uppercase">pcs</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden group hover:bg-emerald-500/5 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-emerald-500 transition-colors">تم تسليمه</CardTitle>
                    <Truck className="h-4 w-4 text-emerald-500 opacity-30" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-emerald-500 tracking-tighter">
                        {stats.deliveredCount} 
                        <span className="text-[10px] text-muted-foreground font-black ml-2 uppercase">من أصل {stats.totalOrders}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
