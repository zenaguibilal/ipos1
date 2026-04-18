'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CalendarClock, Info, Package, Copy, History, ShoppingBag, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency, safeToDate } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const expirationStatus = useMemo(() => {
        if (!product.dateExpiration) return null;
        const today = new Date();
        const expirationDate = new Date(product.dateExpiration);
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        if (daysUntilExpiration < 0) return { color: 'bg-destructive/20 text-destructive border-destructive/20', text: `Expiré` };
        if (daysUntilExpiration <= 30) return { color: 'bg-amber-500/20 text-amber-500 border-amber-500/20', text: `Expire ${daysUntilExpiration}j` };
        return null;
    }, [product.dateExpiration]);

    const isPriceOld = useMemo(() => {
        if (!product.dateMajPrix) return false;
        return differenceInDays(new Date(), new Date(product.dateMajPrix)) > 30;
    }, [product.dateMajPrix]);

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input[type="checkbox"]') || target.closest('[role="menuitem"]')) {
            return;
        }

        if (isSelectionActive) {
            onToggleSelection();
        } else {
            onEdit(product);
        }
    };

    const lastActivityText = useMemo(() => {
        if (!isMounted || !product.createdAt) return 'Chargement...';
        return formatDistanceToNow(safeToDate(product.createdAt), { addSuffix: true, locale: fr });
    }, [isMounted, product.createdAt]);

    return (
        <Card
            onClick={handleCardClick}
            className={cn(
                "app-card group flex flex-col transition-all duration-500 bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden cursor-pointer rounded-lg",
                isSelected ? "ring-2 ring-primary border-primary/30 shadow-sm scale-[1.02]" : "hover:bg-primary/5"
            )}
        >
            <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                <ShoppingBag className="h-32 w-32 rotate-12" />
            </div>

            <div 
                className="absolute top-4 right-4 z-10 flex gap-2 items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-1.5 bg-background/80 backdrop-blur-md rounded-xl border border-white/5 shadow-sm flex items-center justify-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-9 w-9 bg-background/80 backdrop-blur-md border-white/5 shadow-xl rounded-xl transition-all"
                        >
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-sm bg-card">
                        <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-xl p-3"><Edit className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product)} className="rounded-xl p-3"><Copy className="mr-2 h-4 w-4" /> Dupliquer</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onHistory(product)} className="rounded-xl p-3"><History className="mr-2 h-4 w-4" /> Historique</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive rounded-xl p-3"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-6 pb-2 space-y-3 relative z-10">
                <div className="flex flex-wrap gap-2 pr-12">
                    {product.quantity <= 0 ? (
                        <Badge variant="destructive" className="rounded-lg font-semibold uppercase text-[8px] px-2 py-0.5 border-none shadow-sm">En Rupture</Badge>
                    ) : product.quantity <= product.minStockLevel ? (
                        <Badge className="rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/20 font-semibold uppercase text-[8px] px-2 py-0.5 shadow-sm">Stock Faible</Badge>
                    ) : (
                        <Badge className="rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 font-semibold uppercase text-[8px] px-2 py-0.5 shadow-sm">Optimal</Badge>
                    )}
                    {expirationStatus && (
                        <Badge className={cn("rounded-lg font-semibold uppercase text-[8px] px-2 py-0.5 shadow-sm border", expirationStatus.color)}>
                            <CalendarClock className="h-2.5 w-2.5 mr-1" /> {expirationStatus.text}
                        </Badge>
                    )}
                </div>
                
                <CardTitle className="text-xl font-semibold leading-tight tracking-tighter group-hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                </CardTitle>

                <div className="flex items-center gap-3">
                    {isPriceOld && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="p-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                                        <Info className="h-3 w-3 text-amber-500" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl border-white/5 shadow-sm bg-card">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide">Tarif ancien (+30j)</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-6 py-4 relative z-10">
                <div className="flex items-center gap-3 bg-black/20 px-4 py-2.5 rounded-2xl w-fit border border-white/5 shadow-inner">
                    <div className={cn(
                        "p-1.5 rounded-lg",
                        product.quantity <= product.minStockLevel ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                    )}>
                        <Package className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-semibold uppercase text-muted-foreground/40 tracking-wide">Stock Disponible</span>
                        <span className={cn("text-base font-semibold tracking-tight tabular-nums", product.quantity <= product.minStockLevel ? "text-amber-500" : "text-foreground")}>
                            {product.quantity} <span className="text-[10px] font-semibold text-muted-foreground/30 uppercase ml-1">{product.unite}</span>
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-4 flex justify-between items-end border-t border-white/5 bg-muted/5 relative z-10">
                 <div className="space-y-1">
                    <p className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wide">Valeur Marchande</p>
                    <p className="text-xl font-semibold text-primary tracking-tighter leading-none tabular-nums">{formatCurrency(product.price)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-semibold text-muted-foreground/30 uppercase tracking-wide mb-1 italic">{lastActivityText}</p>
                    <p className="text-xs font-mono font-bold text-muted-foreground/60 tabular-nums">{formatCurrency(product.purchasePrice)} (PMP)</p>
                </div>
            </CardFooter>
        </Card>
    );
}

export const ProductCard = React.memo(ProductCardComponent);