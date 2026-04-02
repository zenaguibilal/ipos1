'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { User, ShoppingBag, CheckCircle2 } from 'lucide-react';

interface BreadOrderCardProps {
    order: BreadOrderWithCustomer;
    isSelected: boolean;
    onToggleSelection: (orderId: string) => void;
    onUpdate: () => void;
}

export function BreadOrderCard({ order, isSelected, onToggleSelection, onUpdate }: BreadOrderCardProps) {
    const [quantity, setQuantity] = useState(order.quantite);
    const debouncedQuantity = useDebounce(quantity, 500);

    const isPaid = !!order.venteUuid;

    const handleQuantityChange = useCallback(async (newQuantity: number) => {
        try {
            await breadService.updateBreadOrderQuantity(order.uuid, newQuantity);
            onUpdate();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour de la quantité.");
        }
    }, [order.uuid, onUpdate]);

    useEffect(() => {
        if (debouncedQuantity !== order.quantite) {
            handleQuantityChange(debouncedQuantity);
        }
    }, [debouncedQuantity, order.quantite, handleQuantityChange]);
    
    useEffect(() => {
        setQuantity(order.quantite);
    }, [order.quantite]);

    return (
        <Card className={cn(
            "group flex flex-col transition-all duration-300 rounded-3xl border-none shadow-sm relative overflow-hidden", 
            isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md",
            isPaid ? "bg-emerald-500/5 border border-emerald-500/10 opacity-80" : "bg-card"
        )}>
            <div className="absolute top-3 right-3 z-10">
                <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={() => onToggleSelection(order.uuid)} 
                    disabled={isPaid}
                    className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                />
            </div>

            <CardHeader className="p-5 pb-2">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-xl",
                        isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/50 text-muted-foreground"
                    )}>
                        <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 pr-6">
                        <CardTitle className="text-base font-black truncate tracking-tight">
                            {order.customer.firstName} {order.customer.lastName}
                        </CardTitle>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-1">
                            {isPaid ? <><CheckCircle2 className="h-2 w-2" /> Encaissé</> : <><ShoppingBag className="h-2 w-2" /> À livrer</>}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 pt-3 pb-6">
                <div className="flex items-center justify-between bg-muted/20 rounded-2xl p-3 border border-border/50">
                    <Label htmlFor={`qty-${order.uuid}`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantité</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            id={`qty-${order.uuid}`}
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center font-black bg-background border-none shadow-inner rounded-lg text-sm"
                            disabled={isPaid}
                        />
                        <span className="text-[10px] font-bold text-muted-foreground">PCS</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}