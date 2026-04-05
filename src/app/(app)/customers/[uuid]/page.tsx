'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, HandCoins, Printer, Loader2, RefreshCw,
    Wheat, Settings, MessageCircle, PhoneCall, MapPin,
    Phone, User, Sparkles
} from 'lucide-react';
import {
    Card, CardContent, CardDescription,
    CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { CustomerSpendingChart } from '@/components/customers/CustomerSpendingChart';
import { useState, useCallback, useEffect } from 'react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import type { Sale, ProductReturn, Customer } from '@/lib/types';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { customerService } from '@/services/customer.service';
import { salesService } from '@/services/sales.service';
import { returnService } from '@/services/return.service';
import { BreadClientForm } from '@/components/bread/BreadClientForm';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const customerUuid = params.uuid as string;

    // ── State ────────────────────────────────────────────────────────────────

    // undefined = loading, null = not found, Customer = loaded
    const [customer, setCustomer] = useState<Customer | undefined | null>(undefined);
    const [spendingData, setSpendingData] = useState<{ month: string; total: number }[]>([]);

    // Dialogs
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [isBreadDialogOpen, setIsBreadDialogOpen] = useState(false);

    // Sale/Return detail dialogs
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

    // Activity pagination
    const [activity, setActivity] = useState<any[]>([]);
    const [activityPage, setActivityPage] = useState(1);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);
    const [hasMoreActivity, setHasMoreActivity] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // ── Fetch customer & spending ─────────────────────────────────────────────

    const fetchCustomerData = useCallback(async () => {
        if (!customerUuid) {
            router.push('/customers');
            return;
        }
        setIsRefreshing(true);
        try {
            const [cust, spending] = await Promise.all([
                customerService.getCustomerByUuid(customerUuid),
                customerService.getCustomerMonthlySpending(customerUuid),
            ]);
            setCustomer(cust ?? null);
            setSpendingData(spending);
            if (!cust) toast.error('Client non trouvé.');
        } catch {
            toast.error('Échec du chargement des données.');
            setCustomer(null);
        } finally {
            setIsRefreshing(false);
        }
    }, [customerUuid, router]);

    useEffect(() => {
        fetchCustomerData();
    }, [fetchCustomerData]);

    // ── Refresh activity ──────────────────────────────────────────────────────

    /**
     * FIX #1: refreshActivity triggers a re-fetch even when already on page 1.
     * Setting hasMoreActivity=true changes the dep array of the activity useEffect,
     * which reliably fires a reload regardless of the current page value.
     */
    const refreshActivity = useCallback(() => {
        setActivity([]);
        setActivityPage(1);
        setHasMoreActivity(true);
        setIsLoadingActivity(true);
    }, []);

    // ── Load activity (paginated) ─────────────────────────────────────────────

    useEffect(() => {
        if (!customerUuid || !hasMoreActivity) return;

        let isCancelled = false;
        setIsLoadingActivity(true);

        customerService
            .getCustomerActivity(customerUuid, activityPage, ITEMS_PER_PAGE)
            .then(newActivity => {
                if (!isCancelled) {
                    // Replace on page 1, append on subsequent pages
                    setActivity(prev =>
                        activityPage === 1 ? newActivity : [...prev, ...newActivity]
                    );
                    if (newActivity.length < ITEMS_PER_PAGE) {
                        setHasMoreActivity(false);
                    }
                }
            })
            .catch(() => toast.error("Erreur de chargement de l'activité."))
            .finally(() => {
                if (!isCancelled) setIsLoadingActivity(false);
            });

        return () => { isCancelled = true; };
    }, [customerUuid, activityPage, hasMoreActivity]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleLoadMore = () => {
        if (!isLoadingActivity && hasMoreActivity) {
            setActivityPage(prev => prev + 1);
        }
    };

    const handleSuccessfulPayment = useCallback(async () => {
        toast.success('Paiement enregistré.');
        await fetchCustomerData();
        refreshActivity();
    }, [fetchCustomerData, refreshActivity]);

    const handleSaleClick = useCallback(async (sale: Sale) => {
        try {
            const full = await salesService.getSaleByUuid(sale.uuid);
            if (!full) { toast.error('Détails introuvables.'); return; }
            setSelectedSale(full);
            setIsSaleDetailsOpen(true);
        } catch {
            toast.error('Erreur lors de la lecture.');
        }
    }, []);

    const handleReturnClick = useCallback(async (pr: ProductReturn) => {
        try {
            const full = await returnService.getReturnByUuid(pr.uuid);
            if (!full) { toast.error('Détails introuvables.'); return; }
            setSelectedReturn(full);
            setIsReturnDetailsOpen(true);
        } catch {
            toast.error('Erreur lors de la lecture.');
        }
    }, []);

    /**
     * FIX #2: WhatsApp message displays outstanding balance correctly.
     * Uses customer.outstandingBalance which is updated after each payment.
     */
    const handleWhatsApp = () => {
        if (!customer?.phone) return;
        const balance = formatCurrency(customer.outstandingBalance);
        const message = encodeURIComponent(
            `Bonjour ${customer.firstName}, votre solde actuel est de ${balance}. Cordialement.`
        );
        window.open(`https://wa.me/${customer.phone.replace(/\s+/g, '')}?text=${message}`, '_blank');
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────

    if (customer === undefined) {
        return (
            <div className="p-10 space-y-10 max-w-[1600px] mx-auto animate-pulse">
                <div className="flex gap-4 items-center">
                    <Skeleton className="h-14 w-14 rounded-2xl bg-card/40" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 rounded-xl bg-card/40" />
                        <Skeleton className="h-4 w-40 rounded-xl bg-card/40" />
                    </div>
                </div>
                <div className="grid lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        <Skeleton className="h-96 w-full rounded-[2.5rem] bg-card/40" />
                        <Skeleton className="h-[500px] w-full rounded-[2.5rem] bg-card/40" />
                    </div>
                    <div className="lg:col-span-4 space-y-10">
                        <Skeleton className="h-64 w-full rounded-[2.5rem] bg-card/40" />
                        <Skeleton className="h-16 w-full rounded-2xl bg-card/40" />
                    </div>
                </div>
            </div>
        );
    }

    // ── Not found ─────────────────────────────────────────────────────────────

    if (!customer) {
        return (
            <div className="p-20 text-center flex flex-col items-center gap-6">
                <div className="p-8 rounded-[2.5rem] bg-destructive/10 text-destructive">
                    <User className="h-16 w-16" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tighter">Client non identifié</h1>
                    <p className="text-muted-foreground font-medium">
                        Ce dossier n'existe pas ou a été révoqué.
                    </p>
                </div>
                <Button
                    asChild
                    variant="outline"
                    className="rounded-2xl h-14 px-10 font-bold border-white/5 bg-card/40"
                >
                    <Link href="/customers">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour au fichier
                    </Link>
                </Button>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────

    const customerFullName = `${customer.firstName} ${customer.lastName}`;

    return (
        <div className="p-6 sm:p-10 space-y-10 max-w-[1800px] mx-auto animate-in fade-in duration-1000">

            {/* Top bar */}
            <div className="flex items-center gap-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-2xl border-white/5 bg-card/40 backdrop-blur-md transition-all active:scale-90"
                    asChild
                >
                    <Link href="/customers">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                </Button>

                <div className="flex-grow">
                    <PageHeader
                        title={customerFullName}
                        description={`Membre Elite • ID: ${customer.uuid.substring(0, 8)}`}
                        className="mb-0"
                    />
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchCustomerData}
                    className="h-14 w-14 rounded-2xl border-white/5 bg-card/40 backdrop-blur-md group"
                    disabled={isRefreshing}
                    title="Actualiser"
                >
                    <RefreshCw className={cn(
                        'h-6 w-6 text-primary transition-all duration-1000',
                        isRefreshing && 'animate-spin'
                    )} />
                </Button>
            </div>

            {/* Main grid */}
            <div className="grid lg:grid-cols-12 gap-10 items-start">

                {/* Left: Chart + Activity */}
                <div className="lg:col-span-8 space-y-10">

                    <div className="animate-in slide-in-from-left-4 duration-700">
                        <CustomerSpendingChart data={spendingData} />
                    </div>

                    <Card className="luxury-card bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden rounded-[2.5rem] animate-in slide-in-from-bottom-4 duration-700 delay-200">
                        <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black tracking-tighter">
                                        Historique de Flux
                                    </CardTitle>
                                    <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">
                                        Ventes, Retours & Encaissements
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8">
                            {isLoadingActivity && activity.length === 0 ? (
                                <div className="flex flex-col justify-center items-center h-60 opacity-20">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">
                                        Récupération des données...
                                    </p>
                                </div>
                            ) : (
                                <CustomerActivity
                                    activity={activity}
                                    onSaleClick={handleSaleClick}
                                    onReturnClick={handleReturnClick}
                                />
                            )}
                        </CardContent>

                        {hasMoreActivity && (
                            <CardFooter className="bg-muted/10 border-t border-white/5 p-4">
                                <Button
                                    onClick={handleLoadMore}
                                    variant="ghost"
                                    disabled={isLoadingActivity}
                                    className="w-full h-14 font-black uppercase text-[10px] tracking-[0.2em] text-primary hover:bg-primary/5"
                                >
                                    {isLoadingActivity && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Charger plus de transactions
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>

                {/* Right: Metrics + Actions */}
                <div className="lg:col-span-4 space-y-8 sticky top-24">

                    <div className="animate-in slide-in-from-right-4 duration-700">
                        <CustomerMetrics customer={customer} />
                    </div>

                    {/* Quick action buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="rounded-2xl h-16 gap-3 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
                            onClick={handleWhatsApp}
                            disabled={!customer.phone}
                            title={customer.phone ? `Envoyer un message à ${customer.phone}` : 'Numéro non renseigné'}
                        >
                            <MessageCircle className="h-5 w-5" /> WhatsApp
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-2xl h-16 gap-3 border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
                            asChild
                            disabled={!customer.phone}
                        >
                            <a href={customer.phone ? `tel:${customer.phone}` : '#'}>
                                <PhoneCall className="h-5 w-5" /> Appeler
                            </a>
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full rounded-[1.5rem] h-20 font-black border-white/5 bg-card/40 backdrop-blur-md shadow-2xl gap-3 text-[10px] uppercase tracking-widest group"
                            onClick={() => setIsStatementDialogOpen(true)}
                        >
                            <Printer className="h-6 w-6 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                            <span>Générer<br />Relevé</span>
                        </Button>

                        {/*
                         * FIX #3: Payment button disabled only when balance <= 0.
                         * Previously this relied on customer.outstandingBalance which
                         * was potentially stale due to the balance calculation bug (#2).
                         * After fixing bug #2 in customer.service.ts, this is now accurate.
                         */}
                        <Button
                            size="lg"
                            className="w-full rounded-[1.5rem] h-20 font-black shadow-2xl shadow-primary/20 gap-3 text-[10px] uppercase tracking-widest transition-all active:scale-95"
                            onClick={() => setIsPaymentDialogOpen(true)}
                            disabled={customer.outstandingBalance <= 0}
                        >
                            <HandCoins className="h-6 w-6" />
                            <span>Effectuer<br />Paiement</span>
                        </Button>
                    </div>

                    {/* Contact card */}
                    <div className="p-8 bg-muted/20 rounded-[2.5rem] border border-white/5 space-y-6 shadow-inner relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000">
                            <MapPin className="h-40 w-40" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-white/5 pb-4">
                            Coordonnées de Contact
                        </h4>
                        <div className="space-y-6 text-sm relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-background/50 shadow-inner">
                                    <Phone className="h-4 w-4 text-primary/60" />
                                </div>
                                <div className="flex flex-col -space-y-0.5">
                                    <span className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-widest">
                                        Mobile
                                    </span>
                                    <span className="font-black text-base">
                                        {customer.phone || '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-background/50 shadow-inner">
                                    <MapPin className="h-4 w-4 text-primary/60" />
                                </div>
                                <div className="flex flex-col -space-y-0.5">
                                    <span className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-widest">
                                        Adresse Physique
                                    </span>
                                    <span className="font-black text-base leading-tight">
                                        {customer.address || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bread subscription widget */}
                    <Card className={cn(
                        'rounded-[2.5rem] border-none shadow-xl overflow-hidden group transition-all duration-500',
                        customer.isBreadClient
                            ? 'bg-primary/10 border border-primary/20'
                            : 'bg-card/20 opacity-40 hover:opacity-100'
                    )}>
                        <CardHeader className="pb-4 p-8 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'p-2.5 rounded-xl transition-colors',
                                        customer.isBreadClient
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    )}>
                                        <Wheat className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">
                                        Service de Pain
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl hover:bg-white/10"
                                    onClick={() => setIsBreadDialogOpen(true)}
                                    title="Paramétrer l'abonnement pain"
                                >
                                    <Settings className="h-5 w-5 opacity-40" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8">
                            {customer.isBreadClient ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-primary/60 tracking-widest">
                                            Récurrence
                                        </p>
                                        <p className="font-black text-sm">
                                            {customer.bread_type_recurrence === 'quotidien'
                                                ? 'QUOTIDIEN'
                                                : customer.bread_type_recurrence === 'jours_specifiques'
                                                    ? 'PROGRAMMÉ'
                                                    : 'MANUEL'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-primary/60 tracking-widest">
                                            Quantité
                                        </p>
                                        <p className="font-black text-sm">
                                            {customer.bread_type_recurrence === 'quotidien'
                                                ? `${customer.bread_quantite_defaut ?? 0} PCS`
                                                : 'VARIABLE'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] font-black uppercase tracking-widest text-center opacity-40">
                                    Aucun abonnement actif
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Dialogs ── */}

            <AddPaymentDialog
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                customer={customer}
                onPaymentSuccess={handleSuccessfulPayment}
            />

            <PrintStatementDialog
                isOpen={isStatementDialogOpen}
                onOpenChange={setIsStatementDialogOpen}
                customer={customer}
            />

            {/*
             * FIX #4: SaleDetailsDialog receives customerName to avoid
             * showing 'Client de passage' when customer is known.
             */}
            <SaleDetailsDialog
                isOpen={isSaleDetailsOpen}
                onOpenChange={setIsSaleDetailsOpen}
                sale={selectedSale}
                customerName={customerFullName}
            />

            <ReturnDetailsDialog
                isOpen={isReturnDetailsOpen}
                onOpenChange={setIsReturnDetailsOpen}
                productReturn={selectedReturn}
                customerName={customerFullName}
            />

            <BreadClientForm
                isOpen={isBreadDialogOpen}
                onOpenChange={setIsBreadDialogOpen}
                customer={customer}
                onSuccess={fetchCustomerData}
            />
        </div>
    );
}