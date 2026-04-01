
'use client';

import React, { useMemo } from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CalendarClock, Package, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
}

const ProductCardComponent = ({ product, onEdit, onDelete, isSelected, onToggleSelection }: ProductCardProps) => {

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

    const handleCardClick = () => {
        onEdit(product);
    };

    return (
        <Card
            onClick={handleCardClick}
            className={cn(
                "group flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-card border-none relative overflow-hidden cursor-pointer p-1",
                isSelected && "ring-2 ring-primary shadow-lg"
            )}
        >
            {/* Selection Overlay */}
            <div className={cn(
                "absolute inset-0 bg-primary/10 transition-opacity duration-300 pointer-events-none",
                isSelected ? "opacity-100" : "opacity-0"
            )} />

            {/* Action Bar (Hover only) */}
            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div onClick={(e) => e.stopPropagation()} className="p-1.5 bg-background/80 backdrop-blur-md rounded-lg shadow-sm border border-white/5">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-md border-none shadow-sm">
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
            </div>

            <CardHeader className="p-4 pb-1 space-y-1">
                <div className="flex flex-col gap-1">
                    {product.quantity <= 0 ? (
                        <Badge variant="destructive" className="w-fit rounded-md font-black uppercase text-[8px] tracking-widest">En Rupture</Badge>
                    ) : product.quantity <= product.minStockLevel ? (
                        <Badge variant="outline" className="w-fit rounded-md bg-amber-500 text-black border-none font-black uppercase text-[8px] tracking-widest">Stock Faible</Badge>
                    ) : null}
                    {expirationStatus && (
                        <Badge className={cn("w-fit rounded-md font-black uppercase text-[8px] tracking-widest", expirationStatus.color)}>
                            <CalendarClock className="h-2 w-2 mr-1" />
                            {expirationStatus.text}
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-base font-bold leading-tight line-clamp-2 mt-1">{product.name}</CardTitle>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                        {product.category || 'Non classé'}
                    </p>
                    {isPriceOld && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="p-1 bg-amber-500/10 rounded-full">
                                        <Info className="h-3 w-3 text-amber-500" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl font-bold text-[10px]">Prix ancien (30j+)</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-4 py-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <Package className="h-3.5 w-3.5 opacity-50" />
                    <span>Stock: <span className={cn(product.quantity <= product.minStockLevel ? "text-amber-500" : "text-primary")}>{product.quantity}</span> {product.unite || ''}</span>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-3 flex justify-between items-end border-t border-white/5 bg-muted/5">
                 <div>
                    <p className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(product.price)}</p>
                    <p className="text-[10px] text-muted-foreground font-medium italic">Achat: {formatCurrency(product.purchasePrice)}</p>
                </div>
                
                {product.quantity <= product.minStockLevel && product.quantity > 0 && (
                    <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse mb-1" />
                )}
            </CardFooter>
        </Card>
    );
}

export const ProductCard = React.memo(ProductCardComponent);
