'use client';

import React, { useState, useEffect } from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Phone, BellRing, ShieldCheck, Calendar, Hourglass, User, ChevronRight, Wheat, MessageCircle, History } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from '../ui/checkbox';

interface CustomerCardProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
    isSelectionActive: boolean;
}

const DebtStatusIcon = ({ status }: { status: Customer['debtStatus']}) => {
    switch (status) {
        case 'overdue':
            return (
                <div className="p-1.5 bg-destructive/20 rounded-xl">
                    <BellRing className="h-4 w-4 text-destructive animate-pulse" />
                </div>
            );
        case 'due_soon':
             return (
                <div className="p-1.5 bg-amber-500/20 rounded-xl">
                    <Hourglass className="h-4 w-4 text-amber-500" />
                </div>
            );
        default:
            return null;
    }
};

const CustomerCardComponent = ({ customer, onEdit, onDelete, isSelected, onToggleSelection, isSelectionActive }: CustomerCardProps) => {
    const [isMounted, setIsMounted] = useState(false);
    
    const balance = customer.outstandingBalance || 0;
    const limit = customer.creditLimit || 0;
    const creditUsage = limit > 0 ? (balance / limit) * 100 : 0;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!customer.phone) return;
        const message = encodeURIComponent(`Bonjour ${customer.firstName}, c'est iPOS. Votre solde actuel est de ${formatCurrency(balance)}. Merci.`);
        window.open(`https://wa.me/${customer.phone}?text=${message}`, '_blank');
    };

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input[type="checkbox"]') || target.closest('[role="menuitem"]')) {
            return;
        }

        if (isSelectionActive) {
            onToggleSelection();
        } else {
            onEdit(customer);
        }
    };

    return (
        <Card 
            onClick={handleCardClick}
            className={cn(
                "app-card group flex flex-col transition-all duration-500 bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden rounded-lg cursor-pointer",
                isSelected ? "ring-2 ring-primary border-primary/30 shadow-sm scale-[1.02]" : "hover:bg-primary/5"
            )}
        >
            <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                <User className="h-32 w-32 rotate-12" />
            </div>

            {/* Actions isolated container */}
            <div 
                className="absolute top-4 right-4 z-10 flex gap-2 items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-1.5 bg-background/80 backdrop-blur-md rounded-xl border border-white/5 shadow-sm flex items-center justify-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                    />
                </div>
                {customer.phone && (
                    <Button variant="secondary" size="icon" onClick={handleWhatsApp} className="h-9 w-9 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border-white/5 shadow-xl rounded-xl transition-all">
                        <MessageCircle className="h-5 w-5" />
                    </Button>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-9 w-9 bg-background/80 backdrop-blur-md border-white/5 shadow-xl rounded-xl transition-all"
                        >
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-sm bg-card">
                        <DropdownMenuItem asChild className="rounded-xl p-3">
                            <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                                <FileText className="mr-2 h-4 w-4" /> Voir le dossier
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(customer)} className="rounded-xl p-3">
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive rounded-xl p-3">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-6 pb-2 space-y-3 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-2xl bg-muted text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary shadow-inner",
                        balance > 0 && "bg-primary/5 text-primary"
                    )}>
                        <User className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 pr-12">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-xl font-semibold leading-tight tracking-tighter group-hover:text-primary transition-colors truncate">
                                {customer.firstName} {customer.lastName}
                            </CardTitle>
                            {customer.isBreadClient && <Wheat className="h-3 w-3 text-primary opacity-50" />}
                        </div>
                        {customer.phone ? (
                            <p className="text-[10px] font-semibold text-muted-foreground/40 mt-1 flex items-center gap-1.5 uppercase tracking-wide">
                                <Phone className="h-2.5 w-2.5" /> {customer.phone}
                            </p>
                        ) : (
                            <p className="text-[10px] font-semibold text-muted-foreground/20 mt-1 uppercase tracking-wide italic">Aucun contact</p>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 py-4 space-y-5 relative z-10">
                 <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-semibold uppercase text-muted-foreground/60">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 opacity-50"/> Ligne de Crédit</span>
                        <span className="text-foreground">{limit > 0 ? formatCurrency(limit) : 'ILLIMITÉ'}</span>
                    </div>
                    {limit > 0 && (
                        <div className="relative">
                            <Progress value={Math.min(100, creditUsage)} className={cn("h-1.5 bg-black/20 shadow-inner", creditUsage > 100 ? "[&>div]:bg-destructive" : creditUsage > 90 ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary")} />
                        </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-black/20 border border-white/5 shadow-inner">
                        <p className="text-[8px] font-semibold uppercase text-muted-foreground/40 mb-1.5">Consommation</p>
                        <p className="font-semibold text-sm tracking-tight">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                    <div className={cn(
                        "p-4 rounded-3xl border transition-all duration-500 shadow-inner",
                        balance > 0 ? "bg-destructive/5 border-destructive/20" : "bg-black/20 border-white/5"
                    )}>
                        <div className="flex justify-between items-start mb-1.5">
                            <p className={cn("text-[8px] font-semibold uppercase", balance > 0 ? "text-destructive/70" : "text-muted-foreground/40")}>Solde Actuel</p>
                            {customer.initialBalance > 0 && (
                                <History className="h-2.5 w-2.5 text-primary opacity-40" />
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className={cn("font-semibold text-sm tracking-tight", balance > 0 ? "text-destructive" : "")}>{formatCurrency(balance)}</p>
                            <DebtStatusIcon status={customer.debtStatus} />
                        </div>
                    </div>
                 </div>
            </CardContent>

            <CardFooter className="p-6 pt-4 border-t border-white/5 bg-muted/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-[9px] font-semibold text-muted-foreground/30 uppercase ">
                    <Calendar className="h-3 w-3 opacity-50" />
                    <span>{isMounted && customer.lastActivityDate ? formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr }) : 'Aucun flux'}</span>
                </div>
                <Button variant="ghost" size="sm" asChild className="h-9 rounded-xl font-semibold text-[10px] uppercase tracking-wide hover:bg-primary/10 hover:text-primary transition-all px-4" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                        Dossier <ChevronRight className="ml-1 h-3 w-3 opacity-50" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

export const CustomerCard = React.memo(CustomerCardComponent);
