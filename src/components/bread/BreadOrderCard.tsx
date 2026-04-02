'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { CheckCircle2, UserCircle2, Package, Wallet, Loader2, Trash2 } from 'lucide-react';
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
    const isExternal = !order.customerUuid;
    const displayName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.customName || 'Inconnu');

    const handleQuantityChange = useCallback(async (newQuantity: number) => {
        if (newQuantity < 0 || isPaid) return;
        try {
            await breadService.updateBreadOrderQuantity(order.uuid, newQuantity);
            onUpdate();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour.");
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
            toast.error("Échec de la mise à jour.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleQuickPay = async () => {
        if (breadPrice <= 0) {
            toast.error("Prix du pain non configuré.");
            return;
        }
        setIsUpdatingStatus(true);
        try {
            await breadService.convertBreadOrdersToSales([order.uuid], breadPrice);
            toast.success("Commande payée (ajoutée aux comptes).");
            onUpdate();
        } catch (e) {
            toast.error("Erreur de paiement.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (isPaid) return;
        try {
            await breadService.deleteBreadOrder(order.uuid);
            toast.success("Commande supprimée.");
            onUpdate();
        } catch (e) {
            toast.error("Erreur lors de la suppression.");
        }
    };

    return (
        <Card className={cn(
            "group transition-all duration-300 rounded-3xl border-none shadow-sm relative overflow-hidden", 
            isSelected ? "ring-2 ring-primary shadow-lg scale-[1.02] z-10" : "hover:shadow-md",
            isPaid ? "bg-emerald-500/5 opacity-90" : "bg-card",
            isExternal && !isPaid && "border-l-4 border-l-amber-500/30"
        )}>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {!isPaid && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-lg text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
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
                <div className="flex items-center gap-2 mb-1">
                    {isExternal && <UserCircle2 className="h-3 w-3 text-amber-500 opacity-50" />}
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                        {isExternal ? 'اسم خارجي' : 'زبون دائم'}
                    </span>
                </div>
                <CardTitle className="text-lg font-black tracking-tight pr-12 leading-tight truncate">
                    {displayName}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-4">
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

                <div className="flex gap-2">
                    <Button 
                        variant={isDelivered ? "secondary" : "outline"} 
                        size="sm"
                        onClick={toggleDelivery}
                        disabled={isUpdatingStatus || isPaid}
                        className={cn(
                            "flex-1 rounded-xl h-10 font-bold text-[10px] uppercase tracking-widest gap-2",
                            isDelivered && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                        )}
                    >
                        {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
                        {isDelivered ? 'مستلم' : 'استلام'}
                    </Button>
                    <Button 
                        variant={isPaid ? "secondary" : "outline"} 
                        size="sm"
                        onClick={handleQuickPay}
                        disabled={isPaid || isUpdatingStatus}
                        className={cn(
                            "flex-1 rounded-xl h-10 font-bold text-[10px] uppercase tracking-widest gap-2",
                            isPaid && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}
                    >
                        {isPaid ? <CheckCircle2 className="h-3 w-3" /> : <Wallet className="h-3 w-3" />}
                        {isPaid ? 'مدفوع' : 'دفع'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
