'use client';

import { useMemo } from 'react';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Users, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface BreadStatsProps {
    orders?: BreadOrderWithCustomer[];
    isLoading: boolean;
}

export function BreadStats({ orders, isLoading }: BreadStatsProps) {
    const stats = useMemo(() => {
        if (!orders) return { totalOrders: 0, totalQuantity: 0, paidOrders: 0, pendingOrders: 0 };
        const totalOrders = orders.length;
        const totalQuantity = orders.reduce((sum, o) => sum + o.quantite, 0);
        const paidOrders = orders.filter(o => !!o.venteUuid).length;
        const pendingOrders = totalOrders - paidOrders;
        
        return {
            totalOrders,
            totalQuantity,
            paidOrders,
            pendingOrders
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
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nb الطلبات</CardTitle>
                    <Users className="h-4 w-4 text-primary opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{stats.totalOrders}</div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">إجمالي الكمية</CardTitle>
                    <Package className="h-4 w-4 text-chart-primary opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-chart-primary">{stats.totalQuantity} <span className="text-[10px] text-muted-foreground font-bold">PCS</span></div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">قيد الانتظار</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-amber-500 opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-amber-500">{stats.pendingOrders}</div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">تم تحصيلها</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-emerald-500">{stats.paidOrders}</div>
                </CardContent>
            </Card>
        </div>
    );
}