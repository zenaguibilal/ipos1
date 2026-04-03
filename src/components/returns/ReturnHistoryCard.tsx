'use client';

import React from 'react';
import type { ProductReturn } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Clock, Hash, Undo2, ChevronRight } from 'lucide-react';
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
                "luxury-card group flex flex-col transition-all duration-500 bg-card/40 backdrop-blur-xl border-white/5 relative overflow-hidden rounded-[2.5rem] cursor-pointer",
                isSelected ? "ring-2 ring-primary border-primary/30 shadow-2xl scale-[1.02]" : "hover:bg-primary/5"
            )}
        >
            <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                <Undo2 className="h-32 w-32 rotate-12" />
            </div>

            <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
                <div onClick={(e) => e.stopPropagation()} className="p-1.5 bg-background/80 backdrop-blur-md rounded-xl border border-white/5 shadow-sm">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="secondary" size="icon" className="h-9 w-9 bg-background/80 backdrop-blur-md border-white/5 shadow-xl rounded-xl transition-all">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl bg-card">
                        <DropdownMenuItem onClick={() => onViewDetails(productReturn)} className="rounded-xl p-3">
                            <FileText className="mr-2 h-4 w-4" /> Détails du retour
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelReturn(productReturn)} className="text-destructive focus:text-destructive rounded-xl p-3">
                            <Trash2 className="mr-2 h-4 w-4" /> Annuler le retour
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-6 pb-2 space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black text-muted-foreground/30 flex items-center gap-1 uppercase tracking-tighter">
                        <Hash className="h-2.5 w-2.5" /> Origine: {productReturn.originalInvoiceNumber}
                    </span>
                </div>
                <CardTitle className="text-xl font-black leading-tight tracking-tighter group-hover:text-primary transition-colors truncate pr-12">
                    {customerName || 'Client de passage'}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">
                    <Clock className="h-3 w-3 opacity-50" />
                    {format(safeToDate(productReturn.createdAt!), 'd MMMM, HH:mm', { locale: fr })}
                </div>
            </CardHeader>

            <CardContent className="p-6 py-4 space-y-5 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-black/20 border border-white/5 shadow-inner">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1.5">Volume Items</p>
                        <p className="font-black text-sm tracking-tight">{productReturn.items.length} Positions</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 shadow-inner">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600/70 mb-1.5">Remboursé</p>
                        <p className="font-black text-sm tracking-tight text-emerald-600">{formatCurrency(productReturn.amountRefunded)}</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-4 border-t border-white/5 bg-muted/5 flex items-center justify-between relative z-10">
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Valeur Marchande</p>
                    <p className="text-2xl font-black text-primary tracking-tighter leading-none">{formatCurrency(productReturn.totalReturnValue)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(productReturn); }} className="h-9 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all px-4">
                    Details <ChevronRight className="ml-1 h-3 w-3 opacity-50" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export const ReturnHistoryCard = React.memo(ReturnHistoryCardComponent);
