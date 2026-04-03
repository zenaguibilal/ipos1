'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import type { DashboardData, RecentSale, RecentReturn, SalesByDay } from '@/lib/types';
import { dashboardService } from '@/services/dashboard.service';
import { toast } from 'sonner';
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
    PlusCircle,
    Wallet,
    Percent,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const StatCard = ({ title, value, icon: Icon, change, isLoading, href, positiveIsGood = true, suffix }: { title: string, value: string, icon: React.ElementType, change?: number, isLoading: boolean, href?: string, positiveIsGood?: boolean, suffix?: string }) => {
    const isPositive = change !== undefined && change >= 0;
    const isGood = positiveIsGood ? isPositive : !isPositive;

    const cardContent = (
        <Card className="luxury-card h-full bg-card/40 backdrop-blur-2xl overflow-hidden group border-white/5 rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground group-hover:text-primary transition-all duration-500">{title}</CardTitle>
                <div className="p-3 rounded-2xl bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                {isLoading ? (
                    <Skeleton className="h-10 w-32 bg-muted/20 rounded-lg" />
                ) : (
                    <div className="flex items-baseline gap-1">
                        <div className="text-3xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left">{value}</div>
                        {suffix && <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">{suffix}</span>}
                    </div>
                )}
                {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-3 bg-muted/20 rounded-md" />
                ) : (
                    (change !== undefined && isFinite(change) && change !== 0) ? (
                        <div className="mt-3 flex items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-black tracking-tighter shadow-sm",
                                isGood ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                            )}>
                                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {Math.abs(change).toFixed(1)}%
                            </div>
                            <span className="text-[9px] font-black text-muted-foreground uppercase opacity-30 tracking-widest">Évolution</span>
                        </div>
                    ) : <div className="h-8"></div>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block transition-all hover:scale-[1.03] active:scale-97">{cardContent}</Link>;
    }

    return cardContent;
};

const SalesChart = ({ data, isLoading }: { data: SalesByDay[], isLoading: boolean }) => (
    <Card className="luxury-card lg:col-span-2 bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20 transition-transform duration-700 hover:rotate-12">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tighter">Courbe de Croissance</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Flux de revenus & Bénéfice net</CardDescription>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <div className="h-2 w-2 rounded-full bg-primary" /> Recettes
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <div className="h-2 w-2 rounded-full border border-primary/50 bg-transparent" /> Profit
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="h-96 w-full p-8">
             {isLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center bg-muted/5 rounded-[2rem] border border-dashed border-white/5">
                    <RefreshCw className="h-10 w-10 text-primary/20 animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20">Analyse des données...</p>
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
                            <stop offset="5%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0}/>
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
                            backgroundColor: 'hsl(var(--card) / 0.9)',
                            backdropFilter: 'blur(16px)',
                            borderColor: 'hsl(var(--border) / 0.5)',
                            borderRadius: '1.5rem',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        formatter={(value: number, name: string) => [formatCurrency(value), name === 'total' ? "Ventes Totales" : 'Bénéfice Net']}
                    />
                    <Area type="monotone" dataKey="total" name="total" stroke="hsl(var(--chart-primary))" strokeWidth={5} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="profit" name="profit" stroke="hsl(var(--chart-quaternary))" strokeWidth={3} strokeDasharray="10 10" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
            </ResponsiveContainer>
             )}
        </CardContent>
    </Card>
);

const RecentActivity = ({ sales, returns, isLoading }: { sales: RecentSale[], returns: RecentReturn[], isLoading: boolean }) => (
    <Card className="luxury-card bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
            <CardTitle className="text-2xl font-black tracking-tighter">Flux en Temps Réel</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Derniers mouvements de caisse</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
             {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={`skel-recent-${i}`} className="h-20 w-full rounded-3xl bg-muted/10" />)}
                </div>
            ) : (
                <div className="space-y-3">
                    {sales.length === 0 && returns.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                            <Sparkles className="h-12 w-12" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">En attente de flux</p>
                        </div>
                    ) : (
                        <>
                            {sales.map(s => (
                                <Link href={`/sales-history?query=${s.invoiceNumber}`} key={`sale-act-${s.uuid}`} className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-muted/20 border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all duration-500 group">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                                        <Receipt className="h-5 w-5" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-black text-sm tracking-tight truncate group-hover:text-primary transition-colors">{s.customerName}</p>
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{format(safeToDate(s.createdAt!), 'HH:mm')} • #{s.invoiceNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-base text-primary tracking-tighter">{formatCurrency(s.total)}</p>
                                    </div>
                                </Link>
                            ))}
                            {returns.map(r => (
                                <Link href={`/returns?query=${r.originalInvoiceNumber}`} key={`return-act-${r.uuid}`} className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-destructive/5 border border-transparent hover:border-destructive/30 hover:bg-destructive/10 transition-all duration-500 group">
                                    <div className="p-3 rounded-2xl bg-destructive/10 text-destructive group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner">
                                        <Undo2 className="h-5 w-5" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-black text-sm tracking-tight truncate">{r.customerName}</p>
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{format(safeToDate(r.createdAt!), 'HH:mm')} • Retour Client</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-base text-destructive tracking-tighter">-{formatCurrency(r.totalReturnValue)}</p>
                                    </div>
                                </Link>
                            ))}
                        </>
                    )}
                </div>
             )}
        </CardContent>
    </Card>
);

