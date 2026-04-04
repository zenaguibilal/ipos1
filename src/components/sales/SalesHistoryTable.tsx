'use client';

import React from 'react';
import type { Sale, Customer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Printer, CheckCircle, AlertCircle, Clock, Hash, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';

interface SalesHistoryTableProps {
    sales: Sale[];
    customerMap: Map<string, Customer>;
    selectedSales: Set<string>;
    onToggleSelection: (uuid: string) => void;
    onViewDetails: (sale: Sale) => void;
    onPrint: (sale: Sale) => void;
    onCancel: (sale: Sale) => void;
}

export function SalesHistoryTable({ 
    sales, 
    customerMap, 
    selectedSales,
    onToggleSelection,
    onViewDetails, 
    onPrint, 
    onCancel 
}: SalesHistoryTableProps) {
    const statusMap = {
        paid: { text: 'Payé', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        partial: { text: 'Partiel', icon: AlertCircle, className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        unpaid: { text: 'Dette', icon: Clock, className: 'bg-destructive/10 text-destructive border-destructive/20' },
    };

    const handleSelectAll = () => {
        const allUuids = sales.map(s => s.uuid);
        if (selectedSales.size === sales.length) {
            allUuids.forEach(uuid => { if(selectedSales.has(uuid)) onToggleSelection(uuid) });
        } else {
            allUuids.forEach(uuid => { if(!selectedSales.has(uuid)) onToggleSelection(uuid) });
        }
    };

    return (
        <div className="rounded-[2.5rem] border border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="w-[60px] px-6">
                           <Checkbox
                                checked={sales.length > 0 && selectedSales.size === sales.length}
                                onCheckedChange={handleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Horodatage</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">N° Facture</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Partenaire Client</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Règlement</TableHead>
                        <TableHead className="p-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Reçu</TableHead>
                        <TableHead className="p-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-primary">Total Facturé</TableHead>
                        <TableHead className="p-6 w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sales.map((sale) => {
                        const customer = sale.customerUuid ? customerMap.get(sale.customerUuid) : undefined;
                        const status = statusMap[sale.paymentStatus];
                        const isSelected = selectedSales.has(sale.uuid);

                        return (
                            <TableRow 
                                key={sale.uuid} 
                                onClick={() => onToggleSelection(sale.uuid)}
                                className={cn(
                                    "group transition-all border-b border-white/5 cursor-pointer",
                                    isSelected ? "bg-primary/10" : "hover:bg-primary/5"
                                )}
                            >
                                <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(sale.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell className="p-6 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-black/20 text-muted-foreground/40 shadow-inner">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col -space-y-0.5">
                                            <span className="font-bold text-xs">{format(safeToDate(sale.createdAt!), 'dd MMM yyyy', { locale: fr })}</span>
                                            <span className="text-[9px] text-muted-foreground/40 uppercase font-black tracking-widest">{format(safeToDate(sale.createdAt!), 'HH:mm')}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground/60 bg-muted/20 px-3 py-1.5 rounded-xl w-fit border border-white/5">
                                        <Hash className="h-3 w-3 opacity-30" />
                                        {sale.invoiceNumber}
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/5 text-primary/40">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <span className="font-black tracking-tight text-sm group-hover:text-primary transition-colors">
                                            {customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <Badge variant="outline" className={cn("gap-1.5 px-3 py-1 rounded-xl border font-black text-[9px] uppercase tracking-tighter shadow-sm", status.className)}>
                                        <status.icon className="h-3 w-3" />
                                        {status.text}
                                    </Badge>
                                </TableCell>
                                <TableCell className="p-6 text-right font-mono text-xs text-muted-foreground/40">
                                    {formatCurrency(sale.amountPaid)}
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <span className="font-black text-primary text-base tracking-tighter font-mono">
                                        {formatCurrency(sale.total)}
                                    </span>
                                </TableCell>
                                <TableCell className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted group-hover:bg-background/50 transition-all">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl bg-card">
                                            <DropdownMenuItem onClick={() => onViewDetails(sale)} className="rounded-xl p-3">
                                                <FileText className="mr-2 h-4 w-4" /> Détails Elite
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onPrint(sale)} className="rounded-xl p-3">
                                                <Printer className="mr-2 h-4 w-4" /> Imprimer Reçu
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCancel(sale)} className="text-destructive focus:text-destructive rounded-xl p-3">
                                                <Trash2 className="mr-2 h-4 w-4" /> Annuler Vente
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
