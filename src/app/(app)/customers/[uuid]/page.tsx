
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, Printer, Loader2, RefreshCw, Wheat, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
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

const ITEMS_PER_PAGE = 10;

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const customerUuid = params.uuid as string;

    const [customer, setCustomer] = useState<Customer | undefined | null>(undefined);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [isBreadDialogOpen, setIsBreadDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

    // States for activity pagination
    const [activity, setActivity] = useState<any[]>([]);
    const [activityPage, setActivityPage] = useState(1);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);
    const [hasMoreActivity, setHasMoreActivity] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchCustomerData = useCallback(async () => {
        if (!customerUuid) {
            router.push('/customers');
            return;
        }
        setIsRefreshing(true);
        try {
            const cust = await customerService.getCustomerByUuid(customerUuid);
            setCustomer(cust);
            if (!cust) {
                toast.error("Client non trouvé.");
            }
        } catch (error: any) {
            toast.error("Impossible de charger les informations du client.", { description: error.message });
            setCustomer(null);
        } finally {
            setIsRefreshing(false);
        }
    }, [customerUuid, router]);
    
    useEffect(() => {
        fetchCustomerData();
    },[fetchCustomerData]);

    const handleSuccessfulPayment = useCallback(async () => {
        toast.success("Paiement enregistré. Mise à jour du statut du client...");
        await fetchCustomerData();
        // Also refresh activity list
        refreshActivity();
    }, [fetchCustomerData]);

    const refreshActivity = useCallback(() => {
        setActivity([]);
        setActivityPage(1);
        setHasMoreActivity(true);
        setIsLoadingActivity(true);
    }, []);

    useEffect(() => {
        if (!customerUuid || !hasMoreActivity) return;

        let isCancelled = false;
        setIsLoadingActivity(true);
        customerService.getCustomerActivity(customerUuid, activityPage, ITEMS_PER_PAGE)
            .then(newActivity => {
                if (!isCancelled) {
                    setActivity(prev => activityPage === 1 ? newActivity : [...prev, ...newActivity]);
                    if (newActivity.length < ITEMS_PER_PAGE) {
                        setHasMoreActivity(false);
                    }
                }
            })
            .catch((error) => toast.error("Impossible de charger l'activité du client.", { description: error.message }))
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingActivity(false);
                }
            });
        
        return () => { isCancelled = true; };
    }, [customerUuid, activityPage, hasMoreActivity]);

    const handleLoadMore = () => {
        if (!isLoadingActivity && hasMoreActivity) {
            setActivityPage(prev => prev + 1);
        }
    };

    const handleSaleClick = useCallback(async (sale: Sale) => {
        try {
            const saleWithItems = await salesService.getSaleByUuid(sale.uuid);
            if (!saleWithItems) {
                toast.error("Détails de la vente introuvables.");
                return;
            }
            setSelectedSale(saleWithItems);
            setIsSaleDetailsOpen(true);
        } catch (error: any) {
            toast.error("Impossible de charger les détails de la vente.", { description: error.message });
        }
    }, []);

    const handleReturnClick = useCallback(async (pr: ProductReturn) => {
        try {
            const returnWithItems = await returnService.getReturnByUuid(pr.uuid);
             if (!returnWithItems) {
                toast.error("Détails du retour introuvables.");
                return;
            }
            setSelectedReturn(returnWithItems);
            setIsReturnDetailsOpen(true);
        } catch (error: any) {
            toast.error("Impossible de charger les détails du retour.", { description: error.message });
        }
    }, []);

    if (customer === undefined) {
        return (
             <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
                <Skeleton className="h-8 w-48 rounded-xl" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-[500px] w-full rounded-3xl" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-60 w-full rounded-3xl" />
                         <Skeleton className="h-10 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return (
            <div className="p-4 sm:p-6 text-center">
                <h1 className="text-xl font-bold">Client non trouvé</h1>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/customers">Retour à la liste des clients</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="rounded-xl border-none shadow-sm bg-card h-10 w-10" asChild>
                    <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
                 </Button>
                 <PageHeader 
                    title={`${customer.firstName} ${customer.lastName}`}
                    description={`Identifiant Client: ${customer.uuid.substring(0,8)}...`}
                 />
                 <Button variant="outline" size="icon" onClick={fetchCustomerData} className="ml-auto rounded-xl border-none shadow-sm bg-card h-10 w-10">
                    <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                 </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2">
                     <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50">
                            <CardTitle className="text-xl font-black tracking-tight">Historique d'activité</CardTitle>
                            <CardDescription className="font-medium">
                                Liste chronologique des transactions. Cliquez sur une vente ou un retour pour les détails.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                           {isLoadingActivity && activity.length === 0 ? (
                                <div className="flex justify-center items-center h-60">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                            <CardFooter className="bg-muted/10 border-t">
                                <Button onClick={handleLoadMore} variant="ghost" className="w-full h-12 font-bold" disabled={isLoadingActivity}>
                                    {isLoadingActivity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Charger plus de transactions
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>

                <div className="space-y-6 sticky top-20">
                    <CustomerMetrics customer={customer} />
                    
                    {/* Bread Service Card (Integrated) */}
                    <Card className={cn(
                        "rounded-3xl border-none shadow-sm overflow-hidden",
                        customer.isBreadClient ? "bg-primary/5 border border-primary/10" : "bg-card"
                    )}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wheat className={cn("h-5 w-5", customer.isBreadClient ? "text-primary" : "text-muted-foreground/30")} />
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Service de Pain</CardTitle>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsBreadDialogOpen(true)}>
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                            {customer.isBreadClient ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Type: <span className="text-foreground font-bold">{customer.bread_type_recurrence === 'quotidien' ? 'Quotidien' : 'Jours spécifiques'}</span>
                                    </p>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Quantité: <span className="text-foreground font-bold">{customer.bread_type_recurrence === 'quotidien' ? customer.bread_quantite_defaut : 'Variable'} pcs</span>
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">Aucun abonnement actif.</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            variant="outline"
                            size="lg" 
                            className="w-full rounded-2xl h-14 font-black border-none bg-card shadow-sm gap-2"
                            onClick={() => setIsStatementDialogOpen(true)}
                        >
                            <Printer className="h-5 w-5" /> Relevé
                        </Button>
                        <Button 
                            size="lg" 
                            className="w-full rounded-2xl h-14 font-black shadow-lg shadow-primary/20 text-lg gap-2"
                            onClick={() => setIsPaymentDialogOpen(true)}
                            disabled={customer.outstandingBalance <= 0}
                        >
                            <HandCoins className="h-5 w-5" /> Payer
                        </Button>
                    </div>

                    <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Informations Contact</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Téléphone:</span> <span className="font-bold">{customer.phone || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Adresse:</span> <span className="font-bold text-right truncate max-w-[150px]">{customer.address || '-'}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
             {customer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    onPaymentSuccess={handleSuccessfulPayment}
                />
            )}

            <PrintStatementDialog
                isOpen={isStatementDialogOpen}
                onOpenChange={setIsStatementDialogOpen}
                customer={customer}
            />

            <SaleDetailsDialog
                isOpen={isSaleDetailsOpen}
                onOpenChange={setIsSaleDetailsOpen}
                sale={selectedSale}
            />
            <ReturnDetailsDialog
                isOpen={isReturnDetailsOpen}
                onOpenChange={setIsReturnDetailsOpen}
                productReturn={selectedReturn}
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
