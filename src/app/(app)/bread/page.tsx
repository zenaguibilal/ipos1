'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadClientList } from '@/components/bread/BreadClientList';
import { BreadDayView } from '@/components/bread/BreadDayView';
import { BreadStats } from '@/components/bread/BreadStats';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { breadService } from '@/services/bread.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const [orders, setOrders] = useState<BreadOrderWithCustomer[] | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setCurrentDate(new Date());
    }, []);

    const fetchAndGenerateOrders = useCallback(async (date: string) => {
        setIsGenerating(true);
        try {
            const generatedOrders = await breadService.generateAndGetOrdersForDate(date);
            setOrders(generatedOrders);
        } catch (error: any) {
            toast.error("Erreur lors de la génération des commandes.");
        } finally {
            setIsGenerating(false);
        }
    }, []);

    useEffect(() => {
        if (isMounted && currentDate) {
            fetchAndGenerateOrders(formatDateToYYYYMMDD(currentDate));
        }
    }, [currentDate, fetchAndGenerateOrders, isMounted]);


    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => prev ? addDays(prev, days) : null);
    }, []);

    const formattedDate = currentDate ? formatDateToYYYYMMDD(currentDate) : '';
    const isToday = isMounted && currentDate && formatDateToYYYYMMDD(new Date()) === formattedDate;
    const isLoading = orders === undefined || isGenerating || !isMounted || !currentDate;

    return (
        <div className="p-4 sm:p-6 space-y-6 flex flex-col h-full max-w-[1600px] mx-auto">
            <PageHeader 
                title="Gestion des Commandes de Pain"
                description={isMounted && currentDate ? format(currentDate, 'EEEE d MMMM yyyy', { locale: fr }) : 'Chargement...'}
            >
                <div className="flex gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDateChange(-1)}
                        className="rounded-xl h-9 w-9"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant={isToday ? "secondary" : "ghost"} 
                        onClick={() => setCurrentDate(new Date())} 
                        disabled={isToday || !isMounted}
                        className="rounded-xl h-9 px-4 font-bold text-xs uppercase tracking-widest"
                    >
                        Aujourd'hui
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDateChange(1)}
                        className="rounded-xl h-9 w-9"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => formattedDate && fetchAndGenerateOrders(formattedDate)}
                    disabled={isLoading}
                    className="rounded-xl h-12 w-12 border-none shadow-sm bg-card"
                >
                    <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                </Button>
            </PageHeader>

            <BreadStats orders={orders} isLoading={isLoading}/>

            <div className="grid lg:grid-cols-4 gap-6 items-stretch flex-grow min-h-0">
                <div className="lg:col-span-3 flex flex-col">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-full bg-card rounded-3xl animate-pulse min-h-[400px]">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-20">Synchronisation des commandes...</p>
                        </div>
                    ) : (
                        <BreadDayView 
                            orders={orders || []} 
                            currentDate={formattedDate}
                            onOrdersChange={() => fetchAndGenerateOrders(formattedDate)}
                        />
                    )}
                </div>

                <div className="lg:col-span-1 flex flex-col">
                    <BreadClientList onListChange={() => formattedDate && fetchAndGenerateOrders(formattedDate)} />
                </div>
            </div>
        </div>
    );
}
