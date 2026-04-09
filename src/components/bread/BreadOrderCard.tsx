'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { CheckCircle2, User, Package, Trash2, Hash, Truck } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface BreadOrderCardProps {
    order: BreadOrderWithCustomer;
    isSelected: boolean;
    onToggleSelection: (orderId: string) => void;
    onUpdate: () => void;
}

export function BreadOrderCard({ order, isSelected, onToggleSelection, onUpdate }: BreadOrderCardProps) {
    const [quantity, setQuantity] = useState(order.quantite);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const debouncedQuantity = useDebounce(quantity, 500);
    const breadPrice = useAppStore((state) => state.companyProfile?.prix_pain) || 0;

    const isPaid = !!order.venteUuid;
    const isDelivered = order.est_livre;
    const displayName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.customName || 'Passager');

    const handleQuantityChange = useCallback(async (newQuantity: number) => {
        if (newQuantity < 0 || isPaid) return;
        try {
            await breadService.updateBreadOrderQuantity(order.uuid, newQuantity);
            onUpdate();
        } catch (error) {
            toast.error("Erreur de mise à jour.");
        }
    }, [order.uuid, onUpdate, isPaid]);

    useEffect(() => {
        if (debouncedQuantity !== order.quantite && !isPaid) {
            handleQuantityChange(debouncedQuantity);
        }
    }, [debouncedQuantity, order.quantite, handleQuantityChange, isPaid]);
    
    useEffect(() => {
        setQuantity(order.quantite);
    }, [order.quantite]);

    const toggleDelivery = async () => {
        setIsUpdatingStatus(true);
        try {
            await breadService.updateBreadOrderDeliveryStatus(order.uuid, !isDelivered);
            onUpdate();
        } catch (e) {
            toast.error("Erreur de statut.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleQuickPay = async () => {
        if (breadPrice <= 0) {
            toast.error("Prix du pain non défini.");
            return;
        }
        setIsUpdatingStatus(true);
        try {
            await breadService.convertBreadOrdersToSales([order.uuid], breadPrice);
            toast.success("Vente validée.");
            onUpdate();
        } catch (e) {
            toast.error("Échec du traitement.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <Card className={cn(
            "group flex flex-col border shadow-sm transition-all duration-300 rounded-2xl relative overflow-hidden", 
            isSelected ? "ring-2 ring-primary border-primary/20 shadow-md bg-primary/5" : "bg-card hover:border-primary/20",
            isPaid && "opacity-75 grayscale-[0.5]"
        )}>
            <div className="absolute top-4 right-4 flex gap-2 items-center z-10">
                {!isPaid ? (
                    <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => onToggleSelection(order.uuid)} 
                        className="h-5 w-5 rounded-md"
                    />
                ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
            </div>

            <CardHeader className="p-5 pb-2">
                <div className="flex items-center gap-3 mb-1">
                    <div className={cn(
                        "p-2 rounded-xl",
                        order.customerUuid ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500"
                    )}>
                        <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 pr-8">
                        <CardTitle className="text-sm font-black tracking-tight truncate leading-tight">
                            {displayName}
                        </CardTitle>
                        {isPaid && (
                            <p className="text-[9px] font-mono font-bold text-emerald-600/60 flex items-center gap-1 uppercase tracking-tighter">
                                <Hash className="h-2.5 w-2.5" /> Validé
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 space-y-4">
                <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-2 border shadow-inner">
                    <Package className="h-4 w-4 text-muted-foreground/40 ml-2" />
                    <Input 
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        className="h-10 text-xl font-black text-center bg-transparent border-none focus-visible:ring-0 text-primary"
                        disabled={isPaid}
                    />
                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase mr-2">PCS</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button 
                        variant={isDelivered ? "secondary" : "outline"} 
                        size="sm"
                        onClick={toggleDelivery}
                        disabled={isUpdatingStatus || isPaid}
                        className={cn(
                            "h-9 rounded-xl font-bold text-[10px] uppercase tracking-wider gap-2",
                            isDelivered && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}
                    >
                        <Truck className="h-3.5 w-3.5" />
                        {isDelivered ? 'LIVRÉ' : 'LIVRER'}
                    </Button>
                    <Button 
                        variant={isPaid ? "secondary" : "outline"} 
                        size="sm"
                        onClick={handleQuickPay}
                        disabled={isPaid || isUpdatingStatus}
                        className={cn(
                            "h-9 rounded-xl font-bold text-[10px] uppercase tracking-wider gap-2",
                            isPaid && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}
                    >
                        {isPaid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                        {isPaid ? 'SOLDÉ' : 'FACTURER'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
