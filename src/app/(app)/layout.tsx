
'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';
import { SaleInfoBar } from '@/components/layout/SaleInfoBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
  const companyProfile = useAppStore(state => state.companyProfile);
  const isSyncing = useAppStore(state => state.isSyncing);
  const initialSyncTriggered = useRef(false);

  // Fetch company profile on initial load.
  useEffect(() => {
    fetchCompanyProfile();
  }, [fetchCompanyProfile]);

  // Proactive Sync on App Launch
  // Triggers as soon as the profile is loaded and cloud credentials are available
  useEffect(() => {
    if (companyProfile?.supabase_url && companyProfile?.supabase_key && !isSyncing && !initialSyncTriggered.current) {
      initialSyncTriggered.current = true;
      // Brief delay to ensure database stability on mount
      const timeoutId = setTimeout(() => {
        performBackgroundSync();
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [companyProfile, isSyncing, performBackgroundSync]);

  // Automated Background Sync - Every 5 minutes
  useEffect(() => {
    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
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
