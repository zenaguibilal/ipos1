
'use client';

import type { StockIntake, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Hash, Calendar, Building, ShoppingBag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';

interface StockIntakeTableProps {
    intakes: StockIntake[];
    supplierMap: Map<string, Supplier>;
    onViewDetails: (intake: StockIntake) => void;
    onCancelIntake: (intake: StockIntake) => void;
}

export function StockIntakeTable({ intakes, supplierMap, onViewDetails, onCancelIntake }: StockIntakeTableProps) {
    return (
        <div className="rounded-[2rem] border border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Fournisseur</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Identifiant Bon</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Date</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Volume</TableHead>
                        <TableHead className="p-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-primary">Valeur Elite</TableHead>
                        <TableHead className="p-6 w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {intakes.map(intake => {
                        const supplierName = intake.supplierUuid ? supplierMap.get(intake.supplierUuid)?.name : 'Partenaire Inconnu';
                        return (
                            <TableRow key={intake.uuid} className="group hover:bg-primary/5 border-b border-white/5 transition-all duration-300">
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shadow-inner">
                                            <Building className="h-4 w-4" />
                                        </div>
                                        <span className="font-black text-sm tracking-tight group-hover:text-primary transition-colors">{supplierName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground/60">
                                        <Hash className="h-3 w-3 opacity-30" />
                                        {intake.invoiceNumber || 'No Ref'}
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <span className="text-xs font-bold">{format(safeToDate(intake.createdAt!), 'dd MMM yyyy', { locale: fr })}</span>
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-muted/50 border border-white/5 shadow-inner">
                                        <ShoppingBag className="h-3 w-3 opacity-30" />
                                        <span className="text-xs font-black">{intake.items.length}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <span className="text-base font-black text-primary tracking-tighter">{formatCurrency(intake.totalValue)}</span>
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted group-hover:bg-background/50 transition-all">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl bg-card">
                                            <DropdownMenuItem onClick={() => onViewDetails(intake)} className="rounded-xl p-3">
                                                <FileText className="mr-2 h-4 w-4" /> Voir détails
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCancelIntake(intake)} className="text-destructive focus:text-destructive rounded-xl p-3">
                                                <Trash2 className="mr-2 h-4 w-4" /> Annuler réception
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
