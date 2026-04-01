'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Sale, Customer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, History, LayoutGrid, List, RefreshCw, FilterX, Printer, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { SalesHistoryCard } from '@/components/sales/SalesHistoryCard';
import { SalesHistoryTable } from '@/components/sales/SalesHistoryTable';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { CancelSaleDialog } from '@/components/sales/CancelSaleDialog';
import { PrintReceiptDialog } from '@/components/sales/PrintReceiptDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';

type SalesStatus = 'all' | 'paid' | 'partial' | 'unpaid';

export default function SalesHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<SalesStatus>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);

    const [sales, setSales] = useState<Sale[] | undefined>(undefined);
    const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map());
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const isLoading = sales === undefined;

    const fetchSalesAndCustomers = useCallback(async () => {
        if (!isMounted || !dateRange) return;
        setIsRefreshing(true);
        try {
            const [salesData, customersData] = await Promise.all([
                salesService.filterSales({
                    query: debouncedSearchQuery,
                    from: dateRange.from,
                    to: dateRange.to,
                    status: filterStatus
                }),
                customerService.getCustomers()
            ]);
            setSales(salesData);
            setCustomerMap(new Map(customersData.map(c => [c.uuid, c])));
        } catch (error: any) {
            toast.error("Impossible de charger l'historique des ventes.", { description: error.message });
            setSales([]);
        } finally {
            setIsRefreshing(false);
        }
    }, [isMounted, debouncedSearchQuery, dateRange, filterStatus]);

    useEffect(() => {
        fetchSalesAndCustomers();
    }, [fetchSalesAndCustomers]);

    const stats = useMemo(() => {
        if (!sales) return { total: 0, received: 0, debt: 0, count: 0 };
        return sales.reduce((acc, s) => ({
            total: acc.total + s.total,
            received: acc.received + s.amountPaid,
            debt: acc.debt + (s.total - s.amountPaid),
            count: acc.count + 1
        }), { total: 0, received: 0, debt: 0, count: 0 });
    }, [sales]);

    const handleViewDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailsOpen(true);
    };

    const handleCancelSale = (sale: Sale) => {
        setSelectedSale(sale);
        setIsCancelOpen(true);
    };

    const handlePrintSale = (sale: Sale) => {
        setSelectedSale(sale);
        setIsPrintOpen(true);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
    };

    const isFiltered = searchQuery !== '' || filterStatus !== 'all';
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Card key={i} className="rounded-3xl border-none animate-pulse h-48 bg-card" />)}
                </div>
            );
        }

        if (!sales || sales.length === 0) {
            return (
                <EmptyState
                    icon={History}
                    title="Aucune vente trouvée"
                    description={isFiltered ? "Essayez d'ajuster vos filtres ou de réinitialiser la recherche." : "Commencez par réaliser votre première vente."}
                >
                    {isFiltered && <Button variant="outline" onClick={resetFilters} className="rounded-xl"><FilterX className="mr-2 h-4 w-4" /> Effacer les filtres</Button>}
                </EmptyState>
            );
        }
        
        if (viewMode === 'list') {
            return (
                <SalesHistoryTable 
                    sales={sales} 
                    customerMap={customerMap} 
                    onViewDetails={handleViewDetails}
                    onPrint={handlePrintSale}
                    onCancel={handleCancelSale}
                />
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sales.map(s => {
                    const customer = s.customerUuid ? customerMap.get(s.customerUuid) : undefined;
                    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
                    return (
                        <SalesHistoryCard 
                            key={s.uuid} 
                            sale={s}
                            customerName={customerName}
                            onViewDetails={handleViewDetails}
                            onCancelSale={handleCancelSale}
                        />
                    )
                })}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
            <PageHeader
                title="Historique des Ventes"
                description="Consultez et gérez vos factures passées."
            >
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl border-none shadow-sm bg-card h-10 w-10"
                    onClick={fetchSalesAndCustomers}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                </Button>
            </PageHeader>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Période</CardTitle>
                        <History className="h-4 w-4 text-primary opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-black">{formatCurrency(stats.total)}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-bold">{stats.count} Factures</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Recettes</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-black text-emerald-500">{formatCurrency(stats.received)}</div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-destructive">Créances</CardTitle>
                        <Clock className="h-4 w-4 text-destructive opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-black text-destructive">{formatCurrency(stats.debt)}</div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Moyenne / Vente</CardTitle>
                        <AlertCircle className="h-4 w-4 text-primary opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-black">{formatCurrency(stats.count > 0 ? stats.total / stats.count : 0)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                        placeholder="Rechercher par N° Facture ou Nom Client..."
                        className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 min-w-[140px] font-medium">
                                {filterStatus === 'all' ? 'Tous les paiements' : filterStatus === 'paid' ? 'Payés' : filterStatus === 'partial' ? 'Partiels' : 'Impayés'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut de Paiement</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={filterStatus === 'all'} onCheckedChange={() => setFilterStatus('all')}>Tous</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterStatus === 'paid'} onCheckedChange={() => setFilterStatus('paid')}>Payés</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterStatus === 'partial'} onCheckedChange={() => setFilterStatus('partial')}>Partiels</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterStatus === 'unpaid'} onCheckedChange={() => setFilterStatus('unpaid')}>Impayés</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DateRangePicker date={dateRange} setDate={setDate} />

                    <div className="flex items-center gap-1 rounded-xl bg-card border-none shadow-sm p-1 h-11">
                        <Button 
                            variant={viewMode === 'grid' ? 'secondary': 'ghost'} 
                            size="icon" 
                            className="rounded-lg h-9 w-9"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4"/>
                        </Button>
                        <Button 
                            variant={viewMode === 'list' ? 'secondary': 'ghost'} 
                            size="icon" 
                            className="rounded-lg h-9 w-9"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="min-h-[450px] animate-in fade-in duration-500">
               {renderContent()}
            </div>

            <SaleDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                sale={selectedSale}
                customerName={selectedSale?.customerUuid ? (customerMap.get(selectedSale.customerUuid) ? `${customerMap.get(selectedSale.customerUuid)?.firstName} ${customerMap.get(selectedSale.customerUuid)?.lastName}` : 'Client Inconnu') : 'Client de passage'}
            />
            
            <CancelSaleDialog 
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                sale={selectedSale}
                onSuccess={fetchSalesAndCustomers}
            />

            <PrintReceiptDialog 
                isOpen={isPrintOpen}
                onOpenChange={setIsPrintOpen}
                sale={selectedSale}
            />
        </div>
    );
}
