'use client';

import React, { useState, useEffect } from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Phone, BellRing, Hourglass, User, ChevronRight, MessageCircle } from 'lucide-react';
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
        const message = encodeURIComponent(`Bonjour ${customer.firstName}, votre solde actuel est de ${formatCurrency(balance)}.`);
        window.open(`https://wa.me/${customer.phone}?text=${message}`, '_blank');
    };

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input[type="checkbox"]') || target.closest('[role="menuitem"]')) return;
        if (isSelectionActive) onToggleSelection();
        else onEdit(customer);
    };

    return (
        <Card 
            onClick={handleCardClick}
            className={cn(
                "group flex flex-col border shadow-sm transition-all duration-300 rounded-2xl cursor-pointer relative overflow-hidden",
                isSelected ? "ring-2 ring-primary border-primary/20 shadow-md bg-primary/5" : "bg-card hover:border-primary/20"
            )}
        >
            <div className="absolute top-4 right-4 flex gap-2 items-center z-10">
                <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} className="h-5 w-5 rounded-md" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                        <DropdownMenuItem asChild className="rounded-lg p-2 text-xs font-bold">
                            <Link href={`/customers/${customer.uuid}`}><FileText className="mr-2 h-3.5 w-3.5" /> Dossier</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(customer)} className="rounded-lg p-2 text-xs font-bold">
                            <Edit className="mr-2 h-3.5 w-3.5" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive rounded-lg p-2 text-xs font-bold">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-5 pb-2">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2.5 rounded-xl transition-all shadow-inner",
                        balance > 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    )}>
                        <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 pr-12">
                        <CardTitle className="text-base font-black leading-tight truncate">
                            {customer.firstName} {customer.lastName}
                        </CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground/50 mt-0.5 truncate uppercase tracking-wider">
                            {customer.phone || 'Sans contact'}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 py-3 space-y-4">
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <span>Utilisation Crédit</span>
                        <span className={cn(creditUsage > 90 ? "text-destructive" : "text-primary")}>{creditUsage.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, creditUsage)} className="h-1 bg-muted [&>div]:bg-primary" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/20 border shadow-inner">
                        <p className="text-[8px] font-black uppercase text-muted-foreground/40 mb-1">Achats</p>
                        <p className="font-bold text-xs truncate">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                    <div className={cn(
                        "p-3 rounded-xl border shadow-inner transition-all",
                        balance > 0 ? "bg-destructive/5 border-destructive/10" : "bg-emerald-500/5 border-emerald-500/10"
                    )}>
                        <p className={cn("text-[8px] font-black uppercase mb-1", balance > 0 ? "text-destructive/60" : "text-emerald-600/60")}>Dette</p>
                        <p className={cn("font-black text-xs truncate", balance > 0 ? "text-destructive" : "text-emerald-600")}>{formatCurrency(balance)}</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 px-5 pt-3 border-t bg-muted/5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">
                    {isMounted && customer.lastActivityDate ? formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr }) : 'Aucun flux'}
                </span>
                <div className="flex gap-2">
                    {customer.phone && (
                        <Button variant="ghost" size="icon" onClick={handleWhatsApp} className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 rounded-lg">
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-primary/10 px-3">
                        <Link href={`/customers/${customer.uuid}`}>Profil <ChevronRight className="ml-1 h-3 w-3" /></Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export const CustomerCard = React.memo(CustomerCardComponent);
