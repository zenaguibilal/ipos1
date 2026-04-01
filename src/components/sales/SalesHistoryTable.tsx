'use client';

import React from 'react';
import type { Sale, Customer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Printer, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface SalesHistoryTableProps {
    sales: Sale[];
    customerMap: Map<string, Customer>;
    onViewDetails: (sale: Sale) => void;
    onPrint: (sale: Sale) => void;
    onCancel: (sale: Sale) => void;
}

export function SalesHistoryTable({ sales, customerMap, onViewDetails, onPrint, onCancel }: SalesHistoryTableProps) {
    const statusMap = {
        paid: { text: 'Payé', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        partial: { text: 'Partiel', icon: AlertCircle, className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        unpaid: { text: 'Impayé', icon: Clock, className: 'bg-destructive/10 text-destructive border-destructive/20' },
    };

    return (
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Date & Heure</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">N° Facture</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Client</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Statut</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">Total</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">Payé</TableHead>
                        <TableHead className="w-[50px] text-right"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sales.map((sale) => {
                        const customer = sale.customerUuid ? customerMap.get(sale.customerUuid) : undefined;
                        const status = statusMap[sale.paymentStatus];

                        return (
                            <TableRow key={sale.uuid} className="group hover:bg-muted/20 transition-all border-b border-border/50">
                                <TableCell className="whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs">{format(safeToDate(sale.createdAt!), 'dd MMM yyyy', { locale: fr })}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase font-black opacity-60">
                                            {format(safeToDate(sale.createdAt!), 'HH:mm')}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-xs font-black tracking-tight">{sale.invoiceNumber}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm truncate max-w-[150px]">
                                            {customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("gap-1.5 px-2 py-0.5 rounded-xl border font-black text-[9px] uppercase tracking-tighter", status.className)}>
                                        <status.icon className="h-3 w-3" />
                                        {status.text}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black text-primary text-sm">{formatCurrency(sale.total)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-xs text-muted-foreground">{formatCurrency(sale.amountPaid)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                                            <DropdownMenuItem onClick={() => onViewDetails(sale)} className="rounded-xl">
                                                <FileText className="mr-2 h-4 w-4" /> Détails
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onPrint(sale)} className="rounded-xl">
                                                <Printer className="mr-2 h-4 w-4" /> Imprimer
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCancel(sale)} className="text-destructive focus:text-destructive rounded-xl">
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
