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
    <header className="flex h-16 items-center gap-4 bg-background/80 px-4 sm:px-6 print-hide sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="flex-1 flex justify-start">
         <div className="flex items-baseline gap-2">
              <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-semibold"
              >
                  <Image src="/icon.svg" alt="iPOS logo" width={32} height={32} priority />
                  <span className="hidden sm:inline-block text-xl font-semibold">iPOS</span>
              </Link>
          </div>
      </div>

        <div className="flex-1 flex justify-center">
            <TooltipProvider>
                <nav className="hidden md:flex items-center gap-1 rounded-full border bg-black/20 p-1">
                    {allNavLinks.map(link => (
                        <Tooltip key={link.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button 
                                    asChild
                                    variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
                                    size="icon"
                                    className="rounded-full relative"
                                >
                                    <Link href={link.href}>
                                        <link.icon className="h-5 w-5" />
                                        <span className="sr-only">{link.label}</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{link.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </nav>
            </TooltipProvider>
        </div>


        <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-2 sm:gap-4">
                <Clock />
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-full border border-border/50">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button asChild variant={pathname === '/install' ? "default" : "ghost"} size="icon" className="rounded-full h-9 w-9">
                                    <Link href="/install">
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">Installer</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Installer l'App</p></TooltipContent>
                        </Tooltip>

                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button asChild variant={pathname === '/profile' ? "default" : "ghost"} size="icon" className="rounded-full h-9 w-9">
                                    <Link href="/profile">
                                        <Building className="h-4 w-4" />
                                        <span className="sr-only">Profil</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Profil Entreprise</p></TooltipContent>
                        </Tooltip>

                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button asChild variant={pathname === '/settings' ? "default" : "ghost"} size="icon" className="rounded-full h-9 w-9">
                                    <Link href="/settings">
                                        <Settings className="h-4 w-4" />
                                        <span className="sr-only">Paramètres</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Paramètres Système</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    </header>
  );
}
