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
    FileUp, 
    Banknote, 
    TrendingUp,
    X,
    ChevronRight,
    Sparkles,
    Landmark
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Papa from 'papaparse';
import { useAppStore } from '@/stores/appStore';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

type SalesStatus = 'all' | 'paid' | 'partial' | 'unpaid';

export default function SalesHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<SalesStatus>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const profile = useAppStore(state => state.companyProfile);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [isBulkCancelConfirmOpen, setIsBulkCancelConfirmOpen] = useState(false);

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
            toast.error("Impossible de charger l'historique des ventes.");
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
        const sortedSales = [...sales].sort((a,b) => safeToDate(a.createdAt!).getTime() - safeToDate(b.createdAt!).getTime());
        
        sortedSales.forEach(s => {
            const day = format(safeToDate(s.createdAt!), 'dd/MM');
            const current = dataMap.get(day) || { date: day, total: 0, received: 0 };
            current.total += s.total;
            current.received += s.amountPaid;
            dataMap.set(day, current);
        });

        return Array.from(dataMap.values());
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

    const handleBulkCancel = async () => {
        const uuids = Array.from(selectedSales);
        let successCount = 0;
        let failCount = 0;

        for (const uuid of uuids) {
            try {
                await salesService.processSaleCancellation(uuid);
                successCount++;
            } catch (e) {
                failCount++;
            }
        }

        if (successCount > 0) toast.success(`${successCount} vente(s) annulée(s).`);
        if (failCount > 0) toast.error(`${failCount} échec(s) d'annulation.`);
        
        setSelectedSales(new Set());
        fetchSalesAndCustomers();
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

    const handlePrintSummary = () => {
        if (!sales || sales.length === 0) {
            toast.error("Aucune donnée à imprimer.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateStr = dateRange?.from ? `${format(dateRange.from, 'dd/MM/yyyy')} au ${format(dateRange.to!, 'dd/MM/yyyy')}` : 'Toutes les dates';

        const html = `
            <html>
                <head>
                    <title>Rapport de Ventes - iPOS Luxury</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
                        header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: -0.05em; }
                        .meta { text-align: right; font-size: 12px; color: #666; }
                        .summary-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                        .stat-card { border: 1px solid #eee; padding: 15px; border-radius: 12px; text-align: center; }
                        .stat-card h4 { margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.1em; }
                        .stat-card p { margin: 0; font-size: 18px; font-weight: 900; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                        th, td { border-bottom: 1px solid #eee; padding: 12px 8px; text-align: left; }
                        th { background-color: #f9f9f9; font-weight: 900; text-transform: uppercase; color: #666; }
                        .amount { text-align: right; font-family: monospace; font-size: 12px; font-weight: 700; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <header>
                        <div>
                            <h1>${profile?.companyName || 'Mon Commerce Luxury'}</h1>
                            <p>${profile?.address || ''} | ${profile?.phone || ''}</p>
                        </div>
                        <div class="meta">
                            <p>RAPPORT DE VENTES ELITE</p>
                            <p>Période: ${dateStr}</p>
                            <p>Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                    </header>

                    <div class="summary-grid">
                        <div class="stat-card"><h4>Chiffre d'Affaires</h4><p>${formatCurrency(stats.total)}</p></div>
                        <div class="stat-card"><h4>Recettes Réelles</h4><p style="color: #10b981">${formatCurrency(stats.received)}</p></div>
                        <div class="stat-card"><h4>Créances</h4><p style="color: #ef4444">${formatCurrency(stats.debt)}</p></div>
                        <div class="stat-card"><h4>Remises</h4><p>${formatCurrency(stats.discount)}</p></div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>N° Facture</th>
                                <th>Client</th>
                                <th>Statut</th>
                                <th style="text-align: right;">Total</th>
                                <th style="text-align: right;">Payé</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sales.map(s => {
                                const customer = s.customerUuid ? customerMap.get(s.customerUuid) : null;
                                return `
                                    <tr>
                                        <td>${format(safeToDate(s.createdAt!), 'dd/MM/yyyy HH:mm')}</td>
                                        <td><b>${s.invoiceNumber}</b></td>
                                        <td>${customer ? `${customer.firstName} ${customer.lastName}` : 'Passage'}</td>
                                        <td>${s.paymentStatus.toUpperCase()}</td>
                                        <td class="amount">${s.total.toFixed(1)}</td>
                                        <td class="amount">${s.amountPaid.toFixed(1)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
    };

    const isFiltered = searchQuery !== '' || filterStatus !== 'all';
    
    return (
        <div className="p-6 sm:p-10 space-y-10 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader
                title="Registre des Ventes"
                description="Suivi souverain des flux de trésorerie et gestion des créances"
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" onClick={handlePrintSummary} className="flex-1 sm:flex-none h-12 rounded-2xl font-black text-xs uppercase tracking-widest border-primary/20 hover:bg-primary/5 transition-all">
                        <Printer className="mr-2 h-4 w-4 text-primary" /> Rapport
                    </Button>
                    <Button variant="outline" onClick={handleExportCsv} className="flex-1 sm:flex-none h-12 rounded-2xl font-black text-xs uppercase tracking-widest border-primary/20 hover:bg-primary/5 transition-all">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-12 w-12 rounded-2xl border-white/5 bg-card/40 hover:bg-primary/10 transition-all group"
                        onClick={fetchSalesAndCustomers}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-5 w-5 text-primary transition-all duration-1000", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <Card className="luxury-card rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                                <Sparkles className="h-3 w-3" /> État des Lieux
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Revenue Global</p>
                                <p className="text-4xl font-black tracking-tighter text-primary">{formatCurrency(stats.total)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground/60">{stats.count} transactions validées</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 group hover:bg-emerald-500/10 transition-all duration-500 shadow-inner">
                                    <p className="text-[9px] font-black uppercase text-emerald-600 mb-1 flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3" /> Recettes Réelles
                                    </p>
                                    <p className="font-black text-xl text-emerald-600 tracking-tight">{formatCurrency(stats.received)}</p>
                                </div>
                                <div className="p-5 rounded-3xl bg-destructive/5 border border-destructive/10 group hover:bg-destructive/10 transition-all duration-500 shadow-inner">
                                    <p className="text-[9px] font-black uppercase text-destructive mb-1 flex items-center gap-2">
                                        <Landmark className="h-3 w-3" /> Créances Clients
                                    </p>
                                    <p className="font-black text-xl text-destructive tracking-tight">{formatCurrency(stats.debt)}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex justify-between items-center group hover:bg-amber-500/10 transition-all duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600"><RefreshCw className="h-3.5 w-3.5" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70">Remises Accordées</span>
                                </div>
                                <span className="font-black text-sm text-amber-600">{formatCurrency(stats.discount)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="luxury-card rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">Options de Tri</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="N° Facture, Client..."
                                    className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="space-y-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between rounded-xl h-12 bg-black/20 border-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <Banknote className="h-4 w-4 text-primary" />
                                                {filterStatus === 'all' ? 'Tous les paiements' : filterStatus === 'paid' ? 'Payés' : filterStatus === 'partial' ? 'Partiels' : 'Impayés'}
                                            </div>
                                            <ChevronRight className="h-3 w-3 opacity-30" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[240px] rounded-2xl border-none shadow-2xl bg-card">
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground p-4">Statut de Règlement</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="opacity-10" />
                                        <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'all'} onCheckedChange={() => setFilterStatus('all')}>Toutes les factures</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'paid'} onCheckedChange={() => setFilterStatus('paid')}>Entièrement payées</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'partial'} onCheckedChange={() => setFilterStatus('partial')}>Paiements partiels</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'unpaid'} onCheckedChange={() => setFilterStatus('unpaid')}>Dettes totales (0% payé)</DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="p-1 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                                    <DateRangePicker date={dateRange} setDate={setDate} />
                                </div>
                            </div>

                            {isFiltered && (
                                <Button variant="ghost" onClick={resetFilters} className="w-full text-destructive hover:bg-destructive/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl h-12">
                                    Réinitialiser <FilterX className="ml-2 h-3.5 w-3.5" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3 space-y-8">
                    <Card className="luxury-card rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-white/5 bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20 transition-transform duration-700 hover:rotate-12">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tighter">Flux Chronologique</CardTitle>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Recettes vs Crédit</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 p-1.5 bg-black/20 rounded-[1.5rem] border border-white/5 shadow-inner">
                                <Button 
                                    variant={viewMode === 'grid' ? 'secondary': 'ghost'} 
                                    size="icon" 
                                    className="rounded-xl h-9 w-9"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid className="h-4 w-4"/>
                                </Button>
                                <Button 
                                    variant={viewMode === 'list' ? 'secondary': 'ghost'} 
                                    size="icon" 
                                    className="rounded-xl h-9 w-9"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4"/>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="h-64 p-8">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center opacity-20"><RefreshCw className="animate-spin h-10 w-10 text-primary" /></div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.2)" />
                                        <XAxis 
                                            dataKey="date" 
                                            fontSize={10} 
                                            fontWeight="900" 
                                            tickLine={false} 
                                            axisLine={false} 
                                            stroke="hsl(var(--muted-foreground) / 0.4)"
                                            dy={15}
                                        />
                                        <YAxis 
                                            fontSize={10} 
                                            fontWeight="900" 
                                            tickLine={false} 
                                            axisLine={false} 
                                            stroke="hsl(var(--muted-foreground) / 0.4)"
                                            dx={-15}
                                            tickFormatter={(v) => `${v / 1000}k`}
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card) / 0.9)',
                                                backdropFilter: 'blur(16px)',
                                                borderColor: 'hsl(var(--border) / 0.5)',
                                                borderRadius: '1.5rem',
                                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
                                                border: '1px solid rgba(255,255,255,0.05)'
                                            }}
                                            itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                            formatter={(v: number, name: string) => [formatCurrency(v), name === 'total' ? 'Facturé' : 'Recueilli']}
                                        />
                                        <Area type="monotone" dataKey="total" name="total" stroke="hsl(var(--chart-primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={5} />
                                        <Area type="monotone" dataKey="received" name="received" stroke="hsl(var(--chart-quaternary))" fillOpacity={1} fill="url(#colorReceived)" strokeWidth={3} strokeDasharray="10 10" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[...Array(6)].map((_, i) => <Skeleton key={`skel-sales-${i}`} className="h-56 w-full rounded-[2.5rem] bg-card/40 animate-pulse" />)}
                            </div>
                        ) : sales.length > 0 ? (
                            viewMode === 'list' ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-2xl border border-primary/20 w-fit backdrop-blur-md shadow-inner">
                                        <Checkbox 
                                            id="select-all-sales" 
                                            checked={selectedSales.size === sales.length && sales.length > 0} 
                                            onCheckedChange={handleSelectAll}
                                            className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                                        />
                                        <label htmlFor="select-all-sales" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary cursor-pointer select-none">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                title="Le Grand Livre est vide"
                                description={isFiltered ? "Ajustez vos filtres pour dénicher les transactions." : "Lancez votre première vente Premium dès maintenant."}
                            >
                                {isFiltered && <Button variant="outline" onClick={resetFilters} className="rounded-2xl h-12 font-bold px-8 border-primary/20 hover:bg-primary/5">Effacer les filtres</Button>}
                            </EmptyState>
                        )}
                    </div>
                </div>
            </div>

            {selectedSales.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-3xl border-2 border-primary/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-10">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                                {selectedSales.size}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Commandes Elite</span>
                                <span className="text-xs font-black text-primary">{formatCurrency(stats.total)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={handleExportCsv} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter (.csv)
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsBulkCancelConfirmOpen(true)} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all">
                                <Trash2 className="mr-2 h-4 w-4" /> Annuler Flux
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSales(new Set())} className="rounded-full h-12 w-12 hover:bg-white/5 transition-all">
                                <X className="h-4 w-4" />
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

            <ConfirmAlertDialog
                isOpen={isBulkCancelConfirmOpen}
                onOpenChange={setIsBulkCancelConfirmOpen}
                title={`Révocation de ${selectedSales.size} flux de ventes ?`}
                description={
                    <div className="space-y-4">
                        <p>Cette opération est <b>définitive</b>. Les conséquences suivantes seront appliquées :</p>
                        <ul className="list-disc list-inside text-xs space-y-1 opacity-70 ml-2">
                            <li>Réintégration totale des articles au stock</li>
                            <li>Annulation des écritures comptables</li>
                            <li>Recalcul automatique des soldes clients (créances)</li>
                        </ul>
                    </div>
                }
                onConfirm={handleBulkCancel}
                confirmText="Confirmer la Révocation"
            />
        </div>
    );
}
