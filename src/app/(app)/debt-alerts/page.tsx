'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    BellRing, 
    MessageCircle, 
    RefreshCw, 
    User, 
    Calendar, 
    Landmark, 
    ChevronRight,
    Search,
    AlertCircle,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function DebtAlertsPage() {
    const [alerts, setAlerts] = useState<Customer[] | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAlerts = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await customerService.getDebtAlerts();
            setAlerts(data);
        } catch (e) {
            toast.error("Impossible de charger les alertes.");
            setAlerts([]);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const handleWhatsApp = (customer: Customer) => {
        if (!customer.phone) return;
        const message = encodeURIComponent(
            `Bonjour ${customer.firstName}, j'espère que vous allez bien. C'est iPOS. ` +
            `Sauf erreur de ma part, votre solde de ${formatCurrency(customer.outstandingBalance)} ` +
            `pour ce mois n'a pas encore été réglé. Merci de passer nous voir. Cordialement.`
        );
        window.open(`https://wa.me/${customer.phone}?text=${message}`, '_blank');
    };

    const filteredAlerts = alerts?.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );

    const isLoading = alerts === undefined;

    return (
        <div className="p-6 sm:p-10 space-y-10 max-w-[1400px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Alertes Recouvrement" 
                description="Suivi intelligent des retards de paiement (sans versement ce mois-ci)"
            >
                <Button 
                    variant="outline" 
                    onClick={fetchAlerts} 
                    className="rounded-2xl h-12 border-primary/20 bg-card hover:bg-primary/5 transition-all"
                    disabled={isRefreshing}
                >
                    <RefreshCw className={cn("h-4 w-4 text-primary mr-2", isRefreshing && "animate-spin")} />
                    Actualiser
                </Button>
            </PageHeader>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-card/20 p-2 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <div className="relative group flex-grow max-w-xl px-4">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Rechercher un client en retard..."
                        className="pl-14 h-14 rounded-2xl bg-black/20 border-none shadow-inner font-bold text-lg"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 px-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground/40">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span>Clients à jour exclus</span>
                    </div>
                </div>
            </div>

            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem] bg-card/40 animate-pulse" />)}
                    </div>
                ) : filteredAlerts?.length === 0 ? (
                    <div className="py-40 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-700">
                        <div className="p-10 rounded-[3rem] bg-emerald-500/5 border border-dashed border-emerald-500/20">
                            <CheckCircle2 className="h-20 w-20 text-emerald-500/20" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tighter text-emerald-500">Sérénité de Caisse</h3>
                            <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                                Tous vos clients sont à jour ou ont déjà versé un acompte ce mois-ci.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
                        {filteredAlerts?.map(customer => (
                            <Card key={customer.uuid} className="luxury-card group bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden rounded-[2.5rem] relative">
                                <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                                    <BellRing className="h-32 w-32 rotate-12" />
                                </div>

                                <CardHeader className="p-8 pb-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive shadow-inner">
                                            <AlertCircle className="h-6 w-6" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black uppercase text-destructive tracking-widest bg-destructive/10 px-3 py-1 rounded-full">Retard Critique</span>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors truncate">
                                        {customer.firstName} {customer.lastName}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                        <Calendar className="h-3 w-3" />
                                        Règlement dû le {customer.settlementDay} de chaque mois
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 pt-4 space-y-6">
                                    <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 space-y-1 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                        <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest relative z-10">Solde Immédiatement Dû</p>
                                        <p className="text-4xl font-black text-destructive tracking-tighter relative z-10">{formatCurrency(customer.outstandingBalance)}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-2xl h-14 gap-3 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
                                            onClick={() => handleWhatsApp(customer)}
                                            disabled={!customer.phone}
                                        >
                                            <MessageCircle className="h-5 w-5" /> Relancer
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            asChild
                                            className="rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all group/btn"
                                        >
                                            <Link href={`/customers/${customer.uuid}`}>
                                                Fiche <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-10 bg-primary/5 rounded-[3rem] border border-primary/10 flex items-start gap-6 relative overflow-hidden group">
                <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-primary/5 group-hover:opacity-20 transition-opacity" />
                <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-inner relative z-10">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-2 relative z-10">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Intelligence de Recouvrement iPOS</p>
                    <p className="text-[11px] text-muted-foreground/60 font-medium leading-relaxed max-w-4xl italic">
                        Le système analyse dynamiquement vos flux financiers. Un client ayant effectué un versement partiel ou total durant le mois en cours est automatiquement retiré de cette liste, même si son jour de règlement est dépassé. Cela vous permet de concentrer vos efforts de relance uniquement sur les retards effectifs.
                    </p>
                </div>
            </div>
        </div>
    );
}
