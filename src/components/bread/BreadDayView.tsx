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
import { Loader2, Wheat, ShoppingBag, CheckSquare } from 'lucide-react';
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
        const unbilledOrders = orders.filter(o => !o.venteUuid);
        if (selectedOrders.size === unbilledOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(unbilledOrders.map(o => o.uuid)));
        }
    };
    
    const handleConvertToSales = async () => {
        if (selectedOrders.size === 0) {
            toast.info("Veuillez sélectionner au moins une commande à convertir.");
            return;
        }
        if (breadPrice <= 0) {
            toast.error("Le prix du pain n'est pas défini.", {
                description: "Veuillez le configurer dans la page de profil قبل المتابعة."
            });
            return;
        }
        
        setIsConverting(true);
        try {
            await breadService.convertBreadOrdersToSales(Array.from(selectedOrders), breadPrice);
            toast.success(`${selectedOrders.size} commande(s) convertie(s) en ventes.`);
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur lors de la conversion en ventes.", { description: error.message });
        } finally {
            setIsConverting(false);
        }
    };

    const isAllSelected = useMemo(() => {
        const unbilledOrders = orders.filter(o => !o.venteUuid);
        return unbilledOrders.length > 0 && selectedOrders.size === unbilledOrders.length;
    }, [orders, selectedOrders]);

    if (orders.length === 0) {
        return (
             <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden h-full">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-xl font-black tracking-tight">Commandes du Jour</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px]">
                    <EmptyState
                        icon={Wheat}
                        title="Aucune commande pour aujourd'hui"
                        description="Aucun client n'a de commande récurrente programmée pour cette date."
                    >
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                    </EmptyState>
                </CardContent>
            </Card>
        );
    }
    
    const handleCardChange = () => {
        onOrdersChange();
    };
    
    return (
        <Card className="flex flex-col h-full rounded-3xl border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="flex-shrink-0 bg-muted/30 border-b border-border/50 pb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight">Commandes du Jour</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">{orders.length} commandes générées</p>
                    </div>
                    <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                        <PrintBreadListDialog orders={orders} currentDate={currentDate}/>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-background/50 p-3 rounded-2xl border border-border/50">
                    <div className="flex items-center space-x-3 px-2">
                        <Checkbox 
                            id="select-all-bread" 
                            checked={isAllSelected} 
                            onCheckedChange={handleSelectAll} 
                            className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                        />
                        <label htmlFor="select-all-bread" className="text-xs font-black uppercase tracking-widest text-primary cursor-pointer">
                            Tout sélectionner ({selectedOrders.size})
                        </label>
                    </div>
                    
                    <Button 
                        onClick={handleConvertToSales} 
                        disabled={isConverting || selectedOrders.size === 0}
                        className={cn(
                            "rounded-xl font-bold h-10 px-6 transition-all",
                            selectedOrders.size > 0 ? "shadow-lg shadow-primary/20" : "opacity-50"
                        )}
                    >
                        {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
                        Encaisser Sélection
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
                                onUpdate={handleCardChange}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
