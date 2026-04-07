'use client';

import React from 'react';
import type { Customer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Phone, User, ChevronRight, Wheat, Landmark } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    selectedCustomers: Set<string>;
    onToggleSelection: (uuid: string) => void;
    onToggleSelectAll: () => void;
}

export function CustomerTable({ 
    customers, 
    onEdit, 
    onDelete, 
    selectedCustomers, 
    onToggleSelection, 
    onToggleSelectAll 
}: CustomerTableProps) {
    return (
        <div className="rounded-[2.5rem] border border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="w-[60px] px-6">
                           <Checkbox
                                checked={customers.length > 0 && selectedCustomers.size === customers.length}
                                onCheckedChange={onToggleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Identité Client</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Coordonnées</TableHead>
                        <TableHead className="p-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Total Consommé</TableHead>
                        <TableHead className="p-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-destructive">Solde Débiteur</TableHead>
                        <TableHead className="p-6 w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.map((customer) => {
                        const isSelected = selectedCustomers.has(customer.uuid);
                        const balance = customer.outstandingBalance || 0;

                        return (
                            <TableRow 
                                key={customer.uuid} 
                                onClick={() => onToggleSelection(customer.uuid)}
                                className={cn(
                                    "group transition-all border-b border-white/5 cursor-pointer",
                                    isSelected ? "bg-primary/10" : "hover:bg-primary/5"
                                )}
                            >
                                <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(customer.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col -space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-base tracking-tighter group-hover:text-primary transition-colors">
                                                    {customer.firstName} {customer.lastName}
                                                </span>
                                                {customer.isBreadClient && <Wheat className="h-3 w-3 text-primary/40" />}
                                            </div>
                                            <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">
                                                ID: {customer.uuid.substring(0,8)}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex flex-col -space-y-0.5">
                                        {customer.phone ? (
                                            <span className="text-sm font-bold tracking-tight flex items-center gap-2">
                                                <Phone className="h-3 w-3 text-primary/40" /> {customer.phone}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/20 italic">Aucun contact</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-right font-mono text-xs text-muted-foreground/40">
                                    {formatCurrency(customer.totalSpent)}
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl font-mono font-black text-sm shadow-inner border transition-all",
                                        balance > 0 ? "bg-destructive/5 text-destructive border-destructive/20" : "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                                    )}>
                                        {balance > 0 && <Landmark className="h-3 w-3" />}
                                        {formatCurrency(balance)}
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted group-hover:bg-background/50 transition-all">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl bg-card">
                                            <DropdownMenuItem asChild className="rounded-xl p-3">
                                                <Link href={`/customers/${customer.uuid}`}>
                                                    <FileText className="mr-2 h-4 w-4" /> Voir dossier
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
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}