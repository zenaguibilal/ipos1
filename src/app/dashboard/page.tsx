'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import type { RecentSale, RecentReturn, SalesByDay, DashboardData } from '@/lib/types';
import { dashboardService } from '@/services/dashboard.service';
import { 
    TrendingUp, 
    Receipt, 
    Undo2, 
    Users, 
    CreditCard, 
    Archive, 
    RefreshCw, 
    Star, 
    ArrowUpRight, 
    ArrowDownRight,
    ShoppingCart,
    Wallet,
    Percent,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useLiveQuery } from '@/hooks/useLiveQuery';

/**
 * بطاقة إحصائية متميزة (StatCard) مع دعم حالات التحميل ونسب التغيير.
 */
const StatCard = React.memo(({ title, value, icon: Icon, change, isLoading, href, positiveIsGood = true, suffix }: { 
    title: string, 
    value: string, 
    icon: React.ElementType, 
    change?: number, 
    isLoading: boolean, 
    href?: string, 
    positiveIsGood?: boolean, 
    suffix?: string 
}) => {
    const isPositive = change !== undefined && change >= 0;
    const isGood = positiveIsGood ? isPositive : !isPositive;

    const cardContent = (
        <Card className="app-card h-full bg-card/40 backdrop-blur-sm overflow-hidden group border-white/5 rounded-lg shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-primary transition-all duration-500 tracking-widest">{title}</CardTitle>
                <div className="p-3 rounded-2xl bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg transition-all duration-500">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                {isLoading ? (
                    <Skeleton className="h-10 w-32 bg-muted/20 rounded-lg" />
                ) : (
                    <div className="flex items-baseline gap-1">
                        <div className="text-2xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left tabular-nums">{value}</div>
                        {suffix && <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{suffix}</span>}
                    </div>
                )}
                {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-3 bg-muted/20 rounded-md" />
                ) : (
                    (change !== undefined && isFinite(change) && change !== 0) ? (
                        <div className="mt-3 flex items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-black tracking-tighter shadow-inner border",
                                isGood ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                            )}>
                                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {Math.abs(change).toFixed(1)}%
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-30 tracking-wide">vs période préc.</span>
                        </div>
                    ) : <div className="h-8"></div>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block transition-all hover:scale-[1.03] active:scale-95">{cardContent}</Link>;
    }

    return cardContent;
});
StatCard.displayName = 'StatCard';

/**
 * مخطط المبيعات والأرباح التفاعلي.
 */
const SalesChart = React.memo(({ data, isLoading }: { data: SalesByDay[], isLoading: boolean }) => (
    <Card className="app-card lg:col-span-2 bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden rounded-lg shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-white/5 p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle className="text-xl font-black tracking-tighter uppercase">Courbe de Flux</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase text-primary/50 tracking-widest">Recettes Nettes vs Rentabilité</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="h-[400px] w-full p-4 pt-8">
             {isLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center bg-muted/5 rounded-lg border border-dashed border-white/5">
                    <RefreshCw className="h-10 w-10 text-primary/20 animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase text-primary/20 tracking-[0.2em]">Synchronisation des flux...</p>
                </div>
            ) : (
            <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-tertiary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-tertiary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: fr })}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        fontWeight="900"
                        tickLine={false}
                        axisLine={false}
                        dy={15}
                    />
                    <YAxis 
                        tickFormatter={(val) => `${val / 1000}k`}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        fontWeight="900"
                        tickLine={false}
                        axisLine={false}
                        dx={-15}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--card) / 0.95)', 
                            backdropFilter: 'blur(16px)', 
                            borderRadius: '1.5rem', 
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                        formatter={(value: number, name: string) => [formatCurrency(value), name === 'total' ? "Recettes" : "Profit Brut"]}
                    />
                    <Area type="monotone" dataKey="total" name="total" stroke="hsl(var(--chart-primary))" strokeWidth={5} fillOpacity={1} fill="url(#colorRevenue)" isAnimationActive={false} />
                    <Area type="monotone" dataKey="profit" name="profit" stroke="hsl(var(--chart-tertiary))" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" strokeDasharray="10 5" isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
             )}
        </CardContent>
    </Card>
));
SalesChart.displayName = 'SalesChart';

/**
 * عرض الحركات الأخيرة (بيعات ومرتجعات).
 */
