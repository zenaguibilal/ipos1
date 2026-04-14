import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';
import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { SaleInfoBar } from '@/components/layout/SaleInfoBar';
import { AppSyncManager } from '@/components/layout/AppSyncManager';
import { KeyboardShortcutsProvider } from '@/contexts/KeyboardShortcutsContext';
import { KeyboardShortcutsHelp } from '@/components/layout/KeyboardShortcutsHelp';

const APP_NAME = "iPOS Zen";
const APP_DEFAULT_TITLE = "iPOS Zen - Point de Vente Premium";
const APP_TITLE_TEMPLATE = "%s - iPOS Zen";
const APP_DESCRIPTION = "Application de point de vente intelligente et local-first";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0a0806" }],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
         <link rel="icon" href="/icon.svg" type="image/svg+xml" />
         <link rel="apple-touch-icon" href="/icon.svg" />
         <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
          <KeyboardShortcutsProvider>
            <AppSyncManager>
                <div className="flex h-screen flex-col bg-background overflow-hidden">
                    <AppHeader />
                    <SaleInfoBar />
                    <main className="flex-1 overflow-y-auto pb-14 md:pb-0">
                        {children}
                    </main>
                    <BottomNavBar />
                    <KeyboardShortcutsHelp />
                </div>
            </AppSyncManager>
          </KeyboardShortcutsProvider>
        </ClientProviders>
        
        {/* CRITICAL: Isolated Print Portal for A4 and Thermal output */}
        <div id="receipt-for-print" className="hidden print:block bg-white min-h-screen w-full"></div>
      </body>
    </html>
  );
}