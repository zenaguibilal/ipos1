import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';
import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { SaleInfoBar } from '@/components/layout/SaleInfoBar';
import { AppSyncManager } from '@/components/layout/AppSyncManager';

const APP_NAME = 'iPOS Smart';
const APP_DEFAULT_TITLE = 'iPOS Smart - Point de Vente';
const APP_DESCRIPTION = "Système de vente moderne, سريع وذكي";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    applicationName: APP_NAME,
    title: {
        default: APP_DEFAULT_TITLE,
        template: '%s - iPOS Smart',
    },
    description: APP_DESCRIPTION,
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: APP_DEFAULT_TITLE,
    },
};

export const viewport: Viewport = {
    themeColor: '#2563eb',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={inter.className}>
                <ClientProviders>
                    <AppSyncManager>
                        <div className="flex h-screen flex-col bg-transparent overflow-hidden">
                            <AppHeader />
                            <SaleInfoBar />
                            <main className="flex-1 overflow-y-auto pb-16 md:pb-0 custom-scrollbar">
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
