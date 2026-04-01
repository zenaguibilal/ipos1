
'use client';

import React, { useState, useEffect } from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Phone, BellRing, ShieldCheck, Calendar, Hourglass, User, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomerCardProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

const DebtStatusIcon = ({ status }: { status: Customer['debtStatus']}) => {
    switch (status) {
        case 'overdue':
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="p-1.5 bg-destructive/20 rounded-xl">
                                <BellRing className="h-4 w-4 text-destructive animate-pulse" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-xl font-bold text-xs bg-destructive text-destructive-foreground">Retard de paiement</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        case 'due_soon':
             return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="p-1.5 bg-amber-500/20 rounded-xl">
                                <Hourglass className="h-4 w-4 text-amber-500" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-xl font-bold text-xs">Échéance proche</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        default:
            return null;
    }
};

export const CustomerCard = React.memo(({ customer, onEdit, onDelete }: CustomerCardProps) => {
    const [isMounted, setIsMounted] = useState(false);
    
    // Safety check for math
    const balance = customer.outstandingBalance || 0;
    const limit = customer.creditLimit || 0;
    const creditUsage = limit > 0 ? (balance / limit) * 100 : 0;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <Card className={cn(
            "group flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-card border-none relative overflow-hidden rounded-3xl",
            balance > 0 && "ring-1 ring-white/5"
        )}>
            <div className="absolute top-3 right-3 z-10 flex gap-1 items-center">
                <DebtStatusIcon status={customer.debtStatus} />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-md border-none shadow-sm rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl">
                        <DropdownMenuItem asChild className="rounded-xl">
                            <Link href={`/customers/${customer.uuid}`}>
                                <FileText className="mr-2 h-4 w-4" /> Voir l'historique
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(customer)} className="rounded-xl">
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive rounded-xl">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-5 pb-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                        "p-2.5 rounded-2xl bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary",
                        balance > 0 && "bg-primary/5 text-primary"
                    )}>
                        <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="text-lg font-black leading-none tracking-tight truncate group-hover:text-primary transition-colors">
                            {customer.firstName} {customer.lastName}
                        </CardTitle>
                        {customer.phone && (
                            <p className="text-[10px] font-bold text-muted-foreground mt-1.5 flex items-center gap-1.5 uppercase opacity-60">
                                <Phone className="h-2.5 w-2.5" /> {customer.phone}
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 py-2 space-y-4 flex-grow">
                 <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 opacity-50"/> État Crédit</span>
                        <span className="text-foreground">{limit > 0 ? formatCurrency(limit) : 'Illimité'}</span>
                    </div>
                    {limit > 0 && (
                        <Progress value={Math.min(100, creditUsage)} className={cn("h-1.5 bg-muted/30", creditUsage > 100 ? "[&>div]:bg-destructive" : creditUsage > 90 ? "[&>div]:bg-amber-500" : "")} />
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground opacity-60 mb-1">Total Dépensé</p>
                        <p className="font-black text-sm">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                    <div className={cn(
                        "p-3 rounded-2xl border transition-all",
                        balance > 0 ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border/50"
                    )}>
                        <p className={cn("text-[9px] font-black uppercase tracking-tighter opacity-60 mb-1", balance > 0 ? "text-destructive" : "text-muted-foreground")}>Dette Actuelle</p>
                        <p className={cn("font-black text-sm", balance > 0 ? "text-destructive" : "")}>{formatCurrency(balance)}</p>
                    </div>
                 </div>
            </CardContent>

            <CardFooter className="p-5 pt-3 border-t border-white/5 bg-muted/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase opacity-50">
                    <Calendar className="h-3 w-3" />
                    <span>{isMounted && customer.lastActivityDate ? formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr }) : 'Aucun achat'}</span>
                </div>
                <Button variant="ghost" size="sm" asChild className="h-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
                    <Link href={`/customers/${customer.uuid}`}>
                        Détails <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
});
CustomerCard.displayName = 'CustomerCard';
