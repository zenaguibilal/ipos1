
'use client';

import React from 'react';
import type { ProductReturn } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Clock, Hash, User, PackageOpen, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface ReturnHistoryCardProps {
    productReturn: ProductReturn;
    customerName?: string;
    isSelected: boolean;
    onToggleSelection: () => void;
    onViewDetails: (pr: ProductReturn) => void;
    onCancelReturn: (pr: ProductReturn) => void;
}

const ReturnHistoryCardComponent = ({ 
    productReturn, 
    customerName, 
    isSelected,
    onToggleSelection,
    onViewDetails, 
    onCancelReturn 
}: ReturnHistoryCardProps) => {

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
                        <DropdownMenuItem onClick={() => onViewDetails(productReturn)} className="rounded-xl">
                            <FileText className="mr-2 h-4 w-4" /> Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelReturn(productReturn)} className="text-destructive focus:text-destructive rounded-xl">
                            <Trash2 className="mr-2 h-4 w-4" /> Annuler le retour
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-5 pb-2 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground/50 flex items-center gap-1 uppercase tracking-widest">
                        <Hash className="h-2.5 w-2.5" /> Origine: {productReturn.originalInvoiceNumber}
                    </span>
                </div>
                <CardTitle className="text-lg font-black leading-tight tracking-tight group-hover:text-primary transition-colors truncate pr-12">
                    {customerName || 'Client de passage'}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                    <Clock className="h-3 w-3" />
                    {format(safeToDate(productReturn.createdAt!), 'd MMM, HH:mm', { locale: fr })}
                </div>
            </CardHeader>

            <CardContent className="p-5 py-2 space-y-3 flex-grow">
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground opacity-60 mb-1 flex items-center gap-1">
                            <PackageOpen className="h-2.5 w-2.5" /> Articles
                        </p>
                        <p className="font-black text-sm">{productReturn.items.length} Type(s)</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-emerald-600 opacity-60 mb-1 flex items-center gap-1">
                            <Banknote className="h-2.5 w-2.5" /> Remboursé
                        </p>
                        <p className="font-black text-sm text-emerald-600">
                            {formatCurrency(productReturn.amountRefunded)}
                        </p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-5 pt-3 flex justify-between items-end border-t border-white/5 bg-muted/5">
                 <div className="space-y-0.5">
                    <p className="text-2xl font-black text-primary tracking-tighter leading-none">{formatCurrency(productReturn.totalReturnValue)}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">Valeur Marchandise</p>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(productReturn); }} className="h-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary">
                    Détails
                </Button>
            </CardFooter>
        </Card>
    );
}

export const ReturnHistoryCard = React.memo(ReturnHistoryCardComponent);
