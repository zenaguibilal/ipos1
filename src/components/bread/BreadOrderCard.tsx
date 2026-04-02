'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { AlertTriangle, User, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface BreadOrderCardProps {
    order: BreadOrderWithCustomer;
    isSelected: boolean;
    onToggleSelection: (orderId: string) => void;
    onUpdate: () => void;
}

export function BreadOrderCard({ order, isSelected, onToggleSelection, onUpdate }: BreadOrderCardProps) {
    const [quantity, setQuantity] = useState(order.quantite);
    const debouncedQuantity = useDebounce(quantity, 500);

    const isModified = order.quantite_origine !== undefined && order.quantite !== order.quantite_origine;
    const isPaid = order.est_paye;
    const isDelivered = order.est_livre;

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

    const handleDeliveryToggle = useCallback(async (delivered: boolean) => {
        try {
            await breadService.updateBreadOrderDeliveryStatus(order.uuid, delivered);
            toast.success(`Statut mis à jour pour ${order.customer.firstName}`);
            onUpdate();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour du statut.");
        }
    }, [order.uuid, order.customer.firstName, onUpdate]);
    
    return (
        <Card className={cn(
            "group flex flex-col transition-all duration-300 rounded-3xl border-none shadow-sm relative overflow-hidden", 
            isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md",
            isPaid ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-card"
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
                        "p-2 rounded-xl text-muted-foreground",
                        isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/50"
                    )}>
                        <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 pr-6">
                        <CardTitle className="text-base font-black truncate tracking-tight">
                            {order.customer.firstName} {order.customer.lastName}
                        </CardTitle>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-1">
                            {isPaid ? <><CheckCircle2 className="h-2 w-2" /> Payé</> : <><ShoppingBag className="h-2 w-2" /> En attente</>}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 py-3">
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
                 {isModified && (
                    <div className="text-[9px] font-bold text-amber-500 flex items-center gap-1 mt-2 bg-amber-500/5 p-1 rounded-md px-2 w-fit">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Ajusté (Init: {order.quantite_origine})
                    </div>
                 )}
            </CardContent>

            <CardFooter className="p-3 grid grid-cols-2 gap-2 border-t border-white/5 bg-muted/5 mt-auto">
                <div className={cn(
                    "flex items-center justify-center gap-2 py-2 rounded-xl transition-all",
                    isPaid ? "bg-emerald-500/10" : "bg-muted/20 opacity-50"
                )}>
                    <CheckCircle2 className={cn("h-3 w-3", isPaid ? "text-emerald-500" : "text-muted-foreground")} />
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", isPaid ? "text-emerald-600" : "text-muted-foreground")}>Facturé</span>
                </div>
                
                <div className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all",
                    isDelivered ? "bg-primary/10 border border-primary/20" : "bg-muted/20"
                )}>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", isDelivered ? "text-primary" : "text-muted-foreground")}>Livré</span>
                    <Switch 
                        id={`delivered-${order.uuid}`} 
                        checked={isDelivered} 
                        onCheckedChange={handleDeliveryToggle}
                        className="scale-75"
                    />
                </div>
            </CardFooter>
        </Card>
    );
}
