'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Sale } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Hash, User, Calendar, Receipt, Package, Banknote, X, Info, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SaleDetailsDialog({
    isOpen,
    onOpenChange,
    sale,
    customerName,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    customerName?: string;
}) {
    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl rounded-lg border-none shadow-sm p-0 overflow-hidden bg-card">
                <DialogHeader className="bg-primary/5 p-4 border-b border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold tracking-tight">Détails de la Vente</DialogTitle>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 bg-muted/20 px-2 py-0.5 rounded-lg border border-white/5 shadow-inner">
                                    <Hash className="h-3 w-3" /> {sale.invoiceNumber}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 shadow-inner">
                                    <User className="h-3 w-3" /> {customerName || 'Client de passage'}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide mb-1 flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" /> Émise le
                            </p>
                            <p className="font-bold text-xs">{format(safeToDate(sale.createdAt!), 'dd MMM yyyy, HH:mm', { locale: fr })}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide mb-1 flex items-center gap-1.5">
                                <Package className="h-3 w-3" /> Articles
                            </p>
                            <p className="font-bold text-xs">{sale.items?.length || 0} positions</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide mb-1 flex items-center gap-1.5">
                                <Banknote className="h-3 w-3" /> Statut
                            </p>
                            <p className={cn(
                                "font-semibold text-[10px] uppercase",
                                sale.paymentStatus === 'paid' ? "text-emerald-500" : "text-destructive"
                            )}>
                                {sale.paymentStatus === 'paid' ? 'Soldée' : 'Impayée'}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                            <p className="text-[10px] uppercase font-semibold opacity-70 tracking-wide mb-1">Total Net</p>
                            <p className="text-lg font-semibold">{formatCurrency(sale.total)}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 ml-1">
                            <div className="p-1 rounded-lg bg-primary/10 text-primary shadow-inner"><Package className="h-3 w-3" /></div>
                            <h4 className="text-[10px] font-semibold uppercase text-muted-foreground opacity-60">Manifeste des Articles</h4>
                        </div>
                        <div className="rounded-3xl border border-white/5 bg-black/20 overflow-hidden shadow-inner">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="border-none">
                                        <TableHead className="font-semibold text-[9px] uppercase tracking-wide p-4">Désignation</TableHead>
                                        <TableHead className="text-center font-semibold text-[9px] uppercase tracking-wide p-4">Qté</TableHead>
                                        <TableHead className="text-right font-semibold text-[9px] uppercase tracking-wide p-4">P.U</TableHead>
                                        <TableHead className="text-right font-semibold text-[9px] uppercase tracking-wide p-4">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sale.items?.map((item, index) => (
                                        <TableRow key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <TableCell className="p-4 font-bold text-sm tracking-tight">{item.name}</TableCell>
                                            <TableCell className="p-4 text-center">
                                                <span className="px-2 py-1 rounded-md bg-muted/50 font-mono font-semibold text-xs">{item.quantity}</span>
                                            </TableCell>
                                            <TableCell className="p-4 text-right font-medium text-xs text-muted-foreground/60">{formatCurrency(item.price)}</TableCell>
                                            <TableCell className="p-4 text-right font-semibold text-sm tracking-tighter">{formatCurrency(item.price * item.quantity)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 pt-4">
                        <div className="space-y-4">
                            <div className="p-6 bg-muted/20 rounded-lg border border-dashed border-white/10 space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-primary/60">
                                    <Info className="h-3 w-3" /> Audit financier
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground/60">
                                        <span className="uppercase tracking-wide">Sous-total</span>
                                        <span className="font-mono">{formatCurrency(sale.subtotal)}</span>
                                    </div>
                                    {sale.discountAmount && sale.discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-xs font-semibold text-amber-600">
                                            <span className="uppercase tracking-wide flex items-center gap-1">
                                                Remise {sale.discountType === 'percentage' && `(${Math.round((sale.discountAmount / sale.subtotal) * 100)}%)`}
                                            </span>
                                            <span className="font-mono">- {formatCurrency(sale.discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/10 my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total à régler</span>
                                        <span className="text-xl font-semibold text-primary tracking-tighter">{formatCurrency(sale.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 flex flex-col justify-center">
                            <div className="p-6 bg-emerald-500/5 rounded-lg border border-emerald-500/10 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-semibold uppercase text-emerald-600/60 tracking-wide">Montant Encaissé</p>
                                    <p className="text-lg font-semibold text-emerald-600 tracking-tighter">{formatCurrency(sale.amountPaid)}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-emerald-500/20" />
                            </div>
                            
                            <div className={cn(
                                "p-6 rounded-lg border flex justify-between items-center",
                                sale.remainingBalance > 0 ? "bg-destructive/5 border-destructive/10" : "bg-primary/5 border-primary/10"
                            )}>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-semibold uppercase tracking-wide opacity-60">
                                        {sale.remainingBalance > 0 ? 'Solde Débiteur' : 'Monnaie Rendue'}
                                    </p>
                                    <p className={cn(
                                        "text-lg font-semibold tracking-tighter",
                                        sale.remainingBalance > 0 ? "text-destructive" : "text-primary"
                                    )}>
                                        {formatCurrency(Math.abs(sale.remainingBalance))}
                                    </p>
                                </div>
                                {sale.remainingBalance > 0 ? <AlertCircle className="h-8 w-8 text-destructive/20" /> : <Sparkles className="h-8 w-8 text-primary/20" />}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-card border-t border-white/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-9 rounded-2xl font-semibold text-xs uppercase tracking-wide px-8 w-full sm:w-auto">
                        <X className="mr-2 h-4 w-4" /> Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
