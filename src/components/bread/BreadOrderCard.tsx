'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { CheckCircle2 } from 'lucide-react';

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
        if (newQuantity < 0) return;
        try {
            await breadService.updateBreadOrderQuantity(order.uuid, newQuantity);
            onUpdate();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour.");
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
            "group transition-all duration-300 rounded-3xl border-none shadow-sm relative overflow-hidden", 
            isSelected ? "ring-2 ring-primary shadow-lg scale-[1.02] z-10" : "hover:shadow-md",
            isPaid ? "bg-emerald-500/5 opacity-60 grayscale-[0.5]" : "bg-card"
        )}>
            <div className="absolute top-4 right-4 z-10">
                {!isPaid ? (
                    <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => onToggleSelection(order.uuid)} 
                        className="h-6 w-6 border-primary data-[state=checked]:bg-primary rounded-lg transition-transform active:scale-90"
                    />
                ) : (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                )}
            </div>

            <CardHeader className="p-6 pb-2">
                <CardTitle className="text-lg font-black tracking-tight pr-8 leading-tight">
                    {order.customer.firstName} {order.customer.lastName}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6 pt-2">
                <div className="flex items-center gap-3 bg-muted/20 rounded-2xl p-2 border border-border/50 group-hover:border-primary/20 transition-colors">
                    <Input 
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        className="h-12 text-2xl font-black text-center bg-background border-none shadow-inner rounded-xl focus-visible:ring-primary w-full"
                        disabled={isPaid}
                        min="0"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-3">PCS</span>
                </div>
            </CardContent>
        </Card>
    );
}
