'use client';

import React from 'react';
import type { Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { HandCoins, Edit, Trash2, Phone, Building, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SupplierTableProps {
    suppliers: Supplier[];
    onPay: (supplier: Supplier) => void;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
}

export function SupplierTable({ suppliers, onPay, onEdit, onDelete }: SupplierTableProps) {
    return (
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-bold">Nom du Fournisseur</TableHead>
                        <TableHead className="font-bold">Contact / Tél</TableHead>
                        <TableHead className="text-right font-bold">Solde (Dette)</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.map((supplier) => (
                        <TableRow key={supplier.uuid} className="group hover:bg-muted/20 transition-all border-b border-border/50">
                            <TableCell>
                                <Link href={`/stock/suppliers/${supplier.uuid}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <Building className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black tracking-tight">{supplier.name}</span>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">Voir les détails <ChevronRight className="h-2 w-2" /></span>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{supplier.contactPerson || '-'}</span>
                                    {supplier.phone && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {supplier.phone}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className={cn(
                                    "px-3 py-1.5 rounded-xl font-mono font-black text-sm shadow-inner",
                                    supplier.balance > 0 ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                )}>
                                    {formatCurrency(supplier.balance)}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 text-primary hover:bg-primary/10"
                                        onClick={() => onPay(supplier)}
                                        disabled={supplier.balance <= 0}
                                        title="Régler une dette"
                                    >
                                        <HandCoins className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 hover:bg-muted"
                                        onClick={() => onEdit(supplier)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                        onClick={() => onDelete(supplier)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {suppliers.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                Aucun fournisseur enregistré.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
