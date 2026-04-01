
'use client';

import type { Product, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CalendarClock, Info, Package } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { useMemo } from 'react';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ProductTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    selectedProducts: Set<string>;
    onToggleProductSelection: (productUuid: string) => void;
    onToggleSelectAll: () => void;
    suppliers: Supplier[];
}

export function ProductTable({ products, onEdit, onDelete, selectedProducts, onToggleProductSelection, onToggleSelectAll, suppliers }: ProductTableProps) {
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.uuid, s.name])), [suppliers]);

    const handleRowClick = (product: Product) => {
        onEdit(product);
    };

    return (
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-[50px] px-4">
                           <Checkbox
                                checked={products.length > 0 && selectedProducts.size === products.length}
                                onCheckedChange={onToggleSelectAll}
                                disabled={products.length === 0}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Désignation</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Catégorie</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Fournisseur</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Stock</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">P.U Achat</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-primary">P.U Vente</TableHead>
                        <TableHead className="w-[50px] text-right"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map(product => {
                        const productUuid = product.uuid;

                        const expirationStatus = (() => {
                            if (!product.dateExpiration) return null;
                            const today = new Date();
                            const expirationDate = new Date(product.dateExpiration);
                            const daysUntilExpiration = differenceInDays(expirationDate, today);
                            if (daysUntilExpiration < 0) return { color: 'text-destructive', text: `Expiré` };
                            if (daysUntilExpiration <= 30) return { color: 'text-amber-500', text: `Expire dans ${daysUntilExpiration} j` };
                            return { color: 'text-muted-foreground/60', text: format(expirationDate, 'dd/MM/yyyy') };
                        })();
                        
                        const isPriceOld = product.dateMajPrix && differenceInDays(new Date(), new Date(product.dateMajPrix)) > 30;

                        return (
                            <TableRow 
                                key={productUuid} 
                                data-state={selectedProducts.has(productUuid) ? "selected" : ""}
                                onClick={() => handleRowClick(product)}
                                className={cn(
                                    "cursor-pointer hover:bg-muted/20 border-b border-border/50 transition-all",
                                    selectedProducts.has(productUuid) && "bg-primary/5"
                                )}
                            >
                                 <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedProducts.has(productUuid)}
                                        onCheckedChange={() => onToggleProductSelection(productUuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{product.name}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {expirationStatus && (
                                                <span className={cn("text-[9px] font-black uppercase flex items-center gap-1", expirationStatus.color)}>
                                                    <CalendarClock className="h-2.5 w-2.5" /> {expirationStatus.text}
                                                </span>
                                            )}
                                            {product.barcodes && product.barcodes.length > 0 && (
                                                <span className="text-[9px] font-mono text-muted-foreground/40">#{product.barcodes[0]}</span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-0.5 rounded-lg bg-muted/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                        {product.category || 'N/A'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-medium text-muted-foreground/70">
                                        {product.supplierUuid ? supplierMap.get(product.supplierUuid) : '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "inline-flex items-center justify-center px-2.5 py-1 rounded-xl font-mono font-black text-xs shadow-inner",
                                            product.quantity <= 0 ? "bg-destructive/10 text-destructive border border-destructive/20" : 
                                            product.quantity <= product.minStockLevel ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : 
                                            "bg-primary/10 text-primary border border-primary/20"
                                        )}>
                                            {product.quantity}
                                        </div>
                                        <span className="text-[9px] text-muted-foreground/50 uppercase font-black">{product.unite}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {isPriceOld && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3 w-3 text-amber-500 opacity-60" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="rounded-xl border-none shadow-xl bg-card">
                                                        <p className="text-[10px] font-bold">Dernière M.A.J: {product.dateMajPrix ? format(new Date(product.dateMajPrix), 'dd MMM yy', { locale: fr }) : 'Inconnue'}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        <span className="text-muted-foreground/80">{formatCurrency(product.purchasePrice)}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-base font-black text-primary tracking-tighter">
                                        {formatCurrency(product.price)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-xl">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                                            <DropdownMenuItem onClick={() => onEdit(product)}>
                                                <Edit className="mr-2 h-4 w-4" /> Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">
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
