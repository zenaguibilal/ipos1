'use client';

import type { Product, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CalendarClock, Info, Package, Copy, History, Building, Hash, Tag } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { useMemo } from 'react';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';

interface ProductTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDuplicate: (product: Product) => void;
    onHistory: (product: Product) => void;
    onDelete: (product: Product) => void;
    selectedProducts: Set<string>;
    onToggleProductSelection: (productUuid: string) => void;
    onToggleSelectAll: () => void;
    suppliers: Supplier[];
}

export function ProductTable({ products, onEdit, onDuplicate, onHistory, onDelete, selectedProducts, onToggleProductSelection, onToggleSelectAll, suppliers }: ProductTableProps) {
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.uuid, s.name])), [suppliers]);

    return (
        <div className="rounded-[2.5rem] border border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="w-[60px] px-6">
                           <Checkbox
                                checked={products.length > 0 && selectedProducts.size === products.length}
                                onCheckedChange={onToggleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Produit / Partenaire</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Catégorie</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">État Flux</TableHead>
                        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Stock Elite</TableHead>
                        <TableHead className="p-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">P.U Achat</TableHead>
                        <TableHead className="p-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-primary">P.U Vente</TableHead>
                        <TableHead className="p-6 w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map(product => {
                        const productUuid = product.uuid;
                        const isSelected = selectedProducts.has(productUuid);

                        const expirationStatus = (() => {
                            if (!product.dateExpiration) return null;
                            const today = new Date();
                            const expirationDate = new Date(product.dateExpiration);
                            const daysUntilExpiration = differenceInDays(expirationDate, today);
                            if (daysUntilExpiration < 0) return { color: 'text-destructive', text: `EXPIRÉ`, bg: 'bg-destructive/10' };
                            if (daysUntilExpiration <= 30) return { color: 'text-amber-500', text: `DANS ${daysUntilExpiration}J`, bg: 'bg-amber-500/10' };
                            return { color: 'text-muted-foreground/40', text: format(expirationDate, 'dd/MM/yy'), bg: 'bg-muted/50' };
                        })();
                        
                        const isPriceOld = product.dateMajPrix && differenceInDays(new Date(), new Date(product.dateMajPrix)) > 30;

                        return (
                            <TableRow 
                                key={productUuid} 
                                onClick={() => onToggleProductSelection(productUuid)}
                                className={cn(
                                    "group transition-all border-b border-white/5 cursor-pointer",
                                    isSelected ? "bg-primary/10" : "hover:bg-primary/5"
                                )}
                            >
                                 <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleProductSelection(productUuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col -space-y-0.5">
                                            <span className="font-black text-base tracking-tighter group-hover:text-primary transition-colors">{product.name}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                {product.supplierUuid && (
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground/40 flex items-center gap-1 tracking-widest">
                                                        <Building className="h-2.5 w-2.5" /> {supplierMap.get(product.supplierUuid)}
                                                    </span>
                                                )}
                                                {product.barcodes && product.barcodes.length > 0 && (
                                                    <span className="text-[9px] font-mono font-bold text-muted-foreground/20 flex items-center gap-1">
                                                        <Hash className="h-2.5 w-2.5" /> {product.barcodes[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <Badge variant="outline" className="gap-2 px-3 py-1.5 rounded-xl border-white/10 bg-muted/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        <Tag className="h-3 w-3" /> {product.category || 'Général'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    {expirationStatus ? (
                                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase h-6 px-3 border-none shadow-sm", expirationStatus.color, expirationStatus.bg)}>
                                            {expirationStatus.text}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[8px] font-black uppercase h-6 px-3 text-muted-foreground/20 border-white/5 bg-black/20">STABLE</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "inline-flex items-center justify-center px-4 py-1.5 rounded-2xl font-mono font-black text-sm shadow-inner border transition-all",
                                            product.quantity <= 0 ? "bg-destructive/10 text-destructive border-destructive/20" : 
                                            product.quantity <= product.minStockLevel ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : 
                                            "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                                        )}>
                                            {product.quantity}
                                        </div>
                                        <span className="text-[9px] text-muted-foreground/30 uppercase font-black tracking-tighter">{product.unite}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-right font-mono text-xs">
                                    <div className="flex items-center justify-end gap-2">
                                        {isPriceOld && <Info className="h-3 w-3 text-amber-500 opacity-40" />}
                                        <span className="text-muted-foreground/40">{formatCurrency(product.purchasePrice)}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <span className="text-lg font-black text-primary tracking-tighter">
                                        {formatCurrency(product.price)}
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
                                            <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-xl p-3"><Edit className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDuplicate(product)} className="rounded-xl p-3"><Copy className="mr-2 h-4 w-4" /> Dupliquer</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onHistory(product)} className="rounded-xl p-3"><History className="mr-2 h-4 w-4" /> Historique</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive rounded-xl p-3"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
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