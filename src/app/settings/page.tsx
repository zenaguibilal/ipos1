'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    Database, 
    HardDrive, 
    Activity, 
    Server, 
    Smartphone, 
    Monitor, 
    Globe, 
    ShieldCheck, 
    Zap, 
    Package, 
    Users2, 
    ShoppingCart, 
    Cloud,
    RefreshCw,
} from "lucide-react";
import { db } from "@/lib/db";
import { useAppStore, useAppActions } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const [stats, setStats] = useState({ products: 0, customers: 0, sales: 0, logs: 0 });
    const [storage, setStorage] = useState<{ used: string, quota: string, percent: number } | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { companyProfile, isSyncing } = useAppStore();
    const { performCloudSync } = useAppActions();

    useEffect(() => {
        setIsMounted(true);
        db.products.count().then(p => setStats(s => ({...s, products: p})));
        db.customers.count().then(c => setStats(s => ({...s, customers: c})));
        db.sales.count().then(sa => setStats(s => ({...s, sales: sa})));
        db.inventory_logs.count().then(l => setStats(s => ({...s, logs: l})));

        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(e => {
                const used = (e.usage || 0) / (1024 * 1024);
                const quota = (e.quota || 0) / (1024 * 1024);
                setStorage({ used: used.toFixed(1) + 'MB', quota: (quota/1024).toFixed(0) + 'GB', percent: Math.round((e.usage||0)/(e.quota||1)*100)});
            });
        }
    }, []);

    if (!isMounted) return null;

    return (
        <div className="p-3 sm:p-4 space-y-4 max-w-[1200px] mx-auto animate-in fade-in duration-500">
            <PageHeader title="Système" description="Maintenance et diagnostic" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="rounded-xl border shadow-sm">
                    <CardHeader className="p-4 border-b"><CardTitle className="text-xs font-black uppercase flex items-center gap-2"><Cloud className="h-3 w-3 text-primary"/> Cloud Sync</CardTitle></CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg">
                            <span className="text-[10px] font-bold uppercase opacity-50">Dernière Sync</span>
                            <span className="text-xs font-black">{companyProfile?.last_sync_at ? format(new Date(companyProfile.last_sync_at), 'HH:mm', { locale: fr }) : 'Jamais'}</span>
                        </div>
                        <Button onClick={() => performCloudSync('push')} disabled={isSyncing} className="w-full h-10 font-bold text-xs uppercase tracking-tight gap-2 shadow-sm">
                            {isSyncing ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Zap className="h-3 w-3" />}
                            Forcer Sauvegarde
                        </Button>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                    <CardHeader className="p-4 border-b"><CardTitle className="text-xs font-black uppercase flex items-center gap-2"><Database className="h-3 w-3 text-primary"/> Stockage Local</CardTitle></CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                            {[ {l:'P',v:stats.products}, {l:'C',v:stats.customers}, {l:'V',v:stats.sales}, {l:'A',v:stats.logs} ].map(i => (
                                <div key={i.l} className="p-2 bg-muted/20 rounded-lg text-center"><p className="text-[8px] font-black opacity-40">{i.l}</p><p className="text-sm font-black">{i.v}</p></div>
                            ))}
                        </div>
                        {storage && <div className="space-y-1"><div className="flex justify-between text-[8px] font-black opacity-40 uppercase"><span>{storage.used} / {storage.quota}</span><span>{storage.percent}%</span></div><Progress value={storage.percent} className="h-1" /></div>}
                    </CardContent>
                </Card>
            </div>

            <DataManagementCard />
        </div>
    );
}