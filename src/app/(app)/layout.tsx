'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';
import { SaleInfoBar } from '@/components/layout/SaleInfoBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
    const companyProfile       = useAppStore(s => s.companyProfile);
    const isSyncing            = useAppStore(s => s.isSyncing);
    const initialSyncTriggered = useRef(false);

    useEffect(() => { fetchCompanyProfile(); }, [fetchCompanyProfile]);

    useEffect(() => {
        if (companyProfile?.supabase_url && companyProfile?.supabase_key
            && !isSyncing && !initialSyncTriggered.current) {
            initialSyncTriggered.current = true;
            const t = setTimeout(() => performBackgroundSync(), 3000);
            return () => clearTimeout(t);
        }
    }, [companyProfile, isSyncing, performBackgroundSync]);

    useEffect(() => {
        const handler = () => performBackgroundSync();
        window.addEventListener('online', handler);
        return () => window.removeEventListener('online', handler);
    }, [performBackgroundSync]);

    useEffect(() => {
        const id = setInterval(() => {
            if (navigator.onLine) performBackgroundSync();
        }, 5 * 60 * 1000);
        return () => clearInterval(id);
    }, [performBackgroundSync]);

    return (
        <div className="flex h-screen flex-col bg-background">
            <AppHeader />
            <SaleInfoBar />
            <main className="flex-1 overflow-y-auto pb-14 md:pb-0">{children}</main>
            <BottomNavBar />
        </div>
    );
}
