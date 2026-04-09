'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { dashboardService } from '@/services/dashboard.service';
import {
    TrendingUp, Receipt, Star, ArrowUpRight, ArrowDownRight, 
    ShoppingCart, Wallet, Percent, Plus, Archive, CreditCard, Clock
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
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
        <Card className="h-full hover:shadow-md transition-all duration-300 border bg-white/80 backdrop-blur-sm shadow-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
                <CardTitle className="text-[9px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                    {title}
                </CardTitle>
                <div className={cn("p-1.5 rounded-lg transition-transform group-hover:scale-110", colorClass)}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                {isLoading ? (
                    <Skeleton className="h-6 w-16 rounded-md" />
                ) : (
                    <div className="text-lg font-black tracking-tighter text-foreground">
                        {value}
                    </div>
                )}
                {!isLoading && change !== undefined && (
                    <div className="mt-0.5 flex items-center gap-1">
                        <div className={cn(
                            'flex items-center text-[8px] font-black',
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

    if (href) return <Link href={href} className="block transition-transform active:scale-95">{cardContent}</Link>;
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
        <div className="p-3 sm:p-4 space-y-3 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <PageHeader title="Tableau de Bord" description="Analytique Smart Retail" className="mb-1">
                <div className="flex items-center gap-2">
                    <Button asChild size="sm" className="rounded-lg font-bold h-8 text-[10px] uppercase tracking-tighter bg-primary hover:bg-primary/90 shadow-sm">
                        <Link href="/sell"><Plus className="mr-1.5 h-3 w-3" /> Nouvelle Vente</Link>
                    </Button>
                    <div className="h-6 w-px bg-border mx-1" />
                    <DateRangePicker date={dateRange} setDate={setDate} />
                </div>
            </PageHeader>

            <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
                <StatCard title="Recettes" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} change={data?.stats.totalRevenueChange} href="/sales-history" colorClass="text-blue-500 bg-blue-50" />
                <StatCard title="Profit Net" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={Star} isLoading={isLoading} change={data?.stats.netProfitChange} colorClass="text-purple-500 bg-purple-50" />
                <StatCard title="Panier Moy." value={formatCurrency(data?.stats.averageBasket ?? 0)} icon={ShoppingCart} isLoading={isLoading} colorClass="text-pink-500 bg-pink-50" />
                <StatCard title="Marge" value={`${(data?.stats.profitMargin ?? 0).toFixed(1)}%`} icon={Percent} isLoading={isLoading} colorClass="text-orange-500 bg-orange-50" />
                <StatCard title="Charges" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={Wallet} isLoading={isLoading} change={data?.stats.totalExpensesChange} href="/expenses" colorClass="text-rose-500 bg-rose-50" />
                <StatCard title="Dettes Client" value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} icon={CreditCard} isLoading={isLoading} href="/customers?status=has_debt" colorClass="text-amber-500 bg-amber-50" />
                <StatCard title="Valeur Stock" value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} icon={Archive} isLoading={isLoading} href="/products" colorClass="text-indigo-500 bg-indigo-50" />
                <StatCard title="Ventes" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} change={data?.stats.saleCountChange} colorClass="text-emerald-500 bg-emerald-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <Card className="lg:col-span-2 rounded-xl border bg-white/80 shadow-sm overflow-hidden">
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5" /> Évolution des Flux
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 w-full p-4 pt-2">
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
                                    <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: fr })} fontSize={8} fontWeight="bold" axisLine={false} tickLine={false} />
                                    <YAxis fontSize={8} fontWeight="bold" tickFormatter={(v) => `${v/1000}k`} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-xl border bg-white/80 shadow-sm flex flex-col overflow-hidden">
                    <CardHeader className="p-4 pb-2 border-b bg-muted/10">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" /> Flux Récents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-2 pt-2 space-y-1">
                        {isLoading ? (
                            [...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
                        ) : data?.recentSales.map(s => (
                            <div key={s.uuid} className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10 group">
                                <div className="h-8 w-8 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Receipt className="h-4 w-4" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-[10px] truncate leading-tight">{s.customerName}</p>
                                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter opacity-50">#{s.invoiceNumber}</p>
                                </div>
                                <p className="font-black text-[11px] text-primary">{formatCurrency(s.total)}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
