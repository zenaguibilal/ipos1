
'use client';

import React from 'react';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, CheckCircle, AlertCircle, Clock, Hash, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';

interface SalesHistoryCardProps {
    sale: Sale;
    customerName?: string;
    isSelected: boolean;
    onToggleSelection: () => void;
    onViewDetails: (sale: Sale) => void;
    onCancelSale: (sale: Sale) => void;
}

const SalesHistoryCardComponent = ({ 
    sale, 
    customerName, 
    isSelected,
    onToggleSelection,
    onViewDetails, 
    onCancelSale 
}: SalesHistoryCardProps) => {
    const paymentStatusMap = {
        paid: { text: 'Payé', icon: CheckCircle, color: 'text-chart-quaternary', bg: 'bg-chart-quaternary/10' },
        partial: { text: 'Partiel', icon: AlertCircle, color: 'text-chart-secondary', bg: 'bg-chart-secondary/10' },
        unpaid: { text: 'Impayé', icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10' },
    };
    const status = paymentStatusMap[sale.paymentStatus];

    return (
        <Card 
            onClick={onToggleSelection}
            className={cn(
                "group flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-card border-none relative overflow-hidden rounded-3xl cursor-pointer",
                isSelected ? "ring-2 ring-primary shadow-lg" : "hover:bg-muted/5"
            )}
        >
            <div className="absolute top-3 right-3 z-10 flex gap-1 items-center">
                <div onClick={(e) => e.stopPropagation()} className="p-1.5 bg-background/80 backdrop-blur-md rounded-xl shadow-sm border border-white/5">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-md border-none shadow-sm rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl">
                        <DropdownMenuItem onClick={() => onViewDetails(sale)} className="rounded-xl">
                            <FileText className="mr-2 h-4 w-4" /> Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelSale(sale)} className="text-destructive focus:text-destructive rounded-xl">
                            <Trash2 className="mr-2 h-4 w-4" /> Annuler la vente
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-5 pb-2 space-y-2">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("rounded-md font-black uppercase text-[8px] tracking-widest px-2 py-0 border-none", status.bg, status.color)}>
                        <status.icon className="h-2.5 w-2.5 mr-1" />
                        {status.text}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground/50 flex items-center gap-1">
                        <Hash className="h-2.5 w-2.5" /> {sale.invoiceNumber}
                    </span>
                </div>
                <CardTitle className="text-lg font-black leading-tight tracking-tight group-hover:text-primary transition-colors truncate pr-12">
                    {customerName || 'Client de passage'}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                    <Clock className="h-3 w-3" />
                    {format(safeToDate(sale.createdAt!), 'd MMM, HH:mm', { locale: fr })}
                </div>
            </CardHeader>

            <CardContent className="p-5 py-2 space-y-3 flex-grow">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Tag className="h-3 w-3 opacity-50"/> Détails Paiement</span>
                    <span className="text-foreground">Recu: {formatCurrency(sale.amountPaid)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground opacity-60 mb-1">Articles</p>
                        <p className="font-black text-sm">{sale.items?.length || 0} PCS</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground opacity-60 mb-1">Reste à payer</p>
                        <p className={cn("font-black text-sm", sale.remainingBalance > 0 ? "text-destructive" : "text-emerald-500")}>
                            {formatCurrency(Math.max(0, sale.remainingBalance))}
                        </p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-5 pt-3 flex justify-between items-end border-t border-white/5 bg-muted/5">
                 <div className="space-y-0.5">
                    <p className="text-2xl font-black text-primary tracking-tighter leading-none">{formatCurrency(sale.total)}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">Total Facturé</p>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(sale); }} className="h-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary">
                    Détails
                </Button>
            </CardFooter>
        </Card>
    );
}

export const SalesHistoryCard = React.memo(SalesHistoryCardComponent);
