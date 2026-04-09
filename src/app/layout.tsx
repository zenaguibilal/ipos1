import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';
import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { SaleInfoBar } from '@/components/layout/SaleInfoBar';
import { AppSyncManager } from '@/components/layout/AppSyncManager';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'iPOS Smart - Point de Vente',
    description: 'Système de فروش moderne و ذكي لشاشات POS',
};

export const viewport: Viewport = {
    themeColor: '#2563eb',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={inter.className}>
                <ClientProviders>
                    <AppSyncManager>
                        <div className="flex h-screen flex-col bg-transparent overflow-hidden">
                            <AppHeader />
                            <SaleInfoBar />
                            <main className="flex-1 overflow-y-auto pb-16 md:pb-0 custom-scrollbar bg-background/50">
                                {children}
                            </main>
                            <BottomNavBar />
                        </div>
                    </AppSyncManager>
                </ClientProviders>
            </body>
        </html>
    );
}
