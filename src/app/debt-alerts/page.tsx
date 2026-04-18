'use client';

import { useState, useMemo, useDeferredValue, useEffect, useRef } from 'react';
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
    RefreshCw,
    HandCoins,
    UserX,
    ShieldExclamation
} from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn, FINANCIAL_EPSILON, safeNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { startOfMonth, differenceInDays, subMonths, setDate as fnsSetDate, lastDayOfMonth, startOfDay } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DebtAlertItem extends Customer {
    daysPastSettlement: number;
    severity: 'critical' | 'warning';
    isLegacy: boolean;
    creditUsagePercent: number;
    riskScore: number;
    oldestUnpaidDate?: Date;
}

export default function DebtAlertsPage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearch = useDeferredValue(searchQuery);
    const [isMounted, setIsMounted] = useState(false);
    
    // إدارة الدفع السريع
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const alerts = useLiveQuery(async (): Promise<DebtAlertItem[]> => {
        try {
            const now = new Date();
            const firstOfThisMonth = startOfMonth(now);
            
            // جلب كافة المدينين فقط (تحسين الأداء)
            const debtors = await db.customers
                .where('outstandingBalance')
                .above(FINANCIAL_EPSILON)
                .toArray();

            if (debtors.length === 0) return [];

            // جلب تواريخ أقدم الديون لكل عميل بشكل مجمع
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
                    const creditLimit = safeNumber(customer.creditLimit);
                    const balance = safeNumber(customer.outstandingBalance);
                    
                    const creditUsagePercent = creditLimit > 0 
                        ? (balance / creditLimit) * 100 
                        : (balance > 0 ? 100 : 0);
                    
                    let delaySeverity = 0;
                    if (customer.settlementDay) {
                        const endOfCurrentMonth = lastDayOfMonth(now);
                        const safeSettlementDay = Math.min(Math.max(1, customer.settlementDay), endOfCurrentMonth.getDate());
                        let targetDate = fnsSetDate(startOfDay(now), safeSettlementDay);
                        
                        if (now.getDate() < safeSettlementDay) {
                            const lastMonth = subMonths(now, 1);
                            const safeLastMonthDay = Math.min(customer.settlementDay, lastDayOfMonth(lastMonth).getDate());
                            targetDate = fnsSetDate(startOfDay(lastMonth), safeLastMonthDay);
                        }
                        delaySeverity = Math.max(0, differenceInDays(now, targetDate));
                    } else if (oldestDebtDate) {
                        delaySeverity = Math.max(0, differenceInDays(now, oldestDebtDate));
                    }

                    const isLegacy = oldestDebtDate ? oldestDebtDate < firstOfThisMonth : false;
                    
                    // محرك تقييم المخاطر المتطور
                    // 1. عامل الاستهلاك (Exposure): 60%
                    // 2. عامل التأخير الزمني (Delay): 40%
                    const riskScore = (Math.min(200, creditUsagePercent) * 0.6) + (delaySeverity * 4.0);
                    
                    const isHighlyCritical = creditUsagePercent > 110 || delaySeverity > 15 || (isLegacy && delaySeverity > 5);

                    return {
                        ...customer,
                        daysPastSettlement: isNaN(delaySeverity) ? 0 : delaySeverity,
                        severity: isHighlyCritical ? 'critical' : 'warning',
                        isLegacy,
                        creditUsagePercent: isNaN(creditUsagePercent) ? 0 : creditUsagePercent,
                        riskScore: isNaN(riskScore) ? 0 : riskScore,
                        oldestUnpaidDate: oldestDebtDate
                    };
                })
                .filter(a => a.daysPastSettlement > 0 || a.creditUsagePercent > 95)
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
            `Bonjour ${customer.firstName}, votre compte iPOS présente un solde de ${formatCurrency(customer.outstandingBalance)}. Merci de régulariser votre situation dès que possible. Cordialement.`
        );
        window.open(`https://wa.me/${customer.phone}?text=${message}`, '_blank');
    };

    const openQuickPayment = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsPaymentDialogOpen(true);
    };

    useKeyboardShortcuts([
        {
            key: 'F3',
            action: () => searchInputRef.current?.focus(),
            description: 'Identifier un dossier',
            ignoreInputFocus: true
        }
    ], 'Alertes');

    const isLoading = alerts === undefined || !isMounted;

    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Trésorerie & Risques Elite" 
                description="Algorithme de surveillance proactive des insolvabilités et retards"
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-2xl shadow-inner">
                        <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">Radar Actif</span>
                    </div>
                </div>
            </PageHeader>

            <div className="grid lg:grid-cols-4 gap-4">
                <Card className="lg:col-span-3 rounded-lg border-white/5 bg-card/20 backdrop-blur-sm p-2 shadow-sm flex items-center">
                    <div className="flex-grow relative group w-full px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-all duration-500" />
                        <Input 
                            ref={searchInputRef}
                            placeholder="Identifier un dossier critique [F3]..."
                            className="pl-14 h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold text-lg focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-card/40 rounded-lg border border-white/5 shadow-sm group">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest block mb-1">Total Alertes</span>
                        <span className={cn("text-3xl font-black tabular-nums leading-none transition-all group-hover:scale-110", filteredAlerts.length > 0 ? "text-destructive" : "text-emerald-500")}>
                            {isLoading ? '..' : filteredAlerts.length.toString().padStart(2, '0')}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg border border-primary/10 shadow-sm group">
                        <span className="text-[9px] font-black uppercase text-primary/40 tracking-widest block mb-1">Dossiers Critiques</span>
                        <span className="text-3xl font-black tabular-nums leading-none text-primary transition-all group-hover:scale-110">
                            {isLoading ? '..' : criticalCount.toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-[450px] w-full rounded-2xl bg-card/40 border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="py-40 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-1000">
                        <div className="relative p-8 rounded-full bg-emerald-500/5 border border-dashed border-emerald-500/20">
                            <CheckCircle2 className="h-24 w-24 text-emerald-500/20" />
                            <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tighter text-emerald-500 uppercase">Trésorerie Sécurisée</h3>
                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">Aucun retard critique détecté</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-700">
                        {filteredAlerts.map(customer => (
                            <Card key={customer.uuid} className={cn(
                                "app-card group bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden rounded-lg relative transition-all duration-700",
                                customer.severity === 'critical' ? "border-destructive/40 shadow-xl" : "hover:border-primary/30"
                            )}>
                                {/* Background Risk Badge */}
                                <div className={cn(
                                    "absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none",
                                    customer.severity === 'critical' ? "text-destructive" : "text-primary"
                                )}>
                                    <ShieldAlert className="h-40 w-40 rotate-12" />
                                </div>

                                <CardHeader className="p-6 pb-4 relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn(
                                            "p-4 rounded-2xl shadow-inner border transition-all duration-700 group-hover:scale-110",
                                            customer.severity === 'critical' ? "bg-destructive/10 text-destructive border-destructive/10" : "bg-amber-500/10 text-amber-500 border-amber-500/10"
                                        )}>
                                            {customer.severity === 'critical' ? <ShieldExclamation className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant={customer.severity === 'critical' ? "destructive" : "secondary"} className="h-6 px-4 rounded-full font-black uppercase text-[8px] tracking-widest border-none shadow-sm">
                                                {customer.severity === 'critical' ? 'Urgence Critique' : 'Surveillance'}
                                            </Badge>
                                            {customer.isLegacy && (
                                                <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 shadow-inner">
                                                    <History className="h-2.5 w-2.5" /> Dette Historique
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-black tracking-tighter group-hover:text-primary transition-colors truncate pr-4">
                                        {customer.firstName} {customer.lastName}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-6 pt-2 space-y-6 relative z-10">
                                    <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-1 shadow-inner text-center group/balance">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground/40 tracking-widest">Solde Exigible</p>
                                        <p className={cn(
                                            "text-2xl font-black tracking-tighter tabular-nums transition-all",
                                            customer.severity === 'critical' ? "text-destructive scale-105" : "text-amber-500"
                                        )}>
                                            {formatCurrency(customer.outstandingBalance)}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                            <span className="text-muted-foreground/40 flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Consommation Crédit</span>
                                            <span className={cn(customer.creditUsagePercent > 100 ? "text-destructive animate-pulse" : "text-primary")}>
                                                {Math.round(customer.creditUsagePercent)}%
                                            </span>
                                        </div>
                                        <Progress 
                                            value={Math.min(100, customer.creditUsagePercent)} 
                                            className={cn(
                                                "h-1.5 bg-black/40 shadow-inner rounded-full",
                                                customer.creditUsagePercent > 100 ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
                                            )} 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 space-y-1 shadow-sm transition-all hover:bg-muted/30">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground/40 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Retard Actif</p>
                                            <p className="text-sm font-black text-foreground tabular-nums">{customer.daysPastSettlement} Jours</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 space-y-1 shadow-sm transition-all hover:bg-muted/30">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground/40 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Échéance</p>
                                            <p className="text-sm font-black text-foreground">Jour {customer.settlementDay || '30'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-xl h-10 gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest shadow-lg"
                                            onClick={() => handleWhatsApp(customer)}
                                            disabled={!customer.phone}
                                        >
                                            <MessageCircle className="h-4 w-4" /> WhatsApp
                                        </Button>
                                        <Button 
                                            onClick={() => openQuickPayment(customer)}
                                            className="rounded-xl h-10 gap-2 shadow-xl shadow-sm transition-all active:scale-95 font-black text-[9px] uppercase tracking-widest"
                                        >
                                            <HandCoins className="h-4 w-4" /> Encaisser
                                        </Button>
                                    </div>
                                    
                                    <Button 
                                        variant="ghost" 
                                        asChild
                                        className="w-full rounded-xl h-12 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/10 hover:text-primary transition-all group/btn border border-transparent hover:border-primary/20"
                                    >
                                        <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                                            <FileText className="mr-2 h-4 w-4 opacity-40" /> Grand Livre <ChevronRight className="ml-auto h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Risk Engine Insight */}
            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm relative overflow-hidden group">
                <Sparkles className="absolute -right-6 -top-6 h-40 w-40 text-primary/5 group-hover:opacity-20 transition-opacity duration-1000" />
                <div className="p-5 rounded-3xl bg-black/40 text-primary shadow-xl relative z-10 border border-white/5 transition-transform group-hover:rotate-6">
                    <ShieldAlert className="h-10 w-10" />
                </div>
                <div className="space-y-3 relative z-10 flex-grow">
                    <p className="text-xs font-black uppercase text-primary flex items-center gap-2 tracking-[0.2em]">
                        <Info className="h-4 w-4" /> Moteur d'Audit de Trésorerie
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 font-medium leading-relaxed max-w-6xl italic border-l-3 border-primary/30 pl-8 uppercase tracking-widest">
                        L'algorithme "Elite Risk" évalue chaque dossier en temps réel. Un marquage "Critique" survient dès qu'une exposition dépasse 110% du plafond ou si un retard de paiement effectif franchit le seuil des 15 jours. La réactivité est la clé de la solvabilité.
                    </p>
                </div>
            </div>

            {selectedCustomer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={selectedCustomer}
                    onPaymentSuccess={() => {
                        toast.success("Règlement enregistré avec succès.");
                        setSelectedCustomer(null);
                    }}
                />
            )}
        </div>
    );
}
