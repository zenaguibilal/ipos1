'use client';

import { useMemo } from 'react';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Truck, Wallet, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';

interface BreadStatsProps {
    orders?: BreadOrderWithCustomer[];
    isLoading: boolean;
}

export function BreadStats({ orders, isLoading }: BreadStatsProps) {
    const stats = useMemo(() => {
        if (!orders) return { totalQuantity: 0, deliveredQuantity: 0, paidQuantity: 0, unpaidQuantity: 0, totalOrders: 0 };
        return {
            totalOrders: orders.length,
            totalQuantity: orders.reduce((sum, o) => sum + o.quantite, 0),
            deliveredQuantity: orders.filter(o => o.est_livre).reduce((sum, o) => sum + o.quantite, 0),
            paidQuantity: orders.filter(o => !!o.venteUuid).reduce((sum, o) => sum + o.quantite, 0),
            unpaidQuantity: orders.filter(o => !o.venteUuid).reduce((sum, o) => sum + o.quantite, 0),
        };
    }, [orders]);

    const deliveryPercentage = stats.totalQuantity > 0 
        ? Math.round((stats.deliveredQuantity / stats.totalQuantity) * 100) 
        : 0;

    if(isLoading) {
        return (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-[2rem] bg-card/50" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Production Card - Focused on Pieces */}
            <Card className="rounded-[2rem] border-none shadow-sm bg-card overflow-hidden group relative">
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                    <Package className="h-32 w-32 rotate-12" />
                </div>
                <CardContent className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <Package className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">الإنتاج المطلوب</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter leading-none">{stats.totalQuantity}</span>
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">قطعة</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">موزعة على {stats.totalOrders} شخصاً</p>
                    </div>
                </CardContent>
            </Card>

            {/* Delivery Progress Card */}
            <Card className="rounded-[2rem] border-none shadow-sm bg-card overflow-hidden group relative">
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                    <Truck className="h-32 w-32 -rotate-12" />
                </div>
                <CardContent className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
                            <Truck className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">تقدم التسليم</span>
                    </div>
                    <div className="flex items-end justify-between mb-2.5">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-emerald-500 leading-none">{stats.deliveredQuantity}</span>
                            <span className="text-xs font-bold text-muted-foreground/50">/ {stats.totalQuantity} قطعة</span>
                        </div>
                        <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black">
                            {deliveryPercentage}%
                        </div>
                    </div>
                    <Progress value={deliveryPercentage} className="h-2 bg-emerald-500/5 [&>div]:bg-emerald-500 rounded-full" />
                </CardContent>
            </Card>

            {/* Financial Status Card */}
            <Card className="rounded-[2rem] border-none shadow-sm bg-card overflow-hidden group relative">
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                    <Wallet className="h-32 w-32 rotate-6" />
                </div>
                <CardContent className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">الفوترة بالقطع</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 rounded-xl bg-muted/20 border border-transparent hover:border-border/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">قطع مدفوعة</span>
                            </div>
                            <span className="text-sm font-black font-mono">{stats.paidQuantity}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70">قيد الانتظار</span>
                            </div>
                            <span className="text-sm font-black font-mono text-amber-600">{stats.unpaidQuantity}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
