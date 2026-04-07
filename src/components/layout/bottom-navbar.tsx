'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Users2,
  LayoutDashboard,
  ShoppingCart,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const allNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/sell', label: 'Vendre', icon: ShoppingCart },
  { href: '/customers', label: 'Clients', icon: Users2 },
  { href: '/stock', label: 'Stock', icon: Archive },
];

export function BottomNavBar() {
  const pathname = usePathname();

  const navLinks = allNavLinks;

  return (
    <div className="fixed bottom-0 left-0 z-30 w-full border-t bg-background/80 backdrop-blur-xl md:hidden print-hide">
      <div className="grid grid-cols-5 items-stretch justify-around h-16">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary h-full',
              (pathname === link.href) ? 'text-primary' : ''
            )}
          >
            <link.icon className="h-5 w-5" />
            <span className="text-[10px] text-center">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}