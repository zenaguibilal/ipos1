
'use client';

import React, { useMemo } from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CalendarClock, Package, AlertTriangle, Info, Tag, Copy, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { differenceInDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDuplicate: (product: Product) => void;
    onHistory: (product: Product) => void;
    onDelete: (product: Product) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
}

const ProductCardComponent = ({ product, onEdit, onDuplicate, onHistory, onDelete, isSelected, onToggleSelection }: ProductCardProps) => {

    const expirationStatus = useMemo(() => {
        if (!product.dateExpiration) return null;
        const today = new Date();
        const expirationDate = new Date(product.dateExpiration);
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        if (daysUntilExpiration < 0) return { color: 'bg-destructive text-destructive-foreground', text: `Expiré` };
        if (daysUntilExpiration <= 30) return { color: 'bg-amber-500 text-black', text: `Expire dans ${daysUntilExpiration} j` };
        return null;
    }, [product.dateExpiration]);

    const isPriceOld = useMemo(() => {
        if (!product.dateMajPrix) return false;
        return differenceInDays(new Date(), new Date(product.dateMajPrix)) > 30;
    }, [product.dateMajPrix]);

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[role="checkbox"]') || (e.target as HTMLElement).closest('button')) return;
        onEdit(product);
    };

    return (
        <Card
            onClick={handleCardClick}
            className={cn(
                "group flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-card border-none relative overflow-hidden cursor-pointer min-h-[180px] rounded-3xl",
                isSelected && "ring-2 ring-primary shadow-lg"
            )}
        >
            <div className={cn(
                "absolute inset-0 bg-primary/5 transition-opacity duration-300 pointer-events-none",
                isSelected ? "opacity-100" : "opacity-0"
            )} />

            <div className="absolute top-3 right-3 z-10 flex gap-1 items-center">
                <div onClick={(e) => e.stopPropagation()} className="p-1.5 bg-background/80 backdrop-blur-md rounded-xl shadow-sm border border-white/5">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-md border-none shadow-sm rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl">
                        <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-xl">
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product)} className="rounded-xl">
                            <Copy className="mr-2 h-4 w-4" /> Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onHistory(product)} className="rounded-xl">
                            <History className="mr-2 h-4 w-4" /> Historique
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive rounded-xl">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-5 pb-2 space-y-2">
                <div className="flex flex-wrap gap-1.5 pr-12">
                    {product.quantity <= 0 ? (
                        <Badge variant="destructive" className="rounded-md font-black uppercase text-[8px] tracking-widest px-2 py-0">En Rupture</Badge>
                    ) : product.quantity <= product.minStockLevel ? (
                        <Badge variant="outline" className="rounded-md bg-amber-500 text-black border-none font-black uppercase text-[8px] tracking-widest px-2 py-0">Stock Faible</Badge>
                    ) : null}
                    {expirationStatus && (
                        <Badge className={cn("rounded-md font-black uppercase text-[8px] tracking-widest px-2 py-0", expirationStatus.color)}>
                            <CalendarClock className="h-2.5 w-2.5 mr-1" />
                            {expirationStatus.text}
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-lg font-black leading-tight line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
                    {product.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-lg bg-muted/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" />
                        {product.category || 'Sans catégorie'}
                    </div>
                    {isPriceOld && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="p-1 bg-amber-500/10 rounded-full">
                                        <Info className="h-3 w-3 text-amber-500" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl font-bold text-[10px]">Prix ancien (+30j)</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-5 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/20 px-3 py-2 rounded-xl w-fit border border-border/50">
                    <Package className="h-3.5 w-3.5 opacity-50" />
                    <span>Stock: <span className={cn(product.quantity <= product.minStockLevel ? "text-amber-500" : "text-primary")}>{product.quantity}</span> <span className="opacity-50">{product.unite || ''}</span></span>
                </div>
            </CardContent>

            <CardFooter className="p-5 pt-3 flex justify-between items-end border-t border-white/5 bg-muted/5">
                 <div className="space-y-0.5">
                    <p className="text-2xl font-black text-primary tracking-tighter leading-none">{formatCurrency(product.price)}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">Achat: {formatCurrency(product.purchasePrice)}</p>
                </div>
                {product.quantity <= product.minStockLevel && product.quantity > 0 && (
                    <AlertTriangle className="h-6 w-6 text-amber-500 animate-pulse mb-1" />
                )}
            </CardFooter>
        </Card>
    );
}

export const ProductCard = React.memo(ProductCardComponent);
