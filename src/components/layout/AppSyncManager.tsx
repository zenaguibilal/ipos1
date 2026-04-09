'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';

/**
 * Composant client gérant la logique de synchronisation globale.
 */
export function AppSyncManager({ children }: { children: React.ReactNode }) {
    const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
    const companyProfile = useAppStore(state => state.companyProfile);
    const isSyncing = useAppStore(state => state.isSyncing);
    const initialSyncTriggered = useRef(false);

    useEffect(() => {
        fetchCompanyProfile();
    }, [fetchCompanyProfile]);

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

    useEffect(() => {
        const handleOnline = () => performBackgroundSync();
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [performBackgroundSync]);

    useEffect(() => {
        const SYNC_INTERVAL = 5 * 60 * 1000;
        const intervalId = setInterval(() => {
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                performBackgroundSync();
            }
        }, SYNC_INTERVAL);
        return () => clearInterval(intervalId);
    }, [performBackgroundSync]);

    return <>{children}</>;
}
