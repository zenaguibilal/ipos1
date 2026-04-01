
'use client';

import type { Product, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, AlertCircle, PackageX, CalendarClock, ImageIcon } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import Image from 'next/image';
import placeholders from '@/app/lib/placeholder-images.json';

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
                        <TableHead className="w-[60px]"></TableHead>
                        <TableHead className="font-bold">Désignation</TableHead>
                        <TableHead className="font-bold">Catégorie</TableHead>
                        <TableHead className="font-bold">Fournisseur</TableHead>
                        <TableHead className="font-bold">Stock</TableHead>
                        <TableHead className="text-right font-bold">P.U Achat</TableHead>
                        <TableHead className="text-right font-bold">P.U Vente</TableHead>
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
                            if (daysUntilExpiration <= 30) return { color: 'text-yellow-500', text: `Expire dans ${daysUntilExpiration} j` };
                            return { color: 'text-muted-foreground', text: new Date(expirationDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) };
                        })();
                        
                        const isPriceOld = product.dateMajPrix && differenceInDays(new Date(), new Date(product.dateMajPrix)) > 30;

                        // Determine the image
                        const defaultPlaceholder = placeholders.products.find(p => p.id === 'divers')!;
                        const categoryPlaceholder = placeholders.products.find(p => 
                            p.id === product.category?.toLowerCase() || 
                            product.category?.toLowerCase().includes(p.id)
                        );
                        const displayImage = product.imageUrl || categoryPlaceholder?.url || defaultPlaceholder.url;

                        return (
                            <TableRow 
                                key={productUuid} 
                                data-state={selectedProducts.has(productUuid) ? "selected" : ""}
                                onClick={() => handleRowClick(product)}
                                className={cn("cursor-pointer hover:bg-muted/20 border-b border-border/50 transition-all")}
                            >
                                 <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedProducts.has(productUuid)}
                                        onCheckedChange={() => onToggleProductSelection(productUuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                        <Image 
                                            src={displayImage} 
                                            alt="" 
                                            fill 
                                            className="object-cover"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{product.name}</span>
                                        {expirationStatus && (
                                            <span className={cn("text-[10px] font-black uppercase flex items-center gap-1 mt-0.5", expirationStatus.color)}>
                                                <CalendarClock className="h-2.5 w-2.5" /> {expirationStatus.text}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                                        {product.category || 'N/A'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {product.supplierUuid ? supplierMap.get(product.supplierUuid) : '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "inline-flex items-center justify-center px-2.5 py-1 rounded-xl font-mono font-black text-xs shadow-inner",
                                            product.quantity <= 0 ? "bg-destructive/10 text-destructive border border-destructive/20" : 
                                            product.quantity <= product.minStockLevel ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20" : 
                                            "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                        )}>
                                            {product.quantity}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-black">{product.unite}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {isPriceOld && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="rounded-xl border-none shadow-xl">
                                                        <p className="text-[10px] font-bold">Prix d'achat non actualisé depuis 30j+</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {formatCurrency(product.purchasePrice)}
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
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
