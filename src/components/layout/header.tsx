'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  Package,
  Users2,
  History,
  Archive,
  Wallet,
  LayoutDashboard,
  ShoppingCart,
  Building,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/layout/clock';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const allNavLinks = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/sell', label: 'Vendre', icon: ShoppingCart },
  { href: '/stock', label: 'Stock', icon: Archive },
  { href: '/products', label: 'Catalog', icon: Package },
  { href: '/customers', label: 'Clients', icon: Users2 },
  { href: '/sales-history', label: 'Ventes', icon: History },
  { href: '/expenses', label: 'Charges', icon: Wallet },
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
    <header className="flex h-14 items-center gap-4 bg-white border-b px-6 print-hide sticky top-0 z-40 shadow-sm">
      <div className="flex-1 flex justify-start items-center gap-4">
         <Link href="/dashboard" className="flex items-center gap-2 group transition-transform active:scale-95">
            <div className="h-7 w-7 flex items-center justify-center bg-primary rounded-lg shadow-sm group-hover:bg-primary/90">
                <Image src="/icon.svg" alt="Logo" width={16} height={16} priority className="invert brightness-0" />
            </div>
            <div className="flex flex-col -space-y-1">
                <span className="text-base font-black tracking-tighter">iPOS</span>
                <span className="text-[8px] font-black text-primary uppercase">Smart</span>
            </div>
         </Link>
      </div>

      <div className="flex-1 flex justify-center">
        <nav className="hidden md:flex items-center gap-0.5">
            {allNavLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                    <Button 
                        key={link.href}
                        asChild
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "rounded-lg font-bold px-3 h-8 text-[11px] uppercase tracking-tight",
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
      </div>

      <div className="flex-1 flex justify-end">
        <div className="flex items-center gap-3">
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <button 
                            onClick={() => performBackgroundSync()}
                            disabled={isSyncing}
                            className="hidden lg:flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                            {isSyncing ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                            ) : lastSync ? (
                                <Cloud className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                                <Cloud className="h-3.5 w-3.5 opacity-30" />
                            )}
                            <span className="text-[9px] font-black uppercase tracking-tight">
                                {isSyncing ? 'Sync' : lastSync ? format(new Date(lastSync), 'HH:mm') : 'Off'}
                            </span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs font-bold">Cloud Sync</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <div className="hidden xl:block">
                <Clock />
            </div>
            
            <div className="flex items-center gap-0.5">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary">
                    <Link href="/profile"><Building className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary">
                    <Link href="/settings"><Settings className="h-4 w-4" /></Link>
                </Button>
            </div>
        </div>
      </div>
    </header>
  );
}
