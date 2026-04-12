'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * Client-side providers for the application.
 * Includes theme management, notifications, and global error suppression for known library issues.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Suppress Recharts defaultProps warning in React 18+
        // This is a known issue in Recharts that will be fixed in their next major release.
        if (typeof window !== 'undefined') {
            const originalConsoleError = console.error;
            console.error = (...args) => {
                if (typeof args[0] === 'string' && args[0].includes('defaultProps')) return;
                originalConsoleError(...args);
            };
        }
    }, []);

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster richColors position="top-right" />
        </ThemeProvider>
    );
}
