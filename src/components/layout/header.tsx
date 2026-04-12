'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Settings, Package, Users2, History, Undo2, Archive,
    Wallet, LayoutDashboard, Wheat, ShoppingCart, Building,
    Download, Coins, BellRing, Cloud, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/layout/clock';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const navLinks = [
    { href: '/dashboard',    label: 'Dashboard', icon: LayoutDashboard },
    { href: '/sell',         label: 'Vendre',    icon: ShoppingCart },
    { href: '/debt-alerts',  label: 'Alertes',   icon: BellRing },
    { href: '/stock',        label: 'Stock',     icon: Archive },
    { href: '/products',     label: 'Produits',  icon: Package },
    { href: '/customers',    label: 'Clients',   icon: Users2 },
    { href: '/sales-history',label: 'Ventes',    icon: History },
    { href: '/returns',      label: 'Retours',   icon: Undo2 },
    { href: '/expenses',     label: 'Dépenses',  icon: Wallet },
    { href: '/bread',        label: 'Pain',      icon: Wheat },
    { href: '/zakat',        label: 'Zakat',     icon: Coins },
];

export function AppHeader() {
    const pathname = usePathname();
    const { performBackgroundSync } = useAppActions();
    const { companyProfile, isSyncing } = useAppStore(state => ({
        companyProfile: state.companyProfile,
        isSyncing:      state.isSyncing,
    }));

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const lastSync = companyProfile?.last_sync_at;

    return (
        <header className="print-hide sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm text-foreground hover:text-primary transition-colors shrink-0">
                <span className="text-primary font-extrabold">iPOS</span>
                <span className="text-muted-foreground font-normal hidden lg:inline">Zen</span>
            </Link>

            <div className="h-5 w-px bg-border mx-1 shrink-0" />

            {/* Main nav */}
            <TooltipProvider delayDuration={0}>
                <nav className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
                    {navLinks.map(link => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Tooltip key={link.href}>
                                <TooltipTrigger asChild>
                                    <Button
                                        asChild
                                        variant={isActive ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className={cn(
                                            'h-8 w-8 p-0 rounded-md shrink-0',
                                            isActive && 'text-primary bg-primary/10',
                                        )}
                                    >
                                        <Link href={link.href}>
                                            <link.icon className="h-4 w-4" />
                                            <span className="sr-only">{link.label}</span>
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p className="text-xs">{link.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Sync status */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => performBackgroundSync()}
                                disabled={isSyncing}
                                className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted disabled:opacity-60"
                            >
                                {isSyncing ? (
                                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                                ) : (mounted && lastSync) ? (
                                    <Cloud className="h-3 w-3 text-emerald-500" />
                                ) : (
                                    <Cloud className="h-3 w-3" />
                                )}
                                <span className="hidden xl:inline text-xs">
                                    {isSyncing
                                        ? 'Sync...'
                                        : (mounted && lastSync)
                                        ? format(new Date(lastSync), 'HH:mm', { locale: fr })
                                        : 'Non sync'}
                                </span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="text-xs">Synchroniser maintenant</p>
                        </TooltipContent>
                    </Tooltip>

                    <Clock />

                    <ThemeToggle />

                    <div className="h-5 w-px bg-border mx-1" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant={pathname === '/install' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-md">
                                <Link href="/install"><Download className="h-4 w-4" /></Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom"><p className="text-xs">Installer PWA</p></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant={pathname === '/profile' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-md">
                                <Link href="/profile"><Building className="h-4 w-4" /></Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom"><p className="text-xs">Profil</p></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant={pathname === '/settings' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-md">
                                <Link href="/settings"><Settings className="h-4 w-4" /></Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom"><p className="text-xs">Paramètres</p></TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </header>
    );
}
