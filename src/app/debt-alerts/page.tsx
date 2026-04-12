'use client';

import { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    BellRing, 
    MessageCircle, 
    Calendar, 
    ChevronRight,
    Search,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    PhoneCall,
    Info,
    Clock,
    ShieldAlert,
    History,
    TrendingUp,
    FileText,
    RefreshCw
} from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn, FINANCIAL_EPSILON } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { startOfMonth, differenceInDays, subMonths, setDate as fnsSetDate, lastDayOfMonth } from 'date-fns';
import { Progress } from '@/components/ui/progress';

interface DebtAlertItem extends Customer {
    daysPastSettlement: number;
    severity: 'critical' | 'warning';
    isLegacy: boolean;
    creditUsagePercent: number;
    riskScore: number;
}

export default function DebtAlertsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearch = useDeferredValue(searchQuery);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const alerts = useLiveQuery(async (): Promise<DebtAlertItem[]> => {
        try {
            const now = new Date();
            const firstOfThisMonth = startOfMonth(now);
            
            const debtors = await db.customers
                .where('outstandingBalance')
                .above(FINANCIAL_EPSILON)
                .toArray();

            if (debtors.length === 0) return [];

            const unpaidSales = await db.sales
                .where('paymentStatus')
                .anyOf(['unpaid', 'partial'])
                .toArray();

            const debtAgeMap = new Map<string, Date>();
            for (const sale of unpaidSales) {
                if (!sale.customerUuid || !sale.createdAt) continue;
                const saleDate = new Date(sale.createdAt);
                const existing = debtAgeMap.get(sale.customerUuid);
                if (!existing || saleDate < existing) {
                    debtAgeMap.set(sale.customerUuid, saleDate);
                }
            }

            return debtors
                .map(customer => {
                    const oldestDebtDate = debtAgeMap.get(customer.uuid);
                    const creditLimit = customer.creditLimit || 0;
                    
                    const creditUsagePercent = creditLimit > 0 
                        ? (customer.outstandingBalance / creditLimit) * 100 
                        : (customer.outstandingBalance > 0 ? 100 : 0);
                    
                    let delaySeverity = 0;
                    if (customer.settlementDay) {
                        const endOfCurrentMonth = lastDayOfMonth(now);
                        const safeSettlementDay = Math.min(Math.max(1, customer.settlementDay), endOfCurrentMonth.getDate());
                        let targetDate = fnsSetDate(new Date(now), safeSettlementDay);
                        
                        if (now.getDate() < safeSettlementDay) {
                            const lastMonth = subMonths(now, 1);
                            const safeLastMonthDay = Math.min(customer.settlementDay, lastDayOfMonth(lastMonth).getDate());
                            targetDate = fnsSetDate(lastMonth, safeLastMonthDay);
                        }
                        delaySeverity = Math.max(0, differenceInDays(now, targetDate));
                    } else if (oldestDebtDate) {
                        delaySeverity = Math.max(0, differenceInDays(now, oldestDebtDate));
                    }

                    const isLegacy = oldestDebtDate ? oldestDebtDate < firstOfThisMonth : false;
                    const isHighlyCritical = creditUsagePercent > 110 || delaySeverity > 15 || (isLegacy && delaySeverity > 0);

                    const riskScore = (Math.min(200, creditUsagePercent) * 0.6) + (delaySeverity * 4.0);

                    return {
                        ...customer,
                        daysPastSettlement: isNaN(delaySeverity) ? 0 : delaySeverity,
                        severity: isHighlyCritical ? 'critical' : 'warning',
                        isLegacy,
                        creditUsagePercent: isNaN(creditUsagePercent) ? 0 : creditUsagePercent,
                        riskScore: isNaN(riskScore) ? 0 : riskScore
                    };
                })
                .filter(a => a.daysPastSettlement > 0 || a.creditUsagePercent > 100)
                .sort((a, b) => b.riskScore - a.riskScore);
        } catch (error) {
            console.error("Critical Debt Query Error:", error);
            return [];
        }
    }, []);

    const filteredAlerts = useMemo(() => {
        if (!alerts) return [];
        const q = deferredSearch.toLowerCase().trim();
        if (!q) return alerts;
        return alerts.filter(customer => 
            customer.firstName.toLowerCase().includes(q) || 
            customer.lastName.toLowerCase().includes(q) ||
            customer.phone?.includes(q)
        );
    }, [alerts, deferredSearch]);

    const criticalCount = useMemo(() => 
        filteredAlerts.filter(a => a.severity === 'critical').length, 
    [filteredAlerts]);

    const handleWhatsApp = (customer: Customer) => {
        if (!customer.phone) return;
        const message = encodeURIComponent(
            `Bonjour ${customer.firstName}, votre compte iPOS présente un solde de ${formatCurrency(customer.outstandingBalance)}. Merci de régulariser votre situation.`
        );
        window.open(`https://wa.me/${customer.phone}?text=${message}`, '_blank');
    };

    const isLoading = alerts === undefined || !isMounted;

    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Trésorerie & Risques Elite" 
                description="Surveillance proactive des défauts de paiement et insolvabilité"
            >
                <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-2xl shadow-sm">
                    <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                    <span className="text-[10px] font-semibold uppercase text-primary">Radar Actif</span>
                </div>
            </PageHeader>

            <div className="grid lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3 rounded-lg border-white/5 bg-card/20 backdrop-blur-sm p-3 shadow-sm flex items-center">
                    <div className="flex-grow relative group w-full">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <Input 
                            placeholder="Identifier un dossier par nom ou mobile..."
                            className="pl-16 h-9 rounded-lg bg-black/20 border-none shadow-inner font-semibold text-lg focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </Card>
                <div className="flex items-center justify-around p-4 bg-card/40 rounded-lg border border-white/5 shadow-xl">
                    <div className="text-center">
                        <span className="text-[9px] font-semibold uppercase text-muted-foreground/40 tracking-wide block mb-1">Alertes</span>
                        <span className={cn("text-xl font-semibold font-mono leading-none", filteredAlerts.length > 0 ? "text-destructive" : "text-emerald-500")}>
                            {isLoading ? '..' : filteredAlerts.length.toString().padStart(2, '0')}
                        </span>
                    </div>
                    <div className="text-center">
                        <span className="text-[9px] font-semibold uppercase text-muted-foreground/40 tracking-wide block mb-1">Critique</span>
                        <span className="text-xl font-semibold font-mono leading-none text-primary">
                            {isLoading ? '..' : criticalCount.toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-96 w-full rounded-lg bg-card/40 border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="py-40 text-center flex flex-col items-center gap-3 animate-in zoom-in-95">
                        <div className="relative p-4 rounded-lg bg-emerald-500/5 border border-dashed border-emerald-500/20">
                            <CheckCircle2 className="h-24 w-24 text-emerald-500/20" />
                        </div>
                        <h3 className="text-xl font-semibold tracking-tighter text-emerald-500 uppercase">Trésorerie Sécurisée</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 animate-in slide-in-from-bottom-4">
                        {filteredAlerts.map(customer => (
                            <Card key={customer.uuid} className={cn(
                                "app-card group bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden rounded-lg relative transition-all duration-500",
                                customer.severity === 'critical' && "border-destructive/30 shadow-sm"
                            )}>
                                <CardHeader className="p-4 pb-4 relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn(
                                            "p-4 rounded-2xl shadow-inner border",
                                            customer.severity === 'critical' ? "bg-destructive/10 text-destructive border-destructive/10" : "bg-amber-500/10 text-amber-500 border-amber-500/10"
                                        )}>
                                            {customer.severity === 'critical' ? <ShieldAlert className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={cn(
                                                "text-[9px] font-semibold uppercase px-4 py-1.5 rounded-full border",
                                                customer.severity === 'critical' ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            )}>
                                                {customer.severity === 'critical' ? 'Urgence Critique' : 'Retard Modéré'}
                                            </span>
                                            {customer.isLegacy && (
                                                <div className="flex items-center gap-1.5 text-[8px] font-semibold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                                    <History className="h-2.5 w-2.5" /> Dette Historique
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg font-semibold tracking-tighter group-hover:text-primary transition-colors truncate">
                                        {customer.firstName} {customer.lastName}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-4 pt-4 space-y-6 relative z-10">
                                    <div className="p-6 rounded-lg bg-black/40 border border-white/5 space-y-2 shadow-inner text-center">
                                        <p className="text-[9px] font-semibold uppercase text-muted-foreground/40 ">Encours Exigible</p>
                                        <p className={cn(
                                            "text-xl font-semibold tracking-tighter font-mono",
                                            customer.severity === 'critical' ? "text-destructive" : "text-amber-500"
                                        )}>
                                            {formatCurrency(customer.outstandingBalance)}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[9px] font-semibold uppercase tracking-wide">
                                            <span className="text-muted-foreground/40 flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Exposition Crédit</span>
                                            <span className={cn(customer.creditUsagePercent > 90 ? "text-destructive" : "text-primary")}>
                                                {Math.round(customer.creditUsagePercent)}%
                                            </span>
                                        </div>
                                        <Progress 
                                            value={Math.min(100, customer.creditUsagePercent)} 
                                            className={cn(
                                                "h-1.5 bg-black/20 shadow-inner",
                                                customer.creditUsagePercent > 100 ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
                                            )} 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 space-y-1 shadow-sm">
                                            <p className="text-[8px] font-semibold uppercase text-muted-foreground/40 flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Retard Total</p>
                                            <p className="text-sm font-semibold text-foreground">{customer.daysPastSettlement} Jours</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 space-y-1 shadow-sm">
                                            <p className="text-[8px] font-semibold uppercase text-muted-foreground/40 flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> Échéance</p>
                                            <p className="text-sm font-semibold text-foreground">Jour {customer.settlementDay || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-2xl h-9 gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-semibold text-[9px] uppercase tracking-wide"
                                            onClick={() => handleWhatsApp(customer)}
                                            disabled={!customer.phone}
                                        >
                                            <MessageCircle className="h-4 w-4" /> WhatsApp
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="rounded-2xl h-9 gap-2 border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-semibold text-[9px] uppercase tracking-wide"
                                            asChild
                                            disabled={!customer.phone}
                                        >
                                            <a href={`tel:${customer.phone}`}>
                                                <PhoneCall className="h-4 w-4" /> Appeler
                                            </a>
                                        </Button>
                                    </div>
                                    
                                    <Button 
                                        variant="ghost" 
                                        asChild
                                        className="w-full rounded-xl h-12 font-semibold text-[9px] uppercase tracking-wide hover:bg-primary/10 hover:text-primary transition-all group/btn"
                                    >
                                        <Link href={`/customers/${customer.uuid}`}>
                                            <FileText className="mr-2 h-3.5 w-3.5 opacity-40" /> Grand Livre <ChevronRight className="ml-auto h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3 relative overflow-hidden group shadow-sm">
                <Sparkles className="absolute -right-6 -top-6 h-32 w-32 text-primary/5 group-hover:opacity-20 transition-opacity duration-1000" />
                <div className="p-5 rounded-3xl bg-black/40 text-primary shadow-inner relative z-10 border border-white/5">
                    <ShieldAlert className="h-8 w-8" />
                </div>
                <div className="space-y-3 relative z-10">
                    <p className="text-xs font-semibold uppercase text-primary flex items-center gap-2">
                        <Info className="h-3.5 w-3.5" /> Intelligence de Trésorerie Elite
                    </p>
                    <p className="text-[12px] text-muted-foreground/70 font-medium leading-relaxed max-w-5xl italic border-l-2 border-primary/20 pl-6 uppercase tracking-wider">
                        L'algorithme de surveillance applique une évaluation temporelle absolue. Un dossier est marqué comme "Critique" si l'exposition dépasse 110% du plafond autorisé ou si le retard de paiement dépasse 15 jours effectifs.
                    </p>
                </div>
            </div>
        </div>
    );
}
