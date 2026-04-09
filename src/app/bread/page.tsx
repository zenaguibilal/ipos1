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
        <div className="p-2 sm:p-3 space-y-3 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <PageHeader 
                title="Logistique Pain"
                description={isMounted && currentDate ? format(currentDate, 'EEEE d MMMM', { locale: fr }) : 'Chargement...'}
            >
                <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 bg-white/50 p-0.5 rounded-lg border shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="h-7 w-7 rounded-md"><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant={isToday ? "secondary" : "ghost"} onClick={() => setCurrentDate(new Date())} disabled={isToday || !isMounted} className="h-7 px-2 font-bold text-[9px] uppercase">Today</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="h-7 w-7 rounded-md"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => formattedDate && checkAndGenerate(formattedDate)} disabled={isLoading} className="h-8 w-8 rounded-lg bg-white shadow-sm"><RefreshCw className={cn("h-3.5 w-3.5 text-indigo-600", isLoading && "animate-spin")} /></Button>
                </div>
            </PageHeader>

            <BreadStats date={formattedDate} isLoading={isLoading}/>

            <div className="grid lg:grid-cols-12 gap-3 items-start">
                <div className="lg:col-span-9 h-full">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-64 bg-white/50 rounded-xl border border-dashed animate-pulse">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600 opacity-20" />
                        </div>
                    ) : (
                        <BreadDayView orders={orders || []} currentDate={formattedDate} onOrdersChange={() => {}} />
                    )}
                </div>
                <div className="lg:col-span-3">
                    <BreadClientList onListChange={() => {}} />
                </div>
            </div>
        </div>
    );
}
