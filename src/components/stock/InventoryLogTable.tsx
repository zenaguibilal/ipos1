'use client';

import React from 'react';
import type { InventoryLog } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, ShoppingCart, Undo2, Archive, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryLogTableProps {
    logs: (InventoryLog & { productName: string })[];
}

const reasonConfig: Record<string, { label: string, icon: React.ElementType, color: string }> = {
    'sale': { label: 'Vente', icon: ShoppingCart, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    'return': { label: 'Retour', icon: Undo2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    'stock_intake': { label: 'Réception', icon: Archive, color: 'text-primary bg-primary/10 border-primary/20' },
    'cancellation': { label: 'Annulation', icon: RefreshCcw, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    'manual_adjustment': { label: 'Ajustement', icon: AlertTriangle, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
};

export function InventoryLogTable({ logs }: InventoryLogTableProps) {
    return (
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-[180px]">Date & Heure</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead className="w-[150px]">Opération</TableHead>
                        <TableHead className="text-center w-[120px]">Variation</TableHead>
                        <TableHead className="text-center w-[120px]">Solde Final</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => {
                        const config = reasonConfig[log.reason] || { label: log.reason, icon: AlertTriangle, color: '' };
                        const isPositive = log.change > 0;

                        return (
                            <TableRow key={log.uuid} className="group hover:bg-muted/20 transition-all border-b border-border/50">
                                <TableCell className="whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs">{format(new Date(log.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-60">
                                            {format(new Date(log.createdAt), 'HH:mm:ss')}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-black tracking-tight text-sm group-hover:text-primary transition-colors">{log.productName}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-1 rounded-xl border font-bold text-[10px] uppercase tracking-wider shadow-sm", config.color)}>
                                        <config.icon className="h-3 w-3" />
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className={cn(
                                        "inline-flex items-center gap-1 font-black text-sm px-3 py-1 rounded-full",
                                        isPositive ? "text-emerald-500 bg-emerald-500/5" : "text-destructive bg-destructive/5"
                                    )}>
                                        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                                        {isPositive ? `+${log.change}` : log.change}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 font-mono font-black text-sm shadow-inner min-w-[60px]">
                                        {log.newQuantity}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
