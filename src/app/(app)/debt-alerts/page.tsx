'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    BellRing, 
    MessageCircle, 
    Calendar, 
    Landmark, 
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
    Activity
} from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn, FINANCIAL_EPSILON } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { startOfMonth, isBefore } from 'date-fns';
import { Progress } from '@/components/ui/progress';

/**
 * @fileOverview DebtAlertsPage - Elite Recovery Intelligence Interface.
 * Version 5.0: Surgical data indexing and credit exposure analytics.
 */

interface DebtAlertItem extends Customer {
    daysPastSettlement: number;
    severity: 'critical' | 'warning';
    isLegacy: boolean;
    creditUsagePercent: number;
    riskScore: number;
}

export default function DebtAlertsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    // CORE ENGINE: Surgical indexing to prevent memory leaks on large datasets
    const alerts = useLiveQuery(async (): Promise<DebtAlertItem[]> => {
        const now = new Date();
        const currentDay = now.getDate();
        const firstOfThisMonth = startOfMonth(now);
        
        // Batch Fetching with optimized memory keys
        const [debtors, unpaidSales, recentPayments] = await Promise.all([
            db.customers.where('outstandingBalance').above(FINANCIAL_EPSILON).toArray(),
            db.sales.where('paymentStatus').anyOf(['unpaid', 'partial']).toArray(),
            db.payments.where('paymentDate').above(firstOfThisMonth).toArray()
        ]);

        if (debtors.length === 0) return [];

        // O(1) Pre-indexing for high-speed computation
        const debtAgeMap = new Map<string, Date>();
        unpaidSales.forEach(s => {
            const saleDate = new Date(s.createdAt!);
            const customerUuid = s.customerUuid || '';
            const currentOldest = debtAgeMap.get(customerUuid);
            if (!currentOldest || isBefore(saleDate, currentOldest)) {
                debtAgeMap.set(customerUuid, saleDate);
            }
        });

        const paymentTotalMap = new Map<string, number>();
        recentPayments.forEach(p => {
            paymentTotalMap.set(p.customerUuid, (paymentTotalMap.get(p.customerUuid) || 0) + p.amount);
        });

        // ELITE ANALYTICS: Risk Exposure Mapping
        return debtors
            .filter(c => {
                if (!c.settlementDay) return false;

                const paidThisMonth = paymentTotalMap.get(c.uuid) || 0;
                // Threshold: Serious effort is > 20% of debt (Accounting Standard)
                const hasMadeSignificantEffort = paidThisMonth > (c.outstandingBalance * 0.20);
                
                const oldestDebtDate = debtAgeMap.get(c.uuid);
                const isPastDueThisMonth = currentDay > c.settlementDay;
                const isLegacyDebtor = oldestDebtDate ? isBefore(oldestDebtDate, firstOfThisMonth) : false;

                return (isPastDueThisMonth || isLegacyDebtor) && !hasMadeSignificantEffort;
            })
            .map(c => {
                const oldestDebtDate = debtAgeMap.get(c.uuid);
                const creditLimit = c.creditLimit || 0;
                const creditUsagePercent = creditLimit > 0 ? (c.outstandingBalance / creditLimit) * 100 : 0;
                const delaySeverity = currentDay - (c.settlementDay || 0);
                
                const isHighlyCritical = creditUsagePercent > 100 || delaySeverity > 15 || (oldestDebtDate && isBefore(oldestDebtDate, firstOfThisMonth));

                return {
                    ...c,
                    daysPastSettlement: Math.max(0, delaySeverity),
                    severity: isHighlyCritical ? 'critical' : 'warning',
                    isLegacy: oldestDebtDate ? isBefore(oldestDebtDate, firstOfThisMonth) : false,
                    creditUsagePercent,
                    riskScore: (creditUsagePercent * 0.6) + (delaySeverity * 2)
                };
            })
            .sort((a, b) => b.riskScore - a.riskScore);
    }, []);

    const filteredAlerts = useMemo(() => {
        if (!alerts) return [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return alerts;
        return alerts.filter(c => 
            c.firstName.toLowerCase().includes(q) || 
            c.lastName.toLowerCase().includes(q) ||
            c.phone?.includes(q)
        );
    }, [alerts, searchQuery]);

    const handleWhatsApp = (customer: Customer) => {
        if (!customer.phone) return;
        const message = encodeURIComponent(
            `Bonjour ${customer.firstName}, votre compte Elite iPOS affiche un solde débiteur de ${formatCurrency(customer.outstandingBalance)}. Merci de régulariser votre situation dans les plus brefs délais. Cordialement.`
        );
        window.open(`https://wa.me/${customer.phone}?text=${message}`, '_blank');
    };

    const isLoading = alerts === undefined;

    return (
        <div className="p-6 sm:p-10 space-y-10 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Surveillance de Trésorerie" 
                description="Radar souverain de détection des risques d'insolvabilité"
            >
                <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-2xl shadow-inner group">
                    <Activity className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Protocol Elite v5.0 Actif</span>
                </div>
            </PageHeader>

            {/* Elite Data Control Panel */}
            <div className="grid lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3 rounded-[3rem] border-white/5 bg-card/20 backdrop-blur-3xl p-3 shadow-2xl flex items-center">
                    <div className="flex-grow relative group w-full">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
                        <Input 
                            placeholder="Localiser un dossier par nom ou mobile..."
                            className="pl-16 h-16 rounded-[2rem] bg-black/20 border-none shadow-inner font-black text-lg focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </Card>
                <div className="flex items-center justify-between p-8 bg-card/40 rounded-[3rem] border border-white/5">
                    <div className="text-center">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest block mb-1">Alertes</span>
                        <span className={cn("text-3xl font-black font-mono leading-none", filteredAlerts.length > 0 ? "text-destructive" : "text-emerald-500")}>
                            {filteredAlerts.length.toString().padStart(2, '0')}
                        </span>
                    </div>
                    <div className="h-10 w-px bg-white/5" />
                    <div className="text-center">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest block mb-1">Critique</span>
                        <span className="text-3xl font-black font-mono leading-none text-primary">
                            {filteredAlerts.filter(a => a.severity === 'critical').length.toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-96 w-full rounded-[3.5rem] bg-card/40 border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="py-40 text-center flex flex-col items-center gap-8 animate-in zoom-in-95 duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse" />
                            <div className="relative p-16 rounded-[4rem] bg-emerald-500/5 border border-dashed border-emerald-500/20">
                                <CheckCircle2 className="h-24 w-24 text-emerald-500/20" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black tracking-tighter text-emerald-500">Flux 100% Sécurisés</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-40">
                                Aucune anomalie de règlement détectée par le protocole Elite.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 animate-in slide-in-from-bottom-4 duration-700">
                        {filteredAlerts.map(customer => (
                            <Card key={customer.uuid} className={cn(
                                "luxury-card group bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden rounded-[3.5rem] relative transition-all duration-500 hover:scale-[1.02]",
                                customer.severity === 'critical' && "border-destructive/30 shadow-destructive/10"
                            )}>
                                <div className="absolute -right-6 -top-6 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
                                    <BellRing className="h-40 w-40 rotate-12 text-destructive" />
                                </div>

                                <CardHeader className="p-8 pb-4 relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn(
                                            "p-4 rounded-2xl shadow-inner border transition-colors",
                                            customer.severity === 'critical' ? "bg-destructive/10 text-destructive border-destructive/10" : "bg-amber-500/10 text-amber-500 border-amber-500/10"
                                        )}>
                                            {customer.severity === 'critical' ? <ShieldAlert className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border",
                                                customer.severity === 'critical' ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            )}>
                                                {customer.severity === 'critical' ? 'Urgence Critique' : 'Retard Modéré'}
                                            </span>
                                            {customer.isLegacy && (
                                                <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                                    <History className="h-2.5 w-2.5" /> Dette Historique
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors truncate">
                                        {customer.firstName} {customer.lastName}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-8 pt-4 space-y-6 relative z-10">
                                    <div className="p-6 rounded-[2.5rem] bg-black/40 border border-white/5 space-y-2 relative overflow-hidden group/debt">
                                        <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 to-transparent opacity-0 group-hover/debt:opacity-100 transition-opacity duration-1000" />
                                        <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.3em] relative z-10">Montant Exigible</p>
                                        <p className={cn(
                                            "text-4xl font-black tracking-tighter relative z-10 leading-none font-mono",
                                            customer.severity === 'critical' ? "text-destructive" : "text-amber-500"
                                        )}>
                                            {formatCurrency(customer.outstandingBalance)}
                                        </p>
                                    </div>

                                    {/* Exposure Analytics */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                            <span className="text-muted-foreground/40 flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Utilisation du Plafond</span>
                                            <span className={cn(customer.creditUsagePercent > 90 ? "text-destructive" : "text-primary")}>
                                                {Math.round(customer.creditUsagePercent)}%
                                            </span>
                                        </div>
                                        <Progress 
                                            value={Math.min(100, customer.creditUsagePercent)} 
                                            className={cn(
                                                "h-1.5 bg-black/20",
                                                customer.creditUsagePercent > 100 ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
                                            )} 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 space-y-1">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground/40 flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Retard Flux</p>
                                            <p className="text-sm font-black text-foreground">{customer.daysPastSettlement} Jours</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 space-y-1">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground/40 flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> Échéance</p>
                                            <p className="text-sm font-black text-foreground">Jour {customer.settlementDay}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-2xl h-14 gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest shadow-xl"
                                            onClick={() => handleWhatsApp(customer)}
                                            disabled={!customer.phone}
                                        >
                                            <MessageCircle className="h-4 w-4" /> WhatsApp
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="rounded-2xl h-14 gap-2 border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest shadow-xl"
                                            asChild
                                            disabled={!customer.phone}
                                        >
                                            <a href={`tel:${customer.phone}`}>
                                                <PhoneCall className="h-4 w-4" /> Appeler
                                            </a>
                                        </Button>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="ghost" 
                                            asChild
                                            className="flex-grow rounded-xl h-12 font-black text-[9px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all group/btn"
                                        >
                                            <Link href={`/customers/${customer.uuid}`}>
                                                <FileText className="mr-2 h-3.5 w-3.5 opacity-40" /> Grand Livre <ChevronRight className="ml-auto h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* System Intelligence Note */}
            <div className="p-10 bg-primary/5 rounded-[3.5rem] border border-primary/10 flex items-start gap-8 relative overflow-hidden group shadow-2xl">
                <Sparkles className="absolute -right-6 -top-6 h-32 w-32 text-primary/5 group-hover:opacity-20 transition-opacity duration-1000" />
                <div className="p-5 rounded-3xl bg-black/40 text-primary shadow-inner relative z-10 border border-white/5">
                    <ShieldAlert className="h-8 w-8" />
                </div>
                <div className="space-y-3 relative z-10">
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                        <Info className="h-3.5 w-3.5" /> Intelligence de Flux Elite v5.0
                    </p>
                    <p className="text-[12px] text-muted-foreground/70 font-medium leading-relaxed max-w-5xl italic border-l-2 border-primary/20 pl-6">
                        L'algorithme v5.0 applique un "Credit Stress Test" : il évalue le risque non seulement sur le retard de paiement، mais aussi sur le taux d'exposition (Credit Exposure) par rapport au plafond autorisé. Un dossier passe en "Urgence Critique" dès que le ratio d'utilisation dépasse 100% أو أن تأخر السداد يتجاوز 15 يوماً من تاريخ الاستحقاق المتفق عليه.
                    </p>
                </div>
            </div>
        </div>
    );
}
