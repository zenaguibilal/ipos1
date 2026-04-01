
'use client';

import React, { useMemo } from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { differenceInDays } from 'date-fns';

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
        if (daysUntilExpiration <= 30) return { color: 'bg-yellow-500 text-black', text: `Expire dans ${daysUntilExpiration} j` };
        return null;
    }, [product.dateExpiration]);

    const handleCardClick = () => {
        onEdit(product);
    };

    return (
        <Card
            onClick={handleCardClick}
            className={cn(
                "flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                isSelected && "ring-2 ring-primary",
                "cursor-pointer"
            )}
        >
            <CardHeader className="pb-2">
                 <div className="flex gap-2 justify-between items-start">
                    <div className="flex-grow">
                        <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{product.category || 'Non classé'}</p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelection}
                            className="h-5 w-5 flex-shrink-0"
                            aria-label={`Select ${product.name}`}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                 <div className="flex flex-col gap-1 items-start">
                    {product.quantity <= 0 ? (
                        <Badge variant="destructive">En Rupture</Badge>
                    ) : product.quantity <= product.minStockLevel ? (
                        <Badge variant="outline" className="border-chart-secondary text-chart-secondary bg-chart-secondary/10">Stock Faible</Badge>
                    ) : null}
                     {expirationStatus && (
                        <Badge className={expirationStatus.color}>
                            <CalendarClock className="h-3 w-3 mr-1" />
                            {expirationStatus.text}
                        </Badge>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                 <div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
                    <p className="text-xs font-semibold">Stock: {product.quantity} {product.unite || ''}</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
}

export const ProductCard = React.memo(ProductCardComponent);
