'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';
import { SaleInfoBar } from '@/components/layout/SaleInfoBar';

/**
 * Layout racine de l'application iPOS Luxury.
 * Orchestre la synchronisation proactive et les cycles de maintenance en arrière-plan.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
    const companyProfile = useAppStore(state => state.companyProfile);
    const isSyncing = useAppStore(state => state.isSyncing);
    const initialSyncTriggered = useRef(false);

    // Initialisation du profil établissement
    useEffect(() => {
        fetchCompanyProfile();
    }, [fetchCompanyProfile]);

    // Synchronisation proactive au lancement de l'application
    useEffect(() => {
        if (
            companyProfile?.supabase_url &&
            companyProfile?.supabase_key &&
            !isSyncing &&
            !initialSyncTriggered.current
        ) {
            initialSyncTriggered.current = true;
            const timeoutId = setTimeout(() => {
                performBackgroundSync();
            }, 3000);
            return () => clearTimeout(timeoutId);
        }
    }, [companyProfile, isSyncing, performBackgroundSync]);

    // Détection du retour en ligne pour synchronisation immédiate
    useEffect(() => {
        const handleOnline = () => performBackgroundSync();
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [performBackgroundSync]);

    // Cycle de synchronisation automatisé toutes les 5 minutes
    useEffect(() => {
        const SYNC_INTERVAL = 5 * 60 * 1000;
        const intervalId = setInterval(() => {
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                performBackgroundSync();
            }
        }, SYNC_INTERVAL);
        return () => clearInterval(intervalId);
    }, [performBackgroundSync]);

    return (
        <div className="flex h-screen flex-col bg-transparent">
            <AppHeader />
            <SaleInfoBar />
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
            <BottomNavBar />
        </div>
    );
}