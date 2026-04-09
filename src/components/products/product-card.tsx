'use client';

import React, { useMemo } from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CalendarClock, Package, Copy, History, ShoppingBag, ChevronRight, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { differenceInDays } from 'date-fns';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDuplicate: (product: Product) => void;
    onHistory: (product: Product) => void;
    onDelete: (product: Product) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
    isSelectionActive: boolean;
}

const ProductCardComponent = ({ product, onEdit, onDuplicate, onHistory, onDelete, isSelected, onToggleSelection, isSelectionActive }: ProductCardProps) => {

    const status = useMemo(() => {
        if (product.quantity <= 0) return { label: 'Rupture', color: 'bg-destructive text-white' };
        if (product.quantity <= product.minStockLevel) return { label: 'Bas', color: 'bg-amber-500 text-white' };
        return { label: 'OK', color: 'bg-emerald-500 text-white' };
    }, [product.quantity, product.minStockLevel]);

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input[type="checkbox"]') || target.closest('[role="menuitem"]')) return;
        if (isSelectionActive) onToggleSelection();
        else onEdit(product);
    };

    return (
        <Card
            onClick={handleCardClick}
            className={cn(
                "group flex flex-col border shadow-sm transition-all duration-300 rounded-2xl cursor-pointer relative overflow-hidden",
                isSelected ? "ring-2 ring-primary border-primary/20 shadow-md bg-primary/5" : "bg-card hover:border-primary/20"
            )}
        >
            <div className="absolute top-4 right-4 flex gap-2 items-center z-10">
                <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} className="h-5 w-5 rounded-md" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                        <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-lg p-2 text-xs font-bold"><Edit className="mr-2 h-3.5 w-3.5" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product)} className="rounded-lg p-2 text-xs font-bold"><Copy className="mr-2 h-3.5 w-3.5" /> Copier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onHistory(product)} className="rounded-lg p-2 text-xs font-bold"><History className="mr-2 h-3.5 w-3.5" /> Historique</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive rounded-lg p-2 text-xs font-bold"><Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-5 pb-2">
                <div className="flex gap-2 mb-2">
                    <Badge className={cn("rounded-lg font-black uppercase text-[8px] tracking-wider px-2 py-0.5 border-none", status.color)}>
                        {status.label}
                    </Badge>
                    <Badge variant="outline" className="rounded-lg border-primary/20 text-primary text-[8px] font-black uppercase tracking-wider px-2 py-0.5">
                        {product.category || 'Général'}
                    </Badge>
                </div>
                <CardTitle className="text-base font-black leading-tight tracking-tight line-clamp-2">
                    {product.name}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-5 py-3 flex-grow">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-xl border w-fit">
                    <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="text-xs font-black">
                        {product.quantity} <span className="text-[10px] text-muted-foreground/40 uppercase ml-0.5">{product.unite}</span>
                    </span>
                </div>
            </CardContent>

            <CardFooter className="p-4 px-5 pt-3 border-t bg-muted/5 flex justify-between items-center">
                <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Prix Vente</p>
                    <p className="text-xl font-black text-primary tracking-tighter">{formatCurrency(product.price)}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export const ProductCard = React.memo(ProductCardComponent);
