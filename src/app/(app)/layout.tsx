'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { useAppActions } from '@/stores/appStore';
import { useEffect } from 'react';
import { SaleInfoBar } from '@/components/layout/SaleInfoBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchCompanyProfile, performBackgroundSync } = useAppActions();

  // Fetch company profile on initial load.
  useEffect(() => {
    fetchCompanyProfile();
  }, [fetchCompanyProfile]);

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
