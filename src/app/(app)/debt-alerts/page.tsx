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
    ShieldAlert
} from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn, FINANCIAL_EPSILON } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { startOfMonth, isBefore } from 'date-fns';

/**
 * @fileOverview DebtAlertsPage - Elite Recovery Intelligence Interface.
 * Version 2.5: Implements cross-cycle debt tracking and linguistic purity.
 */

interface DebtAlertItem extends Customer {
    daysPastSettlement: number;
    severity: 'critical' | 'warning';
}

export default function DebtAlertsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    // CORE ENGINE: Hardened against cycle resets and evasion tactics
    const alerts = useLiveQuery(async (): Promise<DebtAlertItem[]> => {
        const now = new Date();
        const currentDay = now.getDate();
        const firstOfThisMonth = startOfMonth(now);
        
        // 1. Fetch significant debtors only
        const debtors = await db.customers
            .where('outstandingBalance')
            .above(FINANCIAL_EPSILON)
            .toArray();

        if (debtors.length === 0) return [];

        // 2. Fetch payments from this month to detect "serious" settlement attempts
        const recentPayments = await db.payments
            .where('paymentDate')
            .above(firstOfThisMonth)
            .toArray();
            
        const paymentMap = new Map<string, number>();
        recentPayments.forEach(p => {
            paymentMap.set(p.customerUuid, (paymentMap.get(p.customerUuid) || 0) + p.amount);
        });

        // 3. Application of Elite Aging Algorithm
        return debtors
            .filter(c => {
                if (!c.settlementDay) return false;

                const paidThisMonth = paymentMap.get(c.uuid) || 0;
                // Threshold: Effort is considered significant if > 10% of debt or >= 1000 DA
                const hasMadeSignificantEffort = paidThisMonth > (c.outstandingBalance * 0.1) || paidThisMonth >= 1000;
                
                // Logic: 
                // A) Past settlement day in current month.
                // B) OR has debt from previous months (Legacy Debt) not addressed by a significant payment.
                const isPastDueThisMonth = currentDay > c.settlementDay;
                const isLegacyDebtor = c.lastActivityDate ? isBefore(new Date(c.lastActivityDate), firstOfThisMonth) : true;

                return (isPastDueThisMonth || isLegacyDebtor) && !hasMadeSignificantEffort;
            })
            .map(c => {
                const isHighlyCritical = (c.outstandingBalance > (c.creditLimit || 0)) || (currentDay - (c.settlementDay || 0) > 10);
                return {
                    ...c,
                    daysPastSettlement: Math.max(0, currentDay - (c.settlementDay || 0)),
                    severity: isHighlyCritical ? 'critical' : 'warning'
                };
            })
            .sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    }, []);

    const filteredAlerts = useMemo(() => {
        if (!alerts) return [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return alerts;
        return alerts.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
            c.phone?.includes(q)
        );
    }, [alerts, searchQuery]);

    const handleWhatsApp = (customer: Customer) => {
        if (!customer.phone) return;
        const message = encodeURIComponent(
            `Bonjour ${customer.firstName}, le service de suivi Elite iPOS vous informe que votre solde de ${formatCurrency(customer.outstandingBalance)} nécessite une régularisation. Merci de nous contacter rapidement. Cordialement.`
        );
        window.open(`https://wa.me/${customer.phone}?text=${message}`, '_blank');
    };

    const isLoading = alerts === undefined;

    return (
        <div className="p-6 sm:p-10 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Intelligence de Recouvrement" 
                description="Surveillance proactive des flux débiteurs et alertes d'insolvabilité"
            >
                <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-2xl shadow-inner group">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Radar Elite Actif</span>
                </div>
            </PageHeader>

            {/* Filter Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center bg-card/20 p-3 rounded-[3rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                <div className="lg:col-span-3 relative group">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
                    <Input 
                        placeholder="Identifier un dossier critique..."
                        className="pl-16 h-16 rounded-[2rem] bg-black/20 border-none shadow-inner font-black text-lg focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-center gap-6 px-6 border-l border-white/5">
                    <div className="text-center">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest block mb-1">Dossiers</span>
                        <span className={cn("text-2xl font-black font-mono", filteredAlerts.length > 0 ? "text-destructive" : "text-emerald-500")}>
                            {filteredAlerts.length.toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-80 w-full rounded-[3.5rem] bg-card/40 border border-white/5 animate-pulse" />
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
                            <h3 className="text-3xl font-black tracking-tighter text-emerald-500">Flux Conformes</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-40">
                                Aucune anomalie de règlement détectée dans le cycle actuel.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
                        {filteredAlerts.map(customer => (
                            <Card key={customer.uuid} className={cn(
                                "luxury-card group bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden rounded-[3.5rem] relative transition-all duration-500 hover:scale-[1.02]",
                                customer.severity === 'critical' && "border-destructive/20 shadow-destructive/5"
                            )}>
                                <div className="absolute -right-6 -top-6 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
                                    <BellRing className="h-40 w-40 rotate-12 text-destructive" />
                                </div>

                                <CardHeader className="p-10 pb-4 relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn(
                                            "p-4 rounded-2xl shadow-inner border",
                                            customer.severity === 'critical' ? "bg-destructive/10 text-destructive border-destructive/10" : "bg-amber-500/10 text-amber-500 border-amber-500/10"
                                        )}>
                                            {customer.severity === 'critical' ? <ShieldAlert className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border",
                                                customer.severity === 'critical' ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            )}>
                                                Alerte Cycle
                                            </span>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors truncate">
                                        {customer.firstName} {customer.lastName}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                        <Calendar className="h-3.5 w-3.5 opacity-40" />
                                        Protocole Jour : {customer.settlementDay}
                                    </div>
                                </CardHeader>

                                <CardContent className="p-10 pt-4 space-y-8 relative z-10">
                                    <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 space-y-2 relative overflow-hidden group/debt">
                                        <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 to-transparent opacity-0 group-hover/debt:opacity-100 transition-opacity duration-1000" />
                                        <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.3em] relative z-10">Créance Exigible</p>
                                        <p className={cn(
                                            "text-5xl font-black tracking-tighter relative z-10 leading-none font-mono",
                                            customer.severity === 'critical' ? "text-destructive" : "text-amber-500"
                                        )}>
                                            {formatCurrency(customer.outstandingBalance)}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-[1.5rem] h-16 gap-3 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
                                            onClick={() => handleWhatsApp(customer)}
                                            disabled={!customer.phone}
                                        >
                                            <MessageCircle className="h-5 w-5" /> Relance WP
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="rounded-[1.5rem] h-16 gap-3 border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
                                            asChild
                                            disabled={!customer.phone}
                                        >
                                            <a href={`tel:${customer.phone}`}>
                                                <PhoneCall className="h-5 w-5" /> Appel Direct
                                            </a>
                                        </Button>
                                    </div>
                                    
                                    <Button 
                                        variant="ghost" 
                                        asChild
                                        className="w-full rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all group/btn"
                                    >
                                        <Link href={`/customers/${customer.uuid}`}>
                                            Expertise Dossier <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Technical Intelligence Note */}
            <div className="p-12 bg-primary/5 rounded-[4rem] border border-primary/10 flex items-start gap-8 relative overflow-hidden group shadow-2xl">
                <Sparkles className="absolute -right-6 -top-6 h-32 w-32 text-primary/5 group-hover:opacity-20 transition-opacity duration-1000" />
                <div className="p-6 rounded-[2rem] bg-black/40 text-primary shadow-inner relative z-10 border border-white/5">
                    <Clock className="h-10 w-10" />
                </div>
                <div className="space-y-4 relative z-10">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                        <Info className="h-4 w-4" /> Algorithme de Recouvrement Elite v2.5
                    </p>
                    <p className="text-[13px] text-muted-foreground/70 font-medium leading-relaxed max-w-5xl italic border-l-2 border-primary/20 pl-6">
                        Le radar identifie les dossiers selon un protocole strict : les créances deviennent exigibles dès le dépassement du jour de règlement mensuel, ou si un reliquat des mois précédents persiste sans versement significatif (&gt;10% du solde). Cette rigueur garantit que les paiements symboliques ne trompent pas la surveillance du système.
                    </p>
                </div>
            </div>
        </div>
    );
}
