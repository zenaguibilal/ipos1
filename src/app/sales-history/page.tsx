'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { salesService } from '@/services/sales.service';
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
    ChevronRight,
    Sparkles,
    Landmark,
    X,
    Trash2
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
import { cn, formatCurrency, safeToDate, safeNumber } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Papa from 'papaparse';
import { useAppStore } from '@/stores/appStore';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';

type SalesStatus = 'all' | 'paid' | 'partial' | 'unpaid';

/**
 * صفحة سجل المبيعات Elite.
 * نظام مراقبة فائق للدقة المحاسبية والتدفقات النقدية.
 */
export default function SalesHistoryPage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.salesViewMode,
        setViewMode: state.actions.setSalesViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<SalesStatus>('all');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const profile = useAppStore(state => state.companyProfile);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [isBulkCancelConfirmOpen, setIsBulkCancelConfirmOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // مراقبة حية للمبيعات المفلترة لضمان المزامنة الفورية مع محرك البحث المطور
    const sales = useLiveQuery(
        () => salesService.filterSales({
            query: debouncedSearchQuery,
            from: dateRange?.from,
            to: dateRange?.to,
            status: filterStatus
        }),
        [debouncedSearchQuery, dateRange, filterStatus]
    );

    const customers = useLiveQuery(() => db.customers.toArray());
    const customerMap = useMemo(() => {
        return new Map((customers || []).map(c => [c.uuid, c]));
    }, [customers]);

    const isLoading = sales === undefined || !isMounted;

    /**
     * محرك حساب الإحصائيات الفائق - يستخدم السنتيمترات لضمان الدقة المطلقة.
     */
    const stats = useMemo(() => {
        if (!sales) return { total: 0, received: 0, debt: 0, count: 0, discount: 0 };
        
        let totalCents = 0;
        let receivedCents = 0;
        let debtCents = 0;
        let discountCents = 0;

        sales.forEach(s => {
            totalCents += Math.round(safeNumber(s.total) * 100);
            receivedCents += Math.round(safeNumber(s.amountPaid) * 100);
            debtCents += Math.round(safeNumber(s.remainingBalance) * 100);
            discountCents += Math.round(safeNumber(s.discountAmount) * 100);
        });

        return {
            total: totalCents / 100,
            received: receivedCents / 100,
            debt: debtCents / 100,
            count: sales.length,
            discount: discountCents / 100
        };
    }, [sales]);

    /**
     * معالجة بيانات الرسم البياني بدقة يومية
     */
    const chartData = useMemo(() => {
        if (!sales) return [];
        const dataMap = new Map<string, { date: string, totalCents: number, receivedCents: number }>();
        
        // ترتيب المبيعات زمنياً للرسم
        const sortedSales = [...sales].sort((a,b) => safeToDate(a.createdAt!).getTime() - safeToDate(b.createdAt!).getTime());
        
        sortedSales.forEach(s => {
            const day = format(safeToDate(s.createdAt!), 'dd/MM');
            const current = dataMap.get(day) || { date: day, totalCents: 0, receivedCents: 0 };
            current.totalCents += Math.round(safeNumber(s.total) * 100);
            current.receivedCents += Math.round(safeNumber(s.amountPaid) * 100);
            dataMap.set(day, current);
        });

        return Array.from(dataMap.values()).map(d => ({
            date: d.date,
            total: d.totalCents / 100,
            received: d.receivedCents / 100
        }));
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

    const handleBulkCancel = async () => {
        const uuids = Array.from(selectedSales);
        let successCount = 0;
        for (const uuid of uuids) {
            try {
                await salesService.processSaleCancellation(uuid);
                successCount++;
            } catch (e) {}
        }
        if (successCount > 0) {
            toast.success(`${successCount} vente(s) annulée(s) avec succès.`);
        }
        setSelectedSales(new Set());
    };

    const handleExportCsv = () => {
        const salesToExport = selectedSales.size > 0 
            ? (sales?.filter(s => selectedSales.has(s.uuid)) || [])
            : (sales || []);

        if (salesToExport.length === 0) {
            toast.error("Aucune donnée à exporter.");
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
                Statut: s.paymentStatus
            };
        });

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ipos-ventes-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Exportation Elite terminée.");
    };

    const handlePrintSummary = () => {
        if (!sales || sales.length === 0) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Rapport de Ventes - iPOS Zen</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: -0.05em; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                        th, td { border-bottom: 1px solid #eee; padding: 12px 8px; text-align: left; }
                        th { background-color: #f9f9f9; font-weight: 900; text-transform: uppercase; font-size: 10px; }
                        .amount { text-align: right; font-family: monospace; font-size: 12px; font-weight: 700; }
                        .total-row { background-color: #000; color: #fff; font-weight: 900; }
                    </style>
                </head>
                <body>
                    <header>
                        <div><h1>${profile?.companyName || 'iPOS Zen'}</h1><p>${profile?.address || ''}</p></div>
                        <div style="text-align: right"><p>RAPPORT DE VENTES ELITE</p><p>${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                    </header>
                    <table>
                        <thead>
                            <tr><th>Date</th><th>N° Facture</th><th>Client</th><th>Statut</th><th style="text-align: right;">Total</th></tr>
                        </thead>
                        <tbody>
                            ${sales.map(s => `
                                <tr>
                                    <td>${format(safeToDate(s.createdAt!), 'dd/MM/yy')}</td>
                                    <td><b>${s.invoiceNumber}</b></td>
                                    <td>${s.customerUuid ? (customerMap.get(s.customerUuid)?.firstName || 'Client') : 'Passage'}</td>
                                    <td>${s.paymentStatus.toUpperCase()}</td>
                                    <td class="amount">${s.total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colSpan="4" style="text-align: right;">TOTAL GLOBAL PÉRIODE</td>
                                <td class="amount">${stats.total.toFixed(2)} DA</td>
                            </tr>
                        </tfoot>
                    </table>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
    };

    useKeyboardShortcuts([
        {
            key: 'F3',
            action: () => searchInputRef.current?.focus(),
            description: 'Rechercher une facture',
            ignoreInputFocus: true
        }
    ], 'Historique');

    const isFiltered = searchQuery !== '' || filterStatus !== 'all';
    
    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000 pb-20">
            <PageHeader
                title="Registre des Ventes Elite"
                description="Suivi souverain des flux de trésorerie و المركز المالي"
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" onClick={handlePrintSummary} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide border-primary/20 hover:bg-primary/5 transition-all">
                        <Printer className="mr-2 h-4 w-4 text-primary" /> Rapport
                    </Button>
                    <Button variant="outline" onClick={handleExportCsv} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide border-primary/20 hover:bg-primary/5 transition-all">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-12 w-12 rounded-2xl border-white/5 bg-card/40 hover:bg-primary/10 transition-all group"
                        onClick={() => setIsRefreshing(true)}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-5 w-5 text-primary transition-all duration-1000", (isLoading || isRefreshing) && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                {/* Stats Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="app-card rounded-lg bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden shadow-sm">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
                            <CardTitle className="text-[10px] font-semibold uppercase text-primary flex items-center gap-2 tracking-widest">
                                <Sparkles className="h-3 w-3" /> Bilan des Flux
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wide">Volume d'Affaires</p>
                                <p className="text-2xl font-black tracking-tighter text-primary tabular-nums">{formatCurrency(stats.total)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground/60">{stats.count} opérations validées</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 group hover:bg-emerald-500/10 transition-all duration-500 shadow-inner">
                                    <p className="text-[9px] font-semibold uppercase text-emerald-600 mb-1 flex items-center gap-2 tracking-wide">
                                        <CheckCircle2 className="h-3 w-3" /> Recettes Réelles
                                    </p>
                                    <p className="font-bold text-lg text-emerald-600 tracking-tight tabular-nums">{formatCurrency(stats.received)}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 group hover:bg-destructive/10 transition-all duration-500 shadow-inner">
                                    <p className="text-[9px] font-semibold uppercase text-destructive mb-1 flex items-center gap-2 tracking-wide">
                                        <Landmark className="h-3 w-3" /> Créances Clients
                                    </p>
                                    <p className="font-bold text-lg text-destructive tracking-tight tabular-nums">{formatCurrency(stats.debt)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="app-card rounded-lg bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden shadow-sm">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-[10px] font-semibold uppercase text-muted-foreground opacity-40 tracking-widest">Filtrage Précis</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    ref={searchInputRef}
                                    placeholder="Facture, Client [F3]..."
                                    className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="space-y-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between rounded-xl h-12 bg-black/20 border-white/5 text-xs font-semibold uppercase tracking-wide hover:bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <Banknote className="h-4 w-4 text-primary" />
                                                {filterStatus === 'all' ? 'Toutes factures' : filterStatus === 'paid' ? 'Payées' : filterStatus === 'partial' ? 'Partiels' : 'Dettes'}
                                            </div>
                                            <ChevronRight className="h-3 w-3 opacity-30" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[240px] rounded-2xl border-none shadow-sm bg-card">
                                        <DropdownMenuLabel className="text-[10px] font-semibold uppercase text-muted-foreground p-4 tracking-widest">Statut de Règlement</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="opacity-10" />
                                        <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'all'} onCheckedChange={() => setFilterStatus('all')}>Toutes les factures</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'paid'} onCheckedChange={() => setFilterStatus('paid')}>Entièrement payées</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'partial'} onCheckedChange={() => setFilterStatus('partial')}>Paiements partiels</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'unpaid'} onCheckedChange={() => setFilterStatus('unpaid')}>Impayés (Dette)</DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="p-1 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                                    <DateRangePicker date={dateRange} setDate={setDate} />
                                </div>
                            </div>

                            {isFiltered && (
                                <Button variant="ghost" onClick={resetFilters} className="w-full text-destructive hover:bg-destructive/10 text-[10px] font-semibold uppercase rounded-xl h-12 tracking-wide">
                                    Effacer Filtres <FilterX className="ml-2 h-3.5 w-3.5" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="app-card rounded-lg bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-white/5 bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold tracking-tighter uppercase">Courbe de Trésorerie</CardTitle>
                                    <p className="text-[10px] font-semibold uppercase text-primary/50 tracking-widest">Flux Chronologiques</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 p-1.5 bg-black/20 rounded-lg border border-white/5 shadow-inner">
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
                        <CardContent className="h-64 p-4">
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
                                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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
                                            formatter={(v: number, name: string) => [formatCurrency(v), name === 'total' ? 'Facturation' : 'Encaissements']}
                                        />
                                        <Area type="monotone" dataKey="total" name="total" stroke="hsl(var(--chart-primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={5} isAnimationActive={false} />
                                        <Area type="monotone" dataKey="received" name="received" stroke="hsl(var(--chart-quaternary))" fillOpacity={0} strokeWidth={3} strokeDasharray="10 10" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[...Array(6)].map((_, i) => <Skeleton key={`skel-sales-${i}`} className="h-56 w-full rounded-lg bg-card/40 animate-pulse border border-white/5" />)}
                            </div>
                        ) : sales && sales.length > 0 ? (
                            viewMode === 'list' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10 w-fit shadow-inner">
                                        <Checkbox 
                                            id="select-all-sales" 
                                            checked={selectedSales.size === sales.length && sales.length > 0} 
                                            onCheckedChange={handleSelectAll}
                                            className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                                        />
                                        <label htmlFor="select-all-sales" className="text-[10px] font-black uppercase text-primary cursor-pointer select-none tracking-widest">
                                            Tout sélectionner ({selectedSales.size} flux)
                                        </label>
                                    </div>
                                    <SalesHistoryTable 
                                        sales={sales} 
                                        customerMap={customerMap} 
                                        selectedSales={selectedSales}
                                        onToggleSelection={handleToggleSelection}
                                        onViewDetails={(s) => { setSelectedSale(s); setIsDetailsOpen(true); }}
                                        onPrint={(s) => { setSelectedSale(s); setIsPrintOpen(true); }}
                                        onCancel={(s) => { setSelectedSale(s); setIsCancelOpen(true); }}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {sales.map(s => {
                                        const customer = s.customerUuid ? customerMap.get(s.customerUuid) : undefined;
                                        return (
                                            <SalesHistoryCard 
                                                key={s.uuid} 
                                                sale={s}
                                                customerName={customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
                                                isSelected={selectedSales.has(s.uuid)}
                                                onToggleSelection={() => handleToggleSelection(s.uuid)}
                                                onViewDetails={(sale) => { setSelectedSale(sale); setIsDetailsOpen(true); }}
                                                onCancelSale={(sale) => { setSelectedSale(sale); setIsCancelOpen(true); }}
                                            />
                                        )
                                    })}
                                </div>
                            )
                        ) : (
                            <EmptyState
                                icon={History}
                                title="Aucune vente identifiée"
                                description={isFiltered ? "Ajustez vos critères de recherche pour trouver le flux correspondant." : "Enregistrez votre première vente pour démarrer l'historique Elite."}
                            >
                                {isFiltered && <Button variant="outline" onClick={resetFilters} className="rounded-2xl h-12 font-bold px-8 border-primary/20 hover:bg-primary/5 transition-all">Réinitialiser les filtres</Button>}
                            </EmptyState>
                        )}
                    </div>
                </div>
            </div>

            {selectedSales.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-4">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black shadow-lg">
                                {selectedSales.size}
                            </div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Flux Sélectionnés</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={handleExportCsv} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter (.csv)
                            </Button>
                            <Button variant="ghost" onClick={() => setIsBulkCancelConfirmOpen(true)} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all">
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
            />
            
            <CancelSaleDialog 
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                sale={selectedSale}
                onSuccess={() => setSelectedSales(new Set())}
            />

            <PrintReceiptDialog 
                isOpen={isPrintOpen}
                onOpenChange={setIsPrintOpen}
                sale={selectedSale}
                customerName={selectedSale?.customerUuid ? (customerMap.get(selectedSale.customerUuid) ? `${customerMap.get(selectedSale.customerUuid)?.firstName} ${customerMap.get(selectedSale.customerUuid)?.lastName}` : undefined) : 'Client de passage'}
            />

            <ConfirmAlertDialog
                isOpen={isBulkCancelConfirmOpen}
                onOpenChange={setIsBulkCancelConfirmOpen}
                title={`Annuler ${selectedSales.size} transactions de vente ?`}
                description={
                    <div className="space-y-4">
                        <p className="font-medium text-foreground">Cette opération est <b>définitive</b>. Les conséquences sur le système Elite sont :</p>
                        <div className="grid grid-cols-1 gap-2">
                            {['Réintégration automatique au stock', 'Restauration des soldes clients (Annulation dette)', 'Purger les سجلات التاريخية'].map((t, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-white/5">
                                    <CheckCircle2 className="h-3 w-3 text-destructive opacity-40" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight opacity-60">{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                }
                onConfirm={handleBulkCancel}
                confirmText="Confirmer Annulation Groupée"
            />
        </div>
    );
}
