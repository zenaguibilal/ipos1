'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings, Package, Users2, Archive, LayoutDashboard,
  ShoppingCart, Building, Cloud, RefreshCw, Wheat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/layout/clock';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { format } from 'date-fns';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sell', label: 'Vendre', icon: ShoppingCart },
  { href: '/products', label: 'Catalogue', icon: Package },
  { href: '/customers', label: 'Clients', icon: Users2 },
  { href: '/stock', label: 'Stock', icon: Archive },
  { href: '/bread', label: 'Pain', icon: Wheat },
];

export function AppHeader() {
  const pathname = usePathname();
  const { performBackgroundSync } = useAppActions();
  const { companyProfile, isSyncing } = useAppStore(state => ({
      companyProfile: state.companyProfile,
      isSyncing: state.isSyncing
  }));

  const lastSync = companyProfile?.last_sync_at;

  return (
    <header className="flex h-10 items-center gap-3 bg-white border-b px-4 print-hide sticky top-0 z-40 shadow-sm shrink-0">
      <div className="flex-shrink-0 flex items-center gap-2">
         <Link href="/dashboard" className="flex items-center gap-2 transition-transform active:scale-95">
            <div className="h-6 w-6 flex items-center justify-center bg-primary rounded shadow-sm">
                <div className="w-2.5 h-2.5 border-2 border-white rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-black tracking-tighter">iPOS Smart</span>
         </Link>
      </div>

      <nav className="hidden lg:flex items-center gap-1 flex-grow justify-center">
          {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                  <Button 
                      key={link.href}
                      asChild
                      variant="ghost"
                      size="sm"
                      className={cn(
                          "rounded-lg font-bold px-3 h-7 text-[9px] uppercase tracking-tight",
                          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                      )}
                  >
                      <Link href={link.href} className="flex items-center gap-1.5">
                          <link.icon className="h-3.5 w-3.5" />
                          <span>{link.label}</span>
                      </Link>
                  </Button>
              );
          })}
      </nav>

      <div className="flex-shrink-0 flex items-center gap-3">
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button onClick={() => performBackgroundSync()} disabled={isSyncing} className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors pr-3 border-r h-5">
                        {isSyncing ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                        ) : lastSync ? (
                            <Cloud className="h-3 w-3 text-emerald-500" />
                        ) : (
                            <Cloud className="h-3 w-3 opacity-30" />
                        )}
                        <span className="text-[8px] font-black uppercase tracking-tight">
                            {isSyncing ? 'Sync' : lastSync ? format(new Date(lastSync), 'HH:mm') : 'Offline'}
                        </span>
                    </button>
                </TooltipTrigger>
                <TooltipContent><p className="text-[9px] font-bold">Cloud Health Status</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>

        <Clock />
        
        <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/5">
                <Link href="/profile"><Building className="h-3.5 w-3.5" /></Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/5">
                <Link href="/settings"><Settings className="h-3.5 w-3.5" /></Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
