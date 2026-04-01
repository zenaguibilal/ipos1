
'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { useAppStore } from '@/stores/appStore';
import { useEffect } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchProfile } = useAppStore(state => state.actions);

  // Fetch company profile on initial load, as there is no user session anymore.
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="flex h-screen flex-col bg-transparent">
      <AppHeader />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      <BottomNavBar />
    </div>
  );
}