const RecentActivity = React.memo(({ sales, returns, isLoading }: { sales: RecentSale[], returns: RecentReturn[], isLoading: boolean }) => (
    <Card className="app-card bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden rounded-lg shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
            <CardTitle className="text-xl font-black tracking-tighter uppercase">Journal de Flux</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground/40 tracking-widest">Derniers mouvements certifiés</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
             {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={`skel-recent-${i}`} className="h-20 w-full rounded-2xl bg-muted/10" />)}
                </div>
            ) : (
                <div className="space-y-3">
                    {sales.length === 0 && returns.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                            <Sparkles className="h-12 w-12" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aucun flux détecté</p>
                        </div>
                    ) : (
                        <>
                            {sales.map(s => (
                                <Link href={`/sales-history?query=${s.invoiceNumber}`} key={`sale-act-${s.uuid}`} className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all duration-500 group shadow-inner">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-all">
                                        <Receipt className="h-5 w-5" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-sm tracking-tight truncate group-hover:text-primary transition-colors">{s.customerName}</p>
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{format(safeToDate(s.createdAt!), 'HH:mm')} • #{s.invoiceNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-base text-primary tracking-tighter tabular-nums">{formatCurrency(s.total)}</p>
                                    </div>
                                </Link>
                            ))}
                            {returns.map(r => (
                                <Link href={`/returns?query=${r.originalInvoiceNumber}`} key={`return-act-${r.uuid}`} className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5 border border-transparent hover:border-destructive/30 hover:bg-destructive/10 transition-all duration-500 group shadow-inner">
                                    <div className="p-3 rounded-2xl bg-destructive/10 text-destructive group-hover:scale-110 transition-all">
                                        <Undo2 className="h-5 w-5" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-sm tracking-tight truncate">{r.customerName}</p>
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{format(safeToDate(r.createdAt!), 'HH:mm')} • Retour Marchandise</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-base text-destructive tracking-tighter tabular-nums">-{formatCurrency(r.totalReturnValue)}</p>
                                    </div>
                                </Link>
                            ))}
                        </>
                    )}
                </div>
             )}
        </CardContent>
    </Card>
));
RecentActivity.displayName = 'RecentActivity';

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
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000 pb-20">
            <PageHeader title="Pilotage de Précision" description="Surveillance souveraine des flux de trésorerie et de la rentabilité Elite">
                <div className="flex items-center gap-4">
                    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-white/5 p-1 shadow-inner flex items-center">
                        <DateRangePicker date={dateRange} setDate={setDate} />
                    </div>
                </div>
            </PageHeader>

            {/* بطاقات الإحصائيات الرئيسية */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
                <StatCard title="Recettes Nettes" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} change={data?.stats.totalRevenueChange} href="/sales-history" />
                <StatCard title="Bénéfice Net" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={Star} isLoading={isLoading} change={data?.stats.netProfitChange} />
                <StatCard title="Panier Moyen" value={formatCurrency(data?.stats.averageBasket ?? 0)} icon={ShoppingCart} isLoading={isLoading} />
                <StatCard title="Marge de Flux" value={`${(data?.stats.profitMargin ?? 0).toFixed(1)}%`} icon={Percent} isLoading={isLoading} />
                <StatCard title="Total Charges" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={Wallet} isLoading={isLoading} change={data?.stats.totalExpensesChange} positiveIsGood={false} href="/expenses" />
                <StatCard title="Créances Clients" value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} icon={CreditCard} isLoading={isLoading} href="/customers?status=has_debt" />
                <StatCard title="Valeur Stock" value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} icon={Archive} isLoading={isLoading} href="/products" />
                <StatCard title="Volume Ventes" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} change={data?.stats.saleCountChange} />
            </div>

            {/* المخططات والنشاط */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SalesChart data={data?.salesByDay ?? []} isLoading={isLoading}/>
                <RecentActivity sales={data?.recentSales ?? []} returns={data?.recentReturns ?? []} isLoading={isLoading}/>
            </div>

            {/* قوائم التميز (أكثر المنتجات والعملاء مبيعاً) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="app-card bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden rounded-lg shadow-sm">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                        <CardTitle className="text-xl font-black tracking-tighter uppercase flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary"><Star className="h-5 w-5" /></div>
                            Best-Sellers Elite
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                        {isLoading ? [...Array(5)].map((_, i) => <Skeleton key={`skel-prod-${i}`} className="h-9 w-full rounded-2xl bg-muted/10" />) : 
                            data?.topProducts.length === 0 ? (
                                <p className="text-center py-10 text-[10px] font-bold uppercase opacity-20 tracking-widest">En attente de ventes</p>
                            ) : data?.topProducts.map((p, i) => (
                                <div key={`prod-list-${p.productUuid}`} className="flex items-center gap-5 group">
                                    <span className="text-xl font-black text-muted-foreground/20 w-8 tabular-nums">{(i + 1).toString().padStart(2, '0')}</span>
                                    <div className="flex-grow">
                                        <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors truncate">{p.name}</p>
                                        <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">{p.quantitySold} unités • {p.category}</span>
                                    </div>
                                    <p className="font-black text-sm tracking-tighter tabular-nums">{formatCurrency(p.revenueGenerated)}</p>
                                </div>
                            ))
                        }
                    </CardContent>
                </Card>

                <Card className="app-card bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden rounded-lg shadow-sm">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                        <CardTitle className="text-xl font-black tracking-tighter uppercase flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
                            Cercle des Clients
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                        {isLoading ? [...Array(5)].map((_, i) => <Skeleton key={`skel-cust-${i}`} className="h-9 w-full rounded-2xl bg-muted/10" />) : 
                            data?.topCustomers.length === 0 ? (
                                <p className="text-center py-10 text-[10px] font-bold uppercase opacity-20 tracking-widest">En attente de flux</p>
                            ) : data?.topCustomers.map((c, i) => (
                                <Link href={`/customers/detail?uuid=${c.customerUuid}`} key={`cust-list-${c.customerUuid}`} className="flex items-center gap-5 group">
                                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner border border-white/5">
                                        {c.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors truncate">{c.name}</p>
                                        <p className="text-[9px] font-black uppercase text-muted-foreground/40 mt-1 tracking-widest">Rang Elite #{i+1}</p>
                                    </div>
                                    <p className="font-black text-sm text-primary tabular-nums tracking-tighter">{formatCurrency(c.totalSpent)}</p>
                                </Link>
                            ))
                        }
                    </CardContent>
                </Card>

                <Card className="app-card bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden rounded-lg shadow-sm">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-4 text-amber-500">
                        <CardTitle className="text-xl font-black tracking-tighter uppercase flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Archive className="h-5 w-5" /></div>
                            Alertes Inventaire
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {isLoading ? [...Array(5)].map((_, i) => <Skeleton key={`skel-stock-${i}`} className="h-[70px] w-full rounded-xl bg-muted/10" />) : 
                            data?.lowStockProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-20">
                                    <Sparkles className="h-10 w-10 text-emerald-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Stocks Optimaux</p>
                                </div>
                            ) : data?.lowStockProducts.map(p => (
                                <div key={`stock-list-${p.uuid}`} className="space-y-3 p-3 rounded-xl bg-black/20 border border-white/5 group hover:border-amber-500/30 transition-all">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="truncate pr-4">{p.name}</span>
                                        <span className="text-amber-500 tabular-nums">{p.quantity} / {p.minStockLevel} {p.unite}</span>
                                    </div>
                                    <Progress value={Math.min(100, (p.quantity / (p.minStockLevel || 1)) * 100)} className="h-1.5 bg-muted/30 [&>div]:bg-amber-500 shadow-inner" />
                                </div>
                            ))
                        }
                    </CardContent>
                </Card>
            </div>

            {/* Footer الذكاء الاصطناعي للمراقبة */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4 shadow-inner relative overflow-hidden group">
                <Sparkles className="absolute -right-6 -top-6 h-32 w-32 text-primary/5 group-hover:opacity-20 transition-opacity duration-1000" />
                <div className="p-4 rounded-2xl bg-black/40 text-primary shadow-lg border border-white/5 relative z-10">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-2 relative z-10">
                    <p className="text-xs font-black uppercase text-primary tracking-widest">Intelligence Analytique iPOS Zen</p>
                    <p className="text-[11px] text-muted-foreground/70 font-medium leading-relaxed max-w-5xl uppercase tracking-wider italic">
                        Les calculs de rentabilité incluent désormais les amortissements liés aux retours marchandises et les frais logistiques. Votre marge nette est calculée sur la base du coût de revient (Landing Cost) réel indexé lors des réceptions.
                    </p>
                </div>
            </div>
        </div>
    );
}
