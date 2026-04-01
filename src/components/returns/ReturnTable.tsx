
'use client';

import React from 'react';
import type { ProductReturn, Customer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Hash, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface ReturnTableProps {
    returns: ProductReturn[];
    customerMap: Map<string, Customer>;
    selectedReturns: Set<string>;
    onToggleSelection: (uuid: string) => void;
    onViewDetails: (pr: ProductReturn) => void;
    onCancel: (pr: ProductReturn) => void;
}

export function ReturnTable({ returns, customerMap, selectedReturns, onToggleSelection, onViewDetails, onCancel }: ReturnTableProps) {
    return (
        <div className="rounded-2xl border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="w-[40px] px-4"></TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Date & Heure</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Facture Origine</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Client</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">Remboursé</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-primary">Valeur Retour</TableHead>
                        <TableHead className="w-[50px] text-right"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {returns.map((r) => {
                        const customer = r.customerUuid ? customerMap.get(r.customerUuid) : undefined;
                        const isSelected = selectedReturns.has(r.uuid);

                        return (
                            <TableRow 
                                key={r.uuid} 
                                className={cn(
                                    "group transition-all border-b border-border/50 cursor-pointer",
                                    isSelected ? "bg-primary/10" : "hover:bg-muted/30"
                                )}
                                onClick={() => onToggleSelection(r.uuid)}
                            >
                                <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(r.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs">{format(safeToDate(r.createdAt!), 'dd MMM yyyy', { locale: fr })}</span>
                                            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter opacity-60">
                                                {format(safeToDate(r.createdAt!), 'HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-3 w-3 text-muted-foreground/40" />
                                        <span className="font-mono text-xs font-black tracking-tight">{r.originalInvoiceNumber}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <User className="h-3 w-3 text-muted-foreground/40" />
                                        <span className="font-bold text-sm truncate max-w-[150px]">
                                            {customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-xs text-emerald-500 font-mono font-bold">{formatCurrency(r.amountRefunded)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black text-primary text-sm font-mono">{formatCurrency(r.totalReturnValue)}</span>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                                            <DropdownMenuItem onClick={() => onViewDetails(r)} className="rounded-xl">
                                                <FileText className="mr-2 h-4 w-4" /> Détails
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCancel(r)} className="text-destructive focus:text-destructive rounded-xl">
                                                <Trash2 className="mr-2 h-4 w-4" /> Annuler
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
