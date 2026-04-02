'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { BreadOrderCard } from './BreadOrderCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAddDialog } from './ManualAddDialog';
import { PrintBreadListDialog } from './PrintBreadListDialog';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Loader2, Wheat, ShoppingBag, Landmark } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

interface BreadDayViewProps {
    orders: BreadOrderWithCustomer[];
    currentDate: string;
    onOrdersChange: () => void;
}

export function BreadDayView({ orders, currentDate, onOrdersChange }: BreadDayViewProps) {
    const [selectedOrders, setSelectedOrders] = useState(new Set<string>());
    const [isConverting, setIsConverting] = useState(false);
    const breadPrice = useAppStore((state) => state.companyProfile?.prix_pain) || 0;

    const unbilledOrders = useMemo(() => orders.filter(o => !o.venteUuid), [orders]);
    const unbilledOrdersCount = unbilledOrders.length;

    const handleToggleSelection = (orderUuid: string) => {
        setSelectedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderUuid)) {
                newSet.delete(orderUuid);
            } else {
                newSet.add(orderUuid);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedOrders.size === unbilledOrdersCount) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(unbilledOrders.map(o => o.uuid)));
        }
    };
    
    const handleConvertToSales = async () => {
        if (selectedOrders.size === 0) {
            toast.info("Veuillez sélectionner au moins une commande.");
            return;
        }
        if (breadPrice <= 0) {
            toast.error("Prix du pain non défini", {
                description: "Veuillez le configurer dans les paramètres قبل المتابعة."
            });
            return;
        }
        
        setIsConverting(true);
        try {
            await breadService.convertBreadOrdersToSales(Array.from(selectedOrders), breadPrice);
            toast.success(`${selectedOrders.size} طلب(ات) تم تحويلها إلى الديون بنجاح.`);
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("فشل في تحويل الطلبات.");
        } finally {
            setIsConverting(false);
        }
    };

    const handleFinalizeDay = async () => {
        if (unbilledOrdersCount === 0) return;
        if (breadPrice <= 0) {
            toast.error("Prix du pain non configuré.");
            return;
        }

        setIsConverting(true);
        try {
            const count = await breadService.billAllRemainingOrdersForDate(currentDate, breadPrice);
            toast.success(`إغلاق اليوم: تم تحويل ${count} طلب معلق إلى ديون الزبائن.`);
            onOrdersChange();
        } catch (e) {
            toast.error("خطأ أثناء إغلاق اليوم.");
        } finally {
            setIsConverting(false);
        }
    };

    const isAllSelected = unbilledOrdersCount > 0 && selectedOrders.size === unbilledOrdersCount;

    if (orders.length === 0) {
        return (
             <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden h-full flex flex-col">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-xl font-black tracking-tight">Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center min-h-[400px]">
                    <EmptyState
                        icon={Wheat}
                        title="Rien à distribuer"
                        description="Aucune commande récurrente n'est programmée pour cette date."
                    >
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                    </EmptyState>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="flex flex-col h-full rounded-3xl border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="flex-shrink-0 bg-muted/30 border-b border-border/50 pb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight">Distribution du Jour</CardTitle>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">
                            {orders.length} طلبات إجمالية اليوم
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                        <PrintBreadListDialog orders={orders} currentDate={currentDate}/>
                        {unbilledOrdersCount > 0 && (
                            <Button 
                                variant="destructive" 
                                className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-destructive/20 gap-2"
                                onClick={handleFinalizeDay}
                                disabled={isConverting}
                            >
                                <Landmark className="h-3.5 w-3.5" />
                                إغلاق اليوم (تحويل للديون)
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-background/50 p-2.5 rounded-2xl border border-border/50 shadow-inner">
                    <div className="flex items-center gap-3 px-3">
                        <Checkbox 
                            id="select-all-bread" 
                            checked={isAllSelected} 
                            onCheckedChange={handleSelectAll} 
                            className="h-5 w-5 border-primary data-[state=checked]:bg-primary rounded-md"
                        />
                        <label htmlFor="select-all-bread" className="text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer select-none">
                            Sélectionner Tout ({selectedOrders.size})
                        </label>
                    </div>
                    
                    <Button 
                        onClick={handleConvertToSales} 
                        disabled={selectedOrders.size === 0 || isConverting}
                        className={cn(
                            "rounded-xl font-black h-11 px-8 transition-all uppercase text-[10px] tracking-widest",
                            selectedOrders.size > 0 ? "shadow-lg shadow-primary/20" : "opacity-20"
                        )}
                    >
                        {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
                        Valider Sélection (Compte)
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow min-h-0 p-6">
                <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {orders.map(order => (
                            <BreadOrderCard 
                                key={order.uuid} 
                                order={order}
                                isSelected={selectedOrders.has(order.uuid)}
                                onToggleSelection={handleToggleSelection}
                                onUpdate={onOrdersChange}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
