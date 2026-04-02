
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
    TrendingDown, 
    DollarSign, 
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
    ArrowRight
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
        <Card className="luxury-card h-full bg-card/40 backdrop-blur-xl overflow-hidden group border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
                <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-9 w-32 bg-muted/20" />
                ) : (
                    <div className="flex items-baseline gap-1">
                        <div className="text-2xl font-black tracking-tighter text-foreground">{value}</div>
                        {suffix && <span className="text-[10px] font-black text-muted-foreground uppercase">{suffix}</span>}
                    </div>
                )}
                {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-2 bg-muted/20" />
                ) : (
                    (change !== undefined && isFinite(change) && change !== 0) ? (
                        <div className="mt-2 flex items-center gap-1.5">
                            <div className={cn(
                                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-black tracking-tighter",
                                isGood ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                            )}>
                                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {Math.abs(change).toFixed(1)}%
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">vs. Préc.</span>
                        </div>
                    ) : <div className="h-6"></div>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">{cardContent}</Link>;
    }

    return cardContent;
};

const SalesChart = ({ data, isLoading }: { data: SalesByDay[], isLoading: boolean }) => (
    <Card className="luxury-card lg:col-span-2 bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-white/5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black tracking-tighter">Performance Financière</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest opacity-50">Volume des ventes & Bénéfices nets</CardDescription>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="h-80 w-full p-6">
             {isLoading ? (
                <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-2xl animate-pulse">
                    <RefreshCw className="h-8 w-8 text-primary/20 animate-spin" />
                </div>
            ) : (
            <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0}/>
                        </linearGradient>
                         <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: fr })}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis 
                        tickFormatter={(val) => `${val / 1000}k`}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                    />
                    <Tooltip 
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '1.25rem',
                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(value: number, name: string) => [formatCurrency(value), name === 'total' ? "Ventes" : 'Bénéfice']}
                    />
                    <Area type="monotone" dataKey="total" name="total" stroke="hsl(var(--chart-primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="profit" name="profit" stroke="hsl(var(--chart-quaternary))" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
            </ResponsiveContainer>
             )}
        </CardContent>
    </Card>
);

