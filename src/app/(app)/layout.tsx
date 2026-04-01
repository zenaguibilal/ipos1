'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { useAppStore } from '@/stores/appStore';
import { useEffect } from 'react';
import { SaleInfoBar } from '@/components/layout/SaleInfoBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchCompanyProfile } = useAppStore(state => state.actions);

  // Fetch company profile on initial load.
  useEffect(() => {
    fetchCompanyProfile();
  }, [fetchCompanyProfile]);

  return (
    <div className="flex h-screen flex-col bg-transparent">
      <AppHeader />
      <SaleInfoBar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      <BottomNavBar />
    </div>
  );
}
