'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Users2, LayoutDashboard, ShoppingCart, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/products',  label: 'Produits',  icon: Package },
    { href: '/sell',      label: 'Vendre',    icon: ShoppingCart },
    { href: '/customers', label: 'Clients',   icon: Users2 },
    { href: '/stock',     label: 'Stock',     icon: Archive },
];

export function BottomNavBar() {
    const pathname = usePathname();
    return (
        <div className="print-hide fixed bottom-0 left-0 z-30 w-full h-14 border-t border-border bg-background/95 backdrop-blur md:hidden">
            <div className="grid grid-cols-5 h-full">
                {links.map(link => {
                    const active = pathname.startsWith(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors text-[10px]',
                                active && 'text-primary',
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
