'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  Package,
  Users2,
  History,
  Undo2,
  Archive,
  Wallet,
  LayoutDashboard,
  Wheat,
  ShoppingCart,
  Building,
  Download,
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

const allNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sell', label: 'Vendre', icon: ShoppingCart },
  { href: '/stock', label: 'Stock', icon: Archive },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/customers', label: 'Clients', icon: Users2 },
  { href: '/sales-history', label: 'Ventes', icon: History },
  { href: '/returns', label: 'Retours', icon: Undo2 },
  { href: '/expenses', label: 'Dépenses', icon: Wallet },
  { href: '/bread', label: 'Pain', icon: Wheat },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-20 items-center gap-4 bg-background/60 backdrop-blur-3xl px-6 sm:px-10 print-hide sticky top-0 z-40 border-b border-white/5">
      <div className="flex-1 flex justify-start items-center gap-4">
         <div className="flex items-center gap-3">
              <Link
                  href="/dashboard"
                  className="flex items-center gap-3 group"
              >
                  <div className="relative">
                    {/* Premium Glow Effect */}
                    <div className="absolute -inset-3 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 scale-50 group-hover:scale-100" />
                    <div className="relative h-10 w-10 flex items-center justify-center bg-black/40 rounded-xl border border-white/5 shadow-2xl group-hover:border-primary/30 transition-colors">
                        <Image 
                            src="/icon.svg" 
                            alt="iPOS Luxury Logo" 
                            width={32} 
                            height={32} 
                            priority 
                            className="relative drop-shadow-[0_0_8px_rgba(249,115,22,0.4)] transform transition-transform duration-500 group-hover:scale-110" 
                        />
                    </div>
                  </div>
                  <div className="flex flex-col -space-y-1">
                    <span className="hidden lg:inline-block text-xl font-black tracking-tighter group-hover:text-primary transition-colors">iPOS</span>
                    <span className="hidden lg:inline-block text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Luxury</span>
                  </div>
              </Link>
          </div>
      </div>

        <div className="flex-1 flex justify-center">
            <TooltipProvider>
                <nav className="hidden md:flex items-center gap-1.5 rounded-2xl border border-white/5 bg-black/40 p-1.5 shadow-2xl">
                    {allNavLinks.map(link => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Tooltip key={link.href} delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        asChild
                                        variant={isActive ? "secondary" : "ghost"}
                                        size="icon"
                                        className={cn(
                                            "rounded-xl relative transition-all duration-300 h-10 w-10",
                                            isActive ? "bg-primary/10 text-primary shadow-inner" : "hover:bg-white/5 hover:text-primary"
                                        )}
                                    >
                                        <Link href={link.href}>
                                            <link.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                                            {isActive && (
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                                            )}
                                            <span className="sr-only">{link.label}</span>
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl border-white/5 shadow-2xl bg-card">
                                    <p className="text-[10px] font-black uppercase tracking-widest">{link.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>
            </TooltipProvider>
        </div>


        <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-4">
                <div className="hidden xl:block">
                    <Clock />
                </div>
                <div className="flex items-center gap-1.5 bg-muted/30 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button asChild variant={pathname === '/install' ? "default" : "ghost"} size="icon" className="rounded-xl h-9 w-9">
                                    <Link href="/install">
                                        <Download className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[10px] font-black uppercase">Installer</p></TooltipContent>
                        </Tooltip>

                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button asChild variant={pathname === '/profile' ? "default" : "ghost"} size="icon" className="rounded-xl h-9 w-9">
                                    <Link href="/profile">
                                        <Building className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[10px] font-black uppercase">Profil</p></TooltipContent>
                        </Tooltip>

                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button asChild variant={pathname === '/settings' ? "default" : "ghost"} size="icon" className="rounded-xl h-9 w-9">
                                    <Link href="/settings">
                                        <Settings className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[10px] font-black uppercase">Système</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    </header>
  );
}