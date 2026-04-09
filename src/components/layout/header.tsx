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
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/sell', label: 'Vendre', icon: ShoppingCart },
  { href: '/products', label: 'Catalog', icon: Package },
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
    <header className="flex h-10 items-center gap-2 bg-white border-b px-3 print-hide sticky top-0 z-40 shadow-sm shrink-0">
      <div className="flex-shrink-0 flex items-center gap-2">
         <Link href="/dashboard" className="flex items-center gap-1.5 transition-transform active:scale-95">
            <div className="h-6 w-6 flex items-center justify-center bg-primary rounded-md shadow-sm">
                <div className="w-3 h-3 border-2 border-white rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col -space-y-1">
                <span className="text-xs font-black tracking-tighter">iPOS</span>
                <span className="text-[7px] font-black text-primary uppercase">Smart POS</span>
            </div>
         </Link>
      </div>

      <nav className="hidden lg:flex items-center gap-0.5 flex-grow justify-center">
          {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                  <Button 
                      key={link.href}
                      asChild
                      variant="ghost"
                      size="sm"
                      className={cn(
                          "rounded-md font-bold px-2.5 h-7 text-[9px] uppercase tracking-tight",
                          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"
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

      <div className="flex-shrink-0 flex items-center gap-2">
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button onClick={() => performBackgroundSync()} disabled={isSyncing} className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors pr-3 border-r h-5">
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
                <TooltipContent><p className="text-[10px] font-bold">Cloud Sync Protocol</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>

        <Clock />
        
        <div className="flex items-center gap-1 ml-1">
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-primary/5">
                <Link href="/profile"><Building className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-primary/5">
                <Link href="/settings"><Settings className="h-4 w-4" /></Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
