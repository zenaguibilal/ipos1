'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Landmark, ShieldCheck, History } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

interface CustomerMetricsProps {
    customer: Customer;
}

export function CustomerMetrics({ customer }: CustomerMetricsProps) {
    const balance = Number(customer.outstandingBalance) || 0;
    const limit = Number(customer.creditLimit) || 0;
    const initialBalance = Number(customer.initialBalance) || 0;
    const creditUsage = limit > 0 ? (balance / limit) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Main Debt Card - High Impact */}
            <Card className={cn(
                "rounded-lg border-none shadow-sm overflow-hidden relative group transition-all duration-700",
                balance > 0 ? "bg-destructive/10 border-destructive/20" : "bg-emerald-500/10 border-emerald-500/20"
            )}>
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000">
                    <Landmark className="h-48 w-48 rotate-12" />
                </div>
                <CardContent className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className={cn(
                            "p-4 rounded-2xl shadow-inner",
                            balance > 0 ? "bg-destructive/20 text-destructive" : "bg-emerald-500/20 text-emerald-500"
                        )}>
                            <Landmark className="h-8 w-8" />
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-semibold uppercase opacity-40">Statut Financier</span>
                            <p className={cn(
                                "text-[10px] font-semibold uppercase tracking-wide mt-1",
                                balance > 0 ? "text-destructive" : "text-emerald-500"
                            )}>
                                {balance > 0 ? 'Dette Active' : 'Solde Équilibré'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground opacity-50">Solde Déبiteur Actuel</span>
                        <div className="flex items-baseline gap-2">
                            <p className={cn(
                                "text-lg font-semibold tracking-tighter",
                                balance > 0 ? "text-destructive" : "text-foreground"
                            )}>
                                {formatCurrency(balance)}
                            </p>
                        </div>
                    </div>

                    {/* Toujours afficher le solde initial pour la traçabilité */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center bg-black/10 -mx-4 px-4 py-3">
                        <span className="text-[9px] font-semibold uppercase text-muted-foreground/60 flex items-center gap-1.5">
                            <History className="h-3 w-3 text-primary" /> Solde de Report (Initial)
                        </span>
                        <span className="text-[10px] font-bold text-primary">{formatCurrency(initialBalance)}</span>
                    </div>

                    {limit > 0 && (
                        <div className="mt-6 space-y-3">
                            <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wide">
                                <span className="text-muted-foreground/60">Utilisation du Crédit</span>
                                <span className={cn(creditUsage > 90 ? "text-destructive" : "text-primary")}>{creditUsage.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={cn("h-full transition-all duration-1000", creditUsage > 90 ? "bg-destructive" : "bg-primary")} 
                                    style={{ width: `${Math.min(100, creditUsage)}%` }} 
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-2 gap-6">
                <Card className="rounded-lg border-none shadow-xl bg-card/40 backdrop-blur-md overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-inner">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/40">Volume Achats</p>
                            <p className="text-xl font-semibold tracking-tight">{formatCurrency(customer.totalSpent)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-none shadow-xl bg-card/40 backdrop-blur-md overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shadow-inner">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/40">Limite Autorisée</p>
                            <p className="text-xl font-semibold tracking-tight">
                                {limit > 0 ? formatCurrency(limit) : '∞'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
