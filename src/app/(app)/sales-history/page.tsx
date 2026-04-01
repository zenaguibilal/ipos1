
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Sale, Customer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { 
    Search, 
    History, 
    LayoutGrid, 
    List, 
    RefreshCw, 
    FilterX, 
    Printer, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    FileUp, 
    Download, 
    PieChart, 
    Banknote, 
    Percent,
    TrendingUp,
    BarChart3,
    CheckSquare,
    Trash2,
    FileText
} from 'lucide-react';
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
import { cn, formatCurrency, safeToDate } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import Papa from 'papaparse';

type SalesStatus = 'all' | 'paid' | 'partial' | 'unpaid';

export default function SalesHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<SalesStatus>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
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
        if (!sales) return { total: 0, received: 0, debt: 0, count: 0, discount: 0 };
        return sales.reduce((acc, s) => ({
            total: acc.total + s.total,
            received: acc.received + s.amountPaid,
            debt: acc.debt + Math.max(0, s.total - s.amountPaid),
            count: acc.count + 1,
            discount: acc.discount + (s.discountAmount || 0)
        }), { total: 0, received: 0, debt: 0, count: 0, discount: 0 });
    }, [sales]);

    const chartData = useMemo(() => {
        if (!sales) return [];
        const dataMap = new Map<string, { date: string, total: number, received: number }>();
        
        sales.forEach(s => {
            const day = format(safeToDate(s.createdAt!), 'dd/MM');
            const current = dataMap.get(day) || { date: day, total: 0, received: 0 };
            current.total += s.total;
            current.received += s.amountPaid;
            dataMap.set(day, current);
        });

        return Array.from(dataMap.values()).reverse();
    }, [sales]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedSales(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (!sales) return;
        if (selectedSales.size === sales.length) {
            setSelectedSales(new Set());
        } else {
            setSelectedSales(new Set(sales.map(s => s.uuid)));
        }
    };

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

    const handleExportCsv = () => {
        const salesToExport = selectedSales.size > 0 
            ? (sales?.filter(s => selectedSales.has(s.uuid)) || [])
            : (sales || []);

        if (salesToExport.length === 0) {
            toast.error("Aucune vente à exporter.");
            return;
        }

        const csvData = salesToExport.map(s => {
            const customer = s.customerUuid ? customerMap.get(s.customerUuid) : null;
            return {
                Date: s.createdAt ? new Date(s.createdAt).toLocaleString('fr-FR') : 'N/A',
                Facture: s.invoiceNumber,
                Client: customer ? `${customer.firstName} ${customer.lastName}` : 'Passage',
                Total: s.total,
                'Montant Payé': s.amountPaid,
                'Reste à Payer': s.remainingBalance,
                Statut: s.paymentStatus === 'paid' ? 'Payé' : s.paymentStatus === 'partial' ? 'Partiel' : 'Impayé',
                Remise: s.discountAmount || 0,
                Articles: s.items.length
            };
        });

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ventes-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${salesToExport.length} vente(s) exportée(s).`);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
    };

    const isFiltered = searchQuery !== '' || filterStatus !== 'all';
    
    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto pb-24">
            <PageHeader
                title="Historique des Ventes"
                description="Contrôlez vos revenus et suivez vos créances clients avec précision."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCsv} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> 
                        {selectedSales.size > 0 ? `Exporter (${selectedSales.size})` : 'Exporter Tout'}
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-xl border-none shadow-sm bg-card h-10 w-10"
                        onClick={fetchSalesAndCustomers}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Stats & Filters */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-3">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Récapitulatif Financier</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Chiffre d'Affaires</p>
                                <p className="text-3xl font-black tracking-tighter text-primary">{formatCurrency(stats.total)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground">{stats.count} factures générées</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                    <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Recettes</p>
                                    <p className="font-black text-sm text-emerald-600">{formatCurrency(stats.received)}</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-destructive/5 border border-destructive/10">
                                    <p className="text-[9px] font-black uppercase text-destructive mb-1">Créances</p>
                                    <p className="font-black text-sm text-destructive">{formatCurrency(stats.debt)}</p>
                                </div>
                            </div>
                            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Percent className="h-3 w-3 text-amber-600" />
                                    <span className="text-[9px] font-black uppercase text-amber-600">Remises</span>
                                </div>
                                <span className="font-black text-sm text-amber-600">{formatCurrency(stats.discount)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtres de recherche</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input 
                                    placeholder="N° Facture, Client..."
                                    className="pl-10 h-11 rounded-xl bg-muted/30 border-none shadow-inner"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between rounded-xl h-11 bg-muted/30 border-none text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="h-4 w-4 text-primary" />
                                            {filterStatus === 'all' ? 'Tous les paiements' : filterStatus === 'paid' ? 'Payés' : filterStatus === 'partial' ? 'Partiels' : 'Impayés'}
                                        </div>
                                        <FilterX className={cn("h-3 w-3 opacity-0", isFiltered && "opacity-100")} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[240px] rounded-2xl border-none shadow-xl">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">Statut</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem checked={filterStatus === 'all'} onCheckedChange={() => setFilterStatus('all')}>Toutes les factures</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterStatus === 'paid'} onCheckedChange={() => setFilterStatus('paid')}>Entièrement payées</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterStatus === 'partial'} onCheckedChange={() => setFilterStatus('partial')}>Paiements partiels</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterStatus === 'unpaid'} onCheckedChange={() => setFilterStatus('unpaid')}>Dettes totales (0% payé)</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DateRangePicker date={dateRange} setDate={setDate} />
                            {isFiltered && (
                                <Button variant="ghost" onClick={resetFilters} className="w-full text-destructive hover:bg-destructive/10 text-xs font-bold rounded-xl">
                                    Réinitialiser les filtres
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Chart & Table */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Sales Trend Chart */}
                    <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Tendance des Ventes
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
                                <Button 
                                    variant={viewMode === 'grid' ? 'secondary': 'ghost'} 
                                    size="icon" 
                                    className="rounded-lg h-8 w-8"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid className="h-4 w-4"/>
                                </Button>
                                <Button 
                                    variant={viewMode === 'list' ? 'secondary': 'ghost'} 
                                    size="icon" 
                                    className="rounded-lg h-8 w-8"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4"/>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="h-48 pt-4">
                            {isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(v: number) => [formatCurrency(v), '']}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <div className="min-h-[450px] animate-in fade-in duration-500">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-3xl" />)}
                            </div>
                        ) : sales.length > 0 ? (
                            viewMode === 'list' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10 w-fit">
                                        <Checkbox 
                                            id="select-all" 
                                            checked={selectedSales.size === sales.length && sales.length > 0} 
                                            onCheckedChange={handleSelectAll}
                                            className="border-primary data-[state=checked]:bg-primary"
                                        />
                                        <label htmlFor="select-all" className="text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer">
                                            Tout sélectionner ({selectedSales.size})
                                        </label>
                                    </div>
                                    <SalesHistoryTable 
                                        sales={sales} 
                                        customerMap={customerMap} 
                                        selectedSales={selectedSales}
                                        onToggleSelection={handleToggleSelection}
                                        onViewDetails={handleViewDetails}
                                        onPrint={handlePrintSale}
                                        onCancel={handleCancelSale}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {sales.map(s => {
                                        const customer = s.customerUuid ? customerMap.get(s.customerUuid) : undefined;
                                        return (
                                            <SalesHistoryCard 
                                                key={s.uuid} 
                                                sale={s}
                                                customerName={customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
                                                isSelected={selectedSales.has(s.uuid)}
                                                onToggleSelection={() => handleToggleSelection(s.uuid)}
                                                onViewDetails={handleViewDetails}
                                                onCancelSale={handleCancelSale}
                                            />
                                        )
                                    })}
                                </div>
                            )
                        ) : (
                            <EmptyState
                                icon={History}
                                title="Aucune vente trouvée"
                                description={isFiltered ? "Essayez d'ajuster vos filtres ou de réinitialiser la recherche." : "Commencez par réaliser votre première vente."}
                            >
                                {isFiltered && <Button variant="outline" onClick={resetFilters} className="rounded-xl"><FilterX className="mr-2 h-4 w-4" /> Effacer les filtres</Button>}
                            </EmptyState>
                        )}
                    </div>
                </div>
            </div>

            {/* Selection Action Bar */}
            {selectedSales.size > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-card/80 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
                        <div className="flex items-center gap-2 pr-6 border-r border-border/50">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black">
                                {selectedSales.size}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sélectionnées</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={handleExportCsv} className="rounded-full h-10 font-bold hover:bg-primary/10 hover:text-primary">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-full h-10 font-bold text-destructive hover:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Annuler
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSales(new Set())} className="rounded-full h-10 w-10">
                                <FilterX className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
