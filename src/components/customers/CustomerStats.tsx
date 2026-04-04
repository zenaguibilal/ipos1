
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, UserX, Landmark } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { formatCurrency, cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="luxury-card h-full bg-card/40 backdrop-blur-2xl border-white/5 rounded-[2rem] group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground group-hover:text-primary transition-all duration-500">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-3xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1">{value}</div>
            {subtitle && <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
    </Card>
);

export function CustomerStats() {
  const stats = useLiveQuery(() => customerService.getStats());

  if (stats === undefined) {
    return (
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[2rem] bg-card/40" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Base Clients" 
        value={String(stats.total)} 
        icon={Users} 
        colorClass="bg-primary/10 text-primary" 
        subtitle="Partenaires enregistrés" 
      />
      <StatCard 
        title="Créances Globales" 
        value={formatCurrency(stats.totalOutstanding)} 
        icon={Landmark} 
        colorClass="bg-destructive/10 text-destructive" 
        subtitle="Montant total à collecter" 
      />
      <StatCard 
        title="Retards de Paiement" 
        value={String(stats.overdue)} 
        icon={AlertTriangle} 
        colorClass="bg-amber-500/10 text-amber-500" 
        subtitle="Dossiers en souffrance" 
      />
      <StatCard 
        title="Plafonds Dépassés" 
        value={String(stats.overLimit)} 
        icon={UserX} 
        colorClass="bg-red-500/10 text-red-500" 
        subtitle="Bloqués pour crédit" 
      />
    </div>
  );
}
