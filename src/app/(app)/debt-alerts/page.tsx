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
    Info
} from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn, FINANCIAL_EPSILON } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { startOfMonth, subDays } from 'date-fns';

/**
 * @fileOverview DebtAlertsPage - Elite Recovery Intelligence.
 * Refactored for professional debt aging logic and reactive performance.
 */
export default function DebtAlertsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    // REACTIVE ENGINE: Monitored data stream with professional aging logic
    const alerts = useLiveQuery(async () => {
        const now = new Date();
        const currentDay = now.getDate();
        const monthStart = startOfMonth(now);
        // Maturity Buffer: Debt must be at least 3 days old to trigger an aggressive alert
        const maturityThreshold = subDays(now, 3);

        // Step 1: Atomic fetch of potential debtors using the financial epsilon
        const debtors = await db.customers.where('outstandingBalance').above(FINANCIAL_EPSILON).toArray();
        if (debtors.length === 0) return [];

        // Step 2: Batch fetch payments to verify current month integrity
        const recentPayments = await db.payments.where('paymentDate').above(monthStart).toArray();
        const paidCustomerUuids = new Set(recentPayments.map(p => p.customerUuid));

        // Step 3: Elite Filtering & Aging Protocol
        return debtors
            .filter(c => {
                if (!c.settlementDay) return false;
                
                // Logic: Is it past the settlement day AND no payment this month?
                const isPastSettlement = currentDay > c.settlementDay;
                const hasNotPaidThisMonth = !paidCustomerUuids.has(c.uuid);
                
                // Safety check: Don't alert for very recent debts (accrued after settlement day this month)
                const isLegacyDebt = c.lastActivityDate ? new Date(c.lastActivityDate) <= maturityThreshold : true;

                return isPastSettlement && hasNotPaidThisMonth && isLegacyDebt;
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
            `Bonjour ${customer.firstName}, c'est iPOS Luxury. Nous vous informons que votre solde de ${formatCurrency(customer.outstandingBalance)} est arrivé à échéance. Merci de régulariser votre situation dès que possible. Cordialement.`
        );
        window.open(`https://wa.me/${customer.phone}?text=${message}`, '_blank');
    };

    const isLoading = alerts === undefined;

    return (
        <div className="p-6 sm:p-10 space-y-10 max-w-[1400px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Intelligence de Recouvrement" 
                description="Surveillance proactive des retards critiques et des échéances"
            >
                <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Radar التحصيل نشط</span>
                </div>
            </PageHeader>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-card/20 p-2 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-inner">
                <div className="relative group flex-grow max-w-xl px-4">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
                    <Input 
                        placeholder="Identifier ένα ملف متأخر..."
                        className="pl-14 h-14 rounded-2xl bg-black/20 border-none shadow-inner font-black text-lg focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-6 px-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Dossiers Critiques</span>
                        <span className={cn("text-xl font-black", filteredAlerts.length > 0 ? "text-destructive" : "text-emerald-500")}>
                            {filteredAlerts.length} Profils
                        </span>
                    </div>
                </div>
            </div>

            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-72 w-full rounded-[3rem] bg-card/40 border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="py-40 text-center flex flex-col items-center gap-8 animate-in zoom-in-95 duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
                            <div className="relative p-12 rounded-[3.5rem] bg-emerald-500/5 border border-dashed border-emerald-500/20">
                                <CheckCircle2 className="h-24 w-24 text-emerald-500/20" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black tracking-tighter text-emerald-500">Flux Conformes</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.2em] opacity-60">
                                Aucun retard critique détecté. Tous les comptes respectent les protocoles de règlement.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
                        {filteredAlerts.map(customer => (
                            <Card key={customer.uuid} className="luxury-card group bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden rounded-[3rem] relative transition-all duration-500 hover:scale-[1.02]">
                                <div className="absolute -right-6 -top-6 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
                                    <BellRing className="h-40 w-40 rotate-12 text-destructive" />
                                </div>

                                <CardHeader className="p-10 pb-4 relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive shadow-inner border border-destructive/10">
                                            <AlertCircle className="h-7 w-7" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black uppercase text-destructive tracking-[0.2em] bg-destructive/10 px-4 py-1.5 rounded-full border border-destructive/20">
                                                Retard Critique
                                            </span>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors truncate">
                                        {customer.firstName} {customer.lastName}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                        <Calendar className="h-3.5 w-3.5 opacity-40" />
                                        Échéance fixée au {customer.settlementDay} du mois
                                    </div>
                                </CardHeader>

                                <CardContent className="p-10 pt-4 space-y-8 relative z-10">
                                    <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 space-y-2 relative overflow-hidden group/debt">
                                        <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 to-transparent opacity-0 group-hover/debt:opacity-100 transition-opacity duration-1000" />
                                        <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.3em] relative z-10">Créance exigible</p>
                                        <p className="text-5xl font-black text-destructive tracking-tighter relative z-10 leading-none">{formatCurrency(customer.outstandingBalance)}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-2xl h-16 gap-3 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
                                            onClick={() => handleWhatsApp(customer)}
                                            disabled={!customer.phone}
                                        >
                                            <MessageCircle className="h-5 w-5" /> Relancer WP
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="rounded-2xl h-16 gap-3 border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
                                            asChild
                                            disabled={!customer.phone}
                                        >
                                            <a href={`tel:${customer.phone}`}>
                                                <PhoneCall className="h-5 w-5" /> Appeler
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

            <div className="p-12 bg-primary/5 rounded-[3.5rem] border border-primary/10 flex items-start gap-8 relative overflow-hidden group shadow-2xl">
                <Sparkles className="absolute -right-6 -top-6 h-32 w-32 text-primary/5 group-hover:opacity-20 transition-opacity duration-1000" />
                <div className="p-5 rounded-3xl bg-primary/10 text-primary shadow-inner relative z-10 border border-primary/10">
                    <Landmark className="h-10 w-10" />
                </div>
                <div className="space-y-3 relative z-10">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                        <Info className="h-4 w-4" /> Algorithme de Surveillance النخبة
                    </p>
                    <p className="text-[12px] text-muted-foreground/70 font-medium leading-relaxed max-w-5xl italic">
                        Le système n'affiche que les retards "critiques". Un profil est considéré en alerte si : 1) Son solde est supérieur à l'indice de tolérance (0.01 DA). 2) Le jour de règlement mensuel est dépassé. 3) Aucun versement n'a été enregistré durant le mois calendaire actuel. 4) La dette n'est pas "fraîche" (datant de moins de 72h), afin d'éviter les faux positifs lors des transactions quotidiennes.
                    </p>
                </div>
            </div>
        </div>
    );
}
