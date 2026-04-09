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
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { breadService } from '@/services/bread.service';
import { cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';

export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setCurrentDate(new Date());
    }, []);

    const formattedDate = currentDate ? formatDateToYYYYMMDD(currentDate) : '';

    const checkAndGenerate = useCallback(async (date: string) => {
        if (!date) return;
        const count = await db.bread_orders.where('date').equals(date).count();
        if (count === 0) {
            await breadService.generateAndGetOrdersForDate(date);
        }
    }, []);

    useEffect(() => {
        if (isMounted && formattedDate) {
            checkAndGenerate(formattedDate);
        }
    }, [isMounted, formattedDate, checkAndGenerate]);

    const orders = useLiveQuery(
        async () => {
            if (!isMounted || !formattedDate) return undefined;
            return await breadService.generateAndGetOrdersForDate(formattedDate);
        },
        [isMounted, formattedDate]
    );

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => prev ? addDays(prev, days) : null);
    }, []);

    const isToday = isMounted && currentDate && formatDateToYYYYMMDD(new Date()) === formattedDate;
    const isLoading = orders === undefined || !isMounted || !currentDate;

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <PageHeader 
                title="Distribution de Pain"
                description={isMounted && currentDate ? format(currentDate, 'EEEE d MMMM yyyy', { locale: fr }) : 'Synchronisation...'}
            >
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDateChange(-1)}
                            className="h-9 w-9 rounded-lg hover:bg-background"
                        >
                            <ChevronLeft className="h-4 w-4 text-primary" />
                        </Button>
                        <Button 
                            variant={isToday ? "secondary" : "ghost"} 
                            onClick={() => setCurrentDate(new Date())} 
                            disabled={isToday || !isMounted}
                            className="h-9 px-4 font-bold text-xs uppercase tracking-wider"
                        >
                            <CalendarDays className="mr-2 h-3.5 w-3.5" /> Aujourd'hui
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDateChange(1)}
                            className="h-9 w-9 rounded-lg hover:bg-background"
                        >
                            <ChevronRight className="h-4 w-4 text-primary" />
                        </Button>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => formattedDate && checkAndGenerate(formattedDate)}
                        disabled={isLoading}
                        className="h-11 w-11 rounded-xl bg-card hover:bg-primary/5 transition-all"
                    >
                        <RefreshCw className={cn("h-5 w-5 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <BreadStats date={formattedDate} isLoading={isLoading}/>

            <div className="grid lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-9">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-[500px] bg-card rounded-2xl border border-dashed border-border animate-pulse">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-30">Planification des flux...</p>
                        </div>
                    ) : (
                        <BreadDayView 
                            orders={orders || []} 
                            currentDate={formattedDate}
                            onOrdersChange={() => {}} 
                        />
                    )}
                </div>

                <div className="lg:col-span-3">
                    <BreadClientList onListChange={() => {}} />
                </div>
            </div>
        </div>
    );
}