const QuickNav = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Link href="/sell" className="group">
            <div className="p-6 rounded-[2.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 flex items-center justify-between group-hover:scale-[1.05] group-hover:-rotate-1 transition-all duration-500">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/20 shadow-inner">
                        <ShoppingCart className="h-6 w-6" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Caisse POS</span>
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
            </div>
        </Link>
        <Link href="/products" className="group">
            <div className="p-6 rounded-[2.5rem] bg-card border border-white/5 flex items-center justify-between group-hover:scale-[1.05] group-hover:rotate-1 group-hover:border-primary/30 transition-all duration-500 shadow-2xl">
                <div className="flex items-center gap-4 text-muted-foreground group-hover:text-primary transition-colors">
                    <div className="p-3 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors shadow-inner">
                        <PlusCircle className="h-6 w-6" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Catalogue</span>
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
            </div>
        </Link>
        <Link href="/expenses" className="group">
            <div className="p-6 rounded-[2.5rem] bg-card border border-white/5 flex items-center justify-between group-hover:scale-[1.05] group-hover:-rotate-1 group-hover:border-destructive/30 transition-all duration-500 shadow-2xl">
                <div className="flex items-center gap-4 text-muted-foreground group-hover:text-destructive transition-colors">
                    <div className="p-3 rounded-2xl bg-muted/50 group-hover:bg-destructive/10 transition-colors shadow-inner">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Dépenses</span>
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
            </div>
        </Link>
        <Link href="/customers" className="group">
            <div className="p-6 rounded-[2.5rem] bg-card border border-white/5 flex items-center justify-between group-hover:scale-[1.05] group-hover:border-primary/30 transition-all duration-500 shadow-2xl">
                <div className="flex items-center gap-4 text-muted-foreground group-hover:text-primary transition-colors">
                    <div className="p-3 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors shadow-inner">
                        <Users className="h-6 w-6" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Clientèle</span>
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
            </div>
        </Link>
    </div>
);

