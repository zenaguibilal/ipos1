'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { dashboardService } from '@/services/dashboard.service';
import {
    TrendingUp, Receipt, Users, CreditCard, Archive, RefreshCw,
    Star, ArrowUpRight, ArrowDownRight, ShoppingCart, Wallet, Percent, Plus, Package
} from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from '@/hooks/useLiveQuery';

const StatCard = React.memo(({
    title, value, icon: Icon, change, isLoading, href, colorClass = "text-primary bg-primary/10"
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    change?: number;
    isLoading: boolean;
    href?: string;
    colorClass?: string;
}) => {
    const isPositive = change !== undefined && change >= 0;

    const cardContent = (
        <Card className="h-full hover:shadow-md transition-all duration-300 border-none bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn("p-1.5 rounded-lg", colorClass)}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {isLoading ? (
                    <Skeleton className="h-7 w-20 rounded-md" />
                ) : (
                    <div className="text-lg font-black tracking-tighter text-foreground">
                        {value}
                    </div>
                )}
                {!isLoading && change !== undefined && (
                    <div className="mt-0.5 flex items-center gap-1">
                        <div className={cn(
                            'flex items-center text-[9px] font-black',
                            isPositive ? 'text-emerald-500' : 'text-rose-500'
                        )}>
                            {isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                            {Math.abs(change).toFixed(1)}%
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block transition-transform active:scale-95">{cardContent}</Link>;
    }
    return cardContent;
});
StatCard.displayName = 'StatCard';

export default function DashboardPage() {
    const { dateRange, setDate, isMounted } = useDateRange(29);

    const data = useLiveQuery(
        async () => {
            if (!isMounted || !dateRange?.from || !dateRange?.to) return null;
            return await dashboardService.getDashboardData(dateRange.from, dateRange.to);
        },
        [isMounted, dateRange]
    );

    const isLoading = data === undefined || !isMounted;

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <PageHeader title="Smart Pulse" description="Analyse dynamique de l'activité">
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-lg font-bold border-primary/20 text-primary h-8 px-3 text-xs">
                        <Link href="/sell"><Plus className="mr-1.5 h-3.5 w-3.5" /> Vendre</Link>
                    </Button>
                    <div className="h-6 w-px bg-border mx-1" />
                    <DateRangePicker date={dateRange} setDate={setDate} />
                </div>
            </PageHeader>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
                <StatCard title="Recettes" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} change={data?.stats.totalRevenueChange} href="/sales-history" colorClass="text-blue-500 bg-blue-500/10" />
                <StatCard title="Profit" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={Star} isLoading={isLoading} change={data?.stats.netProfitChange} colorClass="text-purple-500 bg-purple-500/10" />
                <StatCard title="Panier" value={formatCurrency(data?.stats.averageBasket ?? 0)} icon={ShoppingCart} isLoading={isLoading} colorClass="text-pink-500 bg-pink-500/10" />
                <StatCard title="Marge" value={`${(data?.stats.profitMargin ?? 0).toFixed(1)}%`} icon={Percent} isLoading={isLoading} colorClass="text-orange-500 bg-orange-500/10" />
                <StatCard title="Charges" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={Wallet} isLoading={isLoading} change={data?.stats.totalExpensesChange} href="/expenses" colorClass="text-rose-500 bg-rose-500/10" />
                <StatCard title="Dettes" value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} icon={CreditCard} isLoading={isLoading} href="/customers?status=has_debt" colorClass="text-amber-500 bg-amber-500/10" />
                <StatCard title="Stock" value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} icon={Archive} isLoading={isLoading} href="/products" colorClass="text-indigo-500 bg-indigo-500/10" />
                <StatCard title="Volume" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} change={data?.stats.saleCountChange} colorClass="text-emerald-500 bg-emerald-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 rounded-xl border-none bg-card/60 backdrop-blur-md shadow-sm">
                    <CardHeader className="p-5 pb-2">
                        <CardTitle className="text-base font-black tracking-tight">Flux de Revenus</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-50">Évolution temporelle</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 w-full p-5 pt-0">
                        {isLoading ? (
                            <Skeleton className="h-full w-full rounded-lg" />
                        ) : (
                            <ResponsiveContainer>
                                <AreaChart data={data?.salesByDay ?? []}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: fr })}
                                        fontSize={9} stroke="rgba(0,0,0,0.3)"
                                        fontWeight="700"
                                    />
                                    <YAxis fontSize={9} stroke="rgba(0,0,0,0.3)" fontWeight="700" tickFormatter={(v) => `${v/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '0.75rem', border: 'none', backgroundColor: 'hsl(var(--card))', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                        formatter={(v: number) => [formatCurrency(v), 'Ventes']}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-none bg-card/60 backdrop-blur-md shadow-sm">
                    <CardHeader className="p-5 pb-2">
                        <CardTitle className="text-base font-black tracking-tight">Activité Récente</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-50">Derniers flux</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 p-5 pt-0 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                        ) : data?.recentSales.map(s => (
                            <div key={s.uuid} className="flex items-center gap-2 p-2 rounded-lg bg-black/[0.02] border border-black/[0.03] hover:bg-primary/5 transition-all group">
                                <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                    <Receipt className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-[11px] truncate">{s.customerName}</p>
                                    <p className="text-[9px] text-muted-foreground font-medium uppercase">#{s.invoiceNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-[11px] text-blue-600">{formatCurrency(s.total)}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-xl border-none bg-card/60 backdrop-blur-md shadow-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Star className="h-3 w-3 text-purple-500" /> Best Sellers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4 pt-0">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)
                        ) : data?.topProducts.map((p, i) => (
                            <div key={p.productUuid} className="flex items-center justify-between text-[11px]">
                                <div className="min-w-0 pr-2">
                                    <p className="font-bold truncate">{p.name}</p>
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase">{p.quantitySold} units</p>
                                </div>
                                <p className="font-black text-primary">{formatCurrency(p.revenueGenerated)}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-none bg-card/60 backdrop-blur-md shadow-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Package className="h-3 w-3 text-rose-500" /> Stock Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 pt-0">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)
                        ) : data?.lowStockProducts.map(p => (
                            <div key={p.uuid} className="space-y-1">
                                <div className="flex justify-between text-[9px] font-black uppercase">
                                    <span className="truncate pr-2">{p.name}</span>
                                    <span className="text-rose-500">{p.quantity} {p.unite}</span>
                                </div>
                                <Progress value={(p.quantity / p.minStockLevel) * 100} className="h-1 bg-rose-500/10 [&>div]:bg-rose-500" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-none bg-card/60 backdrop-blur-md shadow-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Users className="h-3 w-3 text-emerald-500" /> VIP Clients
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4 pt-0">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)
                        ) : data?.topCustomers.map(c => (
                            <div key={c.customerUuid} className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="h-5 w-5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-[8px] uppercase">
                                        {c.name.charAt(0)}
                                    </div>
                                    <p className="font-bold truncate">{c.name}</p>
                                </div>
                                <p className="font-black text-emerald-600">{formatCurrency(c.totalSpent)}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