const RecentActivity = ({ sales, returns, isLoading }: { sales: RecentSale[], returns: RecentReturn[], isLoading: boolean }) => (
    <Card className="luxury-card bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-white/5">
            <CardTitle className="text-lg font-black tracking-tight">Flux Récents</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-40">Dernières opérations de caisse</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-[340px] overflow-y-auto custom-scrollbar">
             {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-muted/20" />)}
                </div>
            ) : (
                <div className="space-y-3">
                    {sales.length === 0 && returns.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground/30 font-bold text-xs uppercase tracking-widest">Aucun flux enregistré</div>
                    ) : (
                        <>
                            {sales.map(s => (
                                <Link href={`/sales-history?query=${s.invoiceNumber}`} key={s.uuid} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-muted/40 transition-all group">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                        <Receipt className="h-4 w-4" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{s.customerName}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase">{format(safeToDate(s.createdAt!), 'HH:mm')} • #{s.invoiceNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-sm text-primary">{formatCurrency(s.total)}</p>
                                    </div>
                                </Link>
                            ))}
                            {returns.map(r => (
                                <Link href={`/returns?query=${r.originalInvoiceNumber}`} key={r.uuid} className="flex items-center gap-3 p-3 rounded-2xl bg-destructive/5 border border-transparent hover:border-destructive/20 hover:bg-destructive/10 transition-all group">
                                    <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive group-hover:scale-110 transition-transform">
                                        <Undo2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-sm truncate">{r.customerName}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase">{format(safeToDate(r.createdAt!), 'HH:mm')} • Retour</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-sm text-destructive">-{formatCurrency(r.totalReturnValue)}</p>
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/sell" className="group">
            <div className="p-4 rounded-[2rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-between group-hover:scale-[1.02] transition-all">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-white/20">
                        <ShoppingCart className="h-5 w-5" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest">Vendre</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </div>
        </Link>
        <Link href="/products" className="group">
            <div className="p-4 rounded-[2rem] bg-card border border-white/5 flex items-center justify-between group-hover:scale-[1.02] group-hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                    <div className="p-2.5 rounded-2xl bg-muted/50 group-hover:bg-primary/10">
                        <PlusCircle className="h-5 w-5" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest">Produit</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </div>
        </Link>
        <Link href="/expenses" className="group">
            <div className="p-4 rounded-[2rem] bg-card border border-white/5 flex items-center justify-between group-hover:scale-[1.02] group-hover:border-destructive/20 transition-all">
                <div className="flex items-center gap-3 text-muted-foreground group-hover:text-destructive transition-colors">
                    <div className="p-2.5 rounded-2xl bg-muted/50 group-hover:bg-destructive/10">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest">Charge</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </div>
        </Link>
        <Link href="/customers" className="group">
            <div className="p-4 rounded-[2rem] bg-card border border-white/5 flex items-center justify-between group-hover:scale-[1.02] group-hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                    <div className="p-2.5 rounded-2xl bg-muted/50 group-hover:bg-primary/10">
                        <Users className="h-5 w-5" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest">Client</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
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
        <div className="p-4 sm:p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="iPOS Luxury"
                description="Pilotage intelligent & Analyse de rentabilité"
            >
                <div className="flex items-center gap-3">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-2xl h-12 w-12 border-white/10 bg-card hover:bg-muted"
                        onClick={() => dateRange?.from && dateRange?.to && fetchData(dateRange.from, dateRange.to)}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-5 w-5 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <QuickNav />
            
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                <StatCard title="C.A Total" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} href="/sales-history" change={data?.stats.totalRevenueChange} />
                <StatCard title="Bénéfice Net" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={Star} isLoading={isLoading} change={data?.stats.netProfitChange} />
                <StatCard title="Panier Moyen" value={formatCurrency(data?.stats.averageBasket ?? 0)} icon={ShoppingCart} isLoading={isLoading} />
                <StatCard title="Marge Nette" value={`${(data?.stats.profitMargin ?? 0).toFixed(1)}%`} icon={Percent} isLoading={isLoading} />
                <StatCard title="Dépenses" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={TrendingDown} isLoading={isLoading} href="/expenses" change={data?.stats.totalExpensesChange} positiveIsGood={false} />
                <StatCard title="Créances" value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} icon={CreditCard} isLoading={isLoading} href="/customers?status=has_debt" />
                <StatCard title="Valeur Stock" value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} icon={Archive} isLoading={isLoading} href="/products" />
                <StatCard title="Ventes" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} href="/sales-history" change={data?.stats.saleCountChange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <SalesChart data={data?.salesByDay ?? []} isLoading={isLoading}/>
                <RecentActivity sales={data?.recentSales ?? []} returns={data?.recentReturns ?? []} isLoading={isLoading}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Products Card - Luxury Style */}
                <Card className="luxury-card bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-white/5">
                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                            <Star className="h-5 w-5 text-primary" />
                            Champions de Vente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => <Skeleton className="h-14 w-full rounded-2xl bg-muted/20" />)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data?.topProducts.map((p, i) => (
                                    <div key={p.productUuid} className="flex items-center gap-4 group cursor-default">
                                        <span className="text-xl font-black text-muted-foreground/30 w-6">{i + 1}</span>
                                        <div className="flex-grow">
                                            <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{p.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{p.quantitySold} vendus</span>
                                                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                <span className="text-[10px] font-bold text-primary">{p.category}</span>
                                            </div>
                                        </div>
                                        <div className="font-black text-sm text-foreground">{formatCurrency(p.revenueGenerated)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Customers Card */}
                <Card className="luxury-card bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-white/5">
                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Élite Clients
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => <Skeleton className="h-14 w-full rounded-2xl bg-muted/20" />)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data?.topCustomers.map((c, i) => (
                                    <Link href={`/customers/${c.customerUuid}`} key={c.customerUuid} className="flex items-center gap-4 group">
                                        <div className="h-10 w-10 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground font-black group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                            {c.name.substring(0, 1)}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-sm tracking-tight group-hover:underline">{c.name}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Rang #{i+1}</p>
                                        </div>
                                        <div className="font-black text-sm text-primary">{formatCurrency(c.totalSpent)}</div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Low Stock Alerts */}
                <Card className="luxury-card bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-white/5">
                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2 text-amber-500">
                            <Archive className="h-5 w-5" />
                            Alertes Réapprovisionnement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => <Skeleton className="h-14 w-full rounded-2xl bg-muted/20" />)}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {data?.lowStockProducts.map(p => (
                                    <div key={p.uuid} className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="truncate pr-4">{p.name}</span>
                                            <span className="text-amber-500 font-black">{p.quantity} / {p.minStockLevel}</span>
                                        </div>
                                        <Progress value={(p.quantity / p.minStockLevel) * 100} className="h-1.5 bg-muted/30 [&>div]:bg-amber-500 shadow-sm" />
                                    </div>
                                ))}
                                {data?.lowStockProducts.length === 0 && (
                                    <div className="py-12 text-center flex flex-col items-center gap-3 opacity-30">
                                        <Star className="h-8 w-8 text-primary" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Stock Optimal</p>
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
