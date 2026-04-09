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
    <header className="flex h-9 items-center gap-2 bg-white border-b px-3 print-hide sticky top-0 z-40 shadow-sm overflow-hidden shrink-0">
      <div className="flex-shrink-0 flex items-center gap-2">
         <Link href="/dashboard" className="flex items-center gap-1.5 transition-transform active:scale-95">
            <div className="h-5 w-5 flex items-center justify-center bg-primary rounded-md shadow-sm">
                <div className="w-2.5 h-2.5 border-2 border-white rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col -space-y-1.5">
                <span className="text-[10px] font-black tracking-tighter">iPOS</span>
                <span className="text-[5px] font-black text-primary uppercase">Smart</span>
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
                          "rounded-md font-bold px-2 h-6 text-[8px] uppercase tracking-tight",
                          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"
                      )}
                  >
                      <Link href={link.href} className="flex items-center gap-1">
                          <link.icon className="h-2.5 w-2.5" />
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
                    <button onClick={() => performBackgroundSync()} disabled={isSyncing} className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors pr-2 border-r h-4">
                        {isSyncing ? (
                            <RefreshCw className="h-2 w-2 animate-spin text-primary" />
                        ) : lastSync ? (
                            <Cloud className="h-2 w-2 text-emerald-500" />
                        ) : (
                            <Cloud className="h-2 w-2 opacity-30" />
                        )}
                        <span className="text-[6px] font-black uppercase tracking-tight">
                            {isSyncing ? 'Sync' : lastSync ? format(new Date(lastSync), 'HH:mm') : 'Off'}
                        </span>
                    </button>
                </TooltipTrigger>
                <TooltipContent><p className="text-[8px] font-bold">Cloud Sync</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>

        <Clock />
        
        <div className="flex items-center gap-0.5 ml-1">
            <Button asChild variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/5 hover:text-primary">
                <Link href="/profile"><Building className="h-3 w-3" /></Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/5 hover:text-primary">
                <Link href="/settings"><Settings className="h-3 w-3" /></Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
