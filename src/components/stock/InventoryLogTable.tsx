'use client';

import React from 'react';
import type { InventoryLog } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, ShoppingCart, Undo2, Archive, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryLogTableProps {
    logs: (InventoryLog & { productName: string })[];
}

const reasonConfig: Record<string, { label: string, icon: React.ElementType, color: string }> = {
    'sale': { label: 'Vente', icon: ShoppingCart, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    'return': { label: 'Retour', icon: Undo2, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    'stock_intake': { label: 'Réception', icon: Archive, color: 'text-primary bg-primary/10 border-primary/20' },
    'cancellation': { label: 'Annulation', icon: RefreshCcw, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    'manual_adjustment': { label: 'Manuel', icon: AlertTriangle, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
};

export function InventoryLogTable({ logs }: InventoryLogTableProps) {
    return (
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead>Date & Heure</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Variation</TableHead>
                        <TableHead className="text-center">Nouveau Stock</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => {
                        const config = reasonConfig[log.reason] || { label: log.reason, icon: AlertTriangle, color: '' };
                        const isPositive = log.change > 0;

                        return (
                            <TableRow key={log.uuid} className="group hover:bg-muted/20 transition-colors">
                                <TableCell className="whitespace-nowrap font-medium">
                                    <div className="flex flex-col">
                                        <span>{format(new Date(log.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-bold tracking-tight text-sm">{log.productName}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("gap-1.5 px-2 py-0.5 rounded-lg border", config.color)}>
                                        <config.icon className="h-3 w-3" />
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center font-black">
                                    <div className={cn(
                                        "flex items-center justify-center gap-1 text-base",
                                        isPositive ? "text-green-500" : "text-destructive"
                                    )}>
                                        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                        {isPositive ? `+${log.change}` : log.change}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-muted font-mono font-bold text-sm">
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
