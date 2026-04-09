'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { dashboardService } from '@/services/dashboard.service';
import {
    TrendingUp, Receipt, Undo2, Users, CreditCard, Archive, RefreshCw,
    Star, ArrowUpRight, ArrowDownRight, ShoppingCart, Wallet, Percent, Sparkles, Plus, Package
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
        <Card className="h-full hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn("p-2 rounded-xl", colorClass)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-24 rounded-lg" />
                ) : (
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </div>
                )}
                {!isLoading && change !== undefined && (
                    <div className="mt-1 flex items-center gap-1.5">
                        <div className={cn(
                            'flex items-center text-xs font-bold',
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                        )}>
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(change).toFixed(1)}%
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">vs période préc.</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block group">{cardContent}</Link>;
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
        <div className="p-4 sm:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <PageHeader title="Tableau de Bord" description="Aperçu analytique de votre performance commerciale">
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-xl font-bold border-primary/20 text-primary">
                        <Link href="/sell"><Plus className="mr-2 h-4 w-4" /> Nouvelle Vente</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-xl font-bold border-secondary/20 text-secondary">
                        <Link href="/stock/intake"><Package className="mr-2 h-4 w-4" /> Stock</Link>
                    </Button>
                    <div className="h-8 w-px bg-border mx-2" />
                    <DateRangePicker date={dateRange} setDate={setDate} />
                </div>
            </PageHeader>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                <StatCard title="Recettes" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} change={data?.stats.totalRevenueChange} href="/sales-history" colorClass="text-blue-600 bg-blue-50" />
                <StatCard title="Profit Net" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={Star} isLoading={isLoading} change={data?.stats.netProfitChange} colorClass="text-purple-600 bg-purple-50" />
                <StatCard title="Panier Moy." value={formatCurrency(data?.stats.averageBasket ?? 0)} icon={ShoppingCart} isLoading={isLoading} colorClass="text-pink-600 bg-pink-50" />
                <StatCard title="Marge" value={`${(data?.stats.profitMargin ?? 0).toFixed(1)}%`} icon={Percent} isLoading={isLoading} colorClass="text-orange-600 bg-orange-50" />
                <StatCard title="Dépenses" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={Wallet} isLoading={isLoading} change={data?.stats.totalExpensesChange} href="/expenses" colorClass="text-rose-600 bg-rose-50" />
                <StatCard title="Dettes Client" value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} icon={CreditCard} isLoading={isLoading} href="/customers?status=has_debt" colorClass="text-amber-600 bg-amber-50" />
                <StatCard title="Valeur Stock" value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} icon={Archive} isLoading={isLoading} href="/products" colorClass="text-indigo-600 bg-indigo-50" />
                <StatCard title="Ventes" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} change={data?.stats.saleCountChange} colorClass="text-emerald-600 bg-emerald-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Évolution des Ventes</CardTitle>
                        <CardDescription>Flux de revenus sur la période sélectionnée</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 w-full">
                        {isLoading ? (
                            <Skeleton className="h-full w-full rounded-xl" />
                        ) : (
                            <ResponsiveContainer>
                                <AreaChart data={data?.salesByDay ?? []}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: fr })}
                                        fontSize={10} stroke="hsl(var(--muted-foreground))"
                                    />
                                    <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(v: number) => [formatCurrency(v), 'Ventes']}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Activité Récente</CardTitle>
                        <CardDescription>Derniers mouvements de caisse</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                        ) : data?.recentSales.map(s => (
                            <div key={s.uuid} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <Receipt className="h-5 w-5" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-sm truncate">{s.customerName}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{format(safeToDate(s.createdAt!), 'HH:mm')} • #{s.invoiceNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-blue-600">{formatCurrency(s.total)}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Best Sellers */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Star className="h-4 w-4 text-purple-500" /> Top Produits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                        ) : data?.topProducts.map((p, i) => (
                            <div key={p.productUuid} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-muted-foreground/40 w-4">{i+1}</span>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-xs truncate">{p.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{p.quantitySold} unités vendues</p>
                                </div>
                                <p className="font-bold text-xs">{formatCurrency(p.revenueGenerated)}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Stock Alerts */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-500" /> Alertes Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                        ) : data?.lowStockProducts.map(p => (
                            <div key={p.uuid} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="truncate pr-2">{p.name}</span>
                                    <span className="text-rose-600">{p.quantity} {p.unite}</span>
                                </div>
                                <Progress value={(p.quantity / p.minStockLevel) * 100} className="h-1.5 bg-rose-100" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Top Customers */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-500" /> Meilleurs Clients
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                        ) : data?.topCustomers.map(c => (
                            <div key={c.customerUuid} className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                                    {c.name.charAt(0)}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-xs truncate">{c.name}</p>
                                </div>
                                <p className="font-bold text-xs text-emerald-600">{formatCurrency(c.totalSpent)}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