export default function DashboardPage() {
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchData = useCallback(async (from: Date, to: Date) => {
        setIsLoading(true);
        try {
            const dashboardData = await dashboardService.getDashboardData(from, to);
            setData(dashboardData);
        } catch (error: any) {
            toast.error("Échec du chargement du Dashboard.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isMounted && dateRange?.from && dateRange?.to) {
            fetchData(dateRange.from, dateRange.to);
        }
    }, [dateRange, isMounted, fetchData]);

    return (
        <div className="p-6 sm:p-10 space-y-12 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Tableau de Bord Elite"
                description="Pilotage intelligent & Analyse de rentabilité en temps réel"
            >
                <div className="flex items-center gap-4">
                    <div className="p-1 bg-muted/30 rounded-2xl border border-white/5 shadow-inner">
                        <DateRangePicker date={dateRange} setDate={setDate} />
                    </div>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-2xl h-14 w-14 border-white/5 bg-card hover:bg-primary/10 group transition-all duration-500"
                        onClick={() => dateRange?.from && dateRange?.to && fetchData(dateRange.from, dateRange.to)}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-6 w-6 text-primary transition-all duration-1000", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <QuickNav />
            
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                <StatCard title="Chiffre d'Affaires" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} href="/sales-history" change={data?.stats.totalRevenueChange} />
                <StatCard title="Bénéfice Net" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={Star} isLoading={isLoading} change={data?.stats.netProfitChange} />
                <StatCard title="Panier Moyen" value={formatCurrency(data?.stats.averageBasket ?? 0)} icon={ShoppingCart} isLoading={isLoading} />
                <StatCard title="Marge Nette" value={`${(data?.stats.profitMargin ?? 0).toFixed(1)}%`} icon={Percent} isLoading={isLoading} />
                <StatCard title="Charges Totales" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={TrendingUp} isLoading={isLoading} href="/expenses" change={data?.stats.totalExpensesChange} positiveIsGood={false} />
                <StatCard title="Créances Clients" value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} icon={CreditCard} isLoading={isLoading} href="/customers?status=has_debt" />
                <StatCard title="Valeur Stock" value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} icon={Archive} isLoading={isLoading} href="/products" />
                <StatCard title="Vol. Ventes" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} href="/sales-history" change={data?.stats.saleCountChange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <SalesChart data={data?.salesByDay ?? []} isLoading={isLoading}/>
                <RecentActivity sales={data?.recentSales ?? []} returns={data?.recentReturns ?? []} isLoading={isLoading}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Top Products - Jewel Style */}
                <Card className="luxury-card bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
                        <CardTitle className="text-xl font-black tracking-tighter flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary"><Star className="h-5 w-5" /></div>
                            Champions des Ventes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {isLoading ? (
                            <div className="space-y-6">
                                {[...Array(5)].map((_, i) => <Skeleton key={`skel-prod-${i}`} className="h-16 w-full rounded-2xl bg-muted/10" />)}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {data?.topProducts.map((p, i) => (
                                    <div key={`prod-list-${p.productUuid || i}`} className="flex items-center gap-5 group cursor-default">
                                        <span className="text-2xl font-black text-muted-foreground/20 w-8 group-hover:text-primary/40 transition-colors">0{i + 1}</span>
                                        <div className="flex-grow">
                                            <p className="font-black text-sm tracking-tight group-hover:text-primary transition-colors">{p.name}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{p.quantitySold} unités vendues</span>
                                                <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                                                <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{p.category}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm text-foreground tracking-tighter">{formatCurrency(p.revenueGenerated)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Elite Customers */}
                <Card className="luxury-card bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
                        <CardTitle className="text-xl font-black tracking-tighter flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
                            Clientèle Élite
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {isLoading ? (
                            <div className="space-y-6">
                                {[...Array(5)].map((_, i) => <Skeleton key={`skel-cust-${i}`} className="h-16 w-full rounded-2xl bg-muted/20" />)}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {data?.topCustomers.map((c, i) => (
                                    <Link href={`/customers/${c.customerUuid}`} key={`cust-list-${c.customerUuid || i}`} className="flex items-center gap-5 group">
                                        <div className="h-12 w-12 rounded-[1.25rem] bg-muted/50 border border-white/5 flex items-center justify-center text-muted-foreground font-black group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                                            {c.name.substring(0, 1)}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-black text-sm tracking-tight group-hover:text-primary transition-colors underline-offset-4 decoration-primary/20">{c.name}</p>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Rang National #{i+1}</p>
                                        </div>
                                        <div className="font-black text-sm text-primary tracking-tighter">{formatCurrency(c.totalSpent)}</div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Inventory Alerts - Amber Focus */}
                <Card className="luxury-card bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
                        <CardTitle className="text-xl font-black tracking-tighter flex items-center gap-3 text-amber-500">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Archive className="h-5 w-5" /></div>
                            Alertes Stocks
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {isLoading ? (
                            <div className="space-y-6">
                                {[...Array(5)].map((_, i) => <Skeleton key={`skel-alert-${i}`} className="h-16 w-full rounded-2xl bg-muted/10" />)}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {data?.lowStockProducts.map((p, i) => (
                                    <div key={`alert-list-${p.uuid || i}`} className="space-y-3 group">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.15em]">
                                            <span className="truncate pr-4 group-hover:text-amber-500 transition-colors">{p.name}</span>
                                            <span className="text-amber-500 font-black bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">{p.quantity} / {p.minStockLevel}</span>
                                        </div>
                                        <Progress value={(p.quantity / p.minStockLevel) * 100} className="h-2 bg-muted/30 [&>div]:bg-gradient-to-r [&>div]:from-amber-600 [&>div]:to-amber-400 shadow-inner rounded-full" />
                                    </div>
                                ))}
                                {data?.lowStockProducts.length === 0 && (
                                    <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                                        <div className="p-6 rounded-full bg-emerald-500/10">
                                            <Archive className="h-12 w-12 text-emerald-500" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Inventaire Optimal</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
