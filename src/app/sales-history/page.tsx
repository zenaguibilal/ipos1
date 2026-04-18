'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { salesService } from '@/services/sales.service';
import { useDebounce } from '@/hooks/useDebounce';
import { useDateRange } from '@/hooks/useDateRange';
import type { Sale, Customer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
    Search, 
    History, 
    LayoutGrid, 
    List, 
    RefreshCw, 
    FilterX, 
    CheckCircle2, 
    Clock, 
    FileUp, 
    Banknote, 
    TrendingUp,
    ChevronRight,
    Sparkles,
    X,
    Trash2,
    Calendar
} from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { Badge } from '@/components/ui/badge';

type SalesStatus = 'all' | 'paid' | 'partial' | 'unpaid';

export default function SalesHistoryPage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.salesViewMode,
        setViewMode: state.actions.setSalesViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<SalesStatus>('all');
    // Moteur de période Elite - Par défaut sur les 30 derniers jours
    const { dateRange, setDate } = useDateRange(29);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [isBulkCancelConfirmOpen, setIsBulkCancelConfirmOpen] = useState(false);

    // Requête live des ventes avec filtrage intelligent (Période ou Archive complète)
    const sales = useLiveQuery(
        () => salesService.filterSales({
            query: debouncedSearchQuery,
            status: filterStatus,
            from: dateRange?.from,
            to: dateRange?.to
        }),
        [debouncedSearchQuery, filterStatus, dateRange]
    );

    const customers = useLiveQuery(() => db.customers.toArray());
    const customerMap = useMemo(() => new Map((customers || []).map(c => [c.uuid, c])), [customers]);

    const isLoading = sales === undefined || !isMounted;

    // Statistiques mises à jour en temps réel pour une précision Elite
    const stats = useMemo(() => {
        if (!sales) return { total: 0, received: 0, debt: 0, count: 0 };
        let totalCents = 0, receivedCents = 0, debtCents = 0;
        sales.forEach(s => {
            totalCents += Math.round(safeNumber(s.total) * 100);
            receivedCents += Math.round(safeNumber(s.amountPaid) * 100);
            debtCents += Math.round(safeNumber(s.remainingBalance) * 100);
        });
        return { total: totalCents / 100, received: receivedCents / 100, debt: debtCents / 100, count: sales.length };
    }, [sales]);

    // Graphique de flux financier pour la période sélectionnée
    const chartData = useMemo(() => {
        if (!sales || sales.length === 0) return [];
        const dataMap = new Map<string, { date: string, totalCents: number, receivedCents: number }>();
        
        // Tri chronologique pour la cohérence de la courbe
        const sortedSales = [...sales].sort((a,b) => safeToDate(a.createdAt!).getTime() - safeToDate(b.createdAt!).getTime());
        
        // Échantillonnage approprié pour éviter l'encombrement
        const itemsToGraph = (!dateRange?.from) ? sortedSales.slice(-50) : sortedSales;

        itemsToGraph.forEach(s => {
            const dateObj = safeToDate(s.createdAt!);
            const dayKey = format(dateObj, 'dd/MM');
            const current = dataMap.get(dayKey) || { date: dayKey, totalCents: 0, receivedCents: 0 };
            current.totalCents += Math.round(safeNumber(s.total) * 100);
            current.receivedCents += Math.round(safeNumber(s.amountPaid) * 100);
            dataMap.set(dayKey, current);
        });
        return Array.from(dataMap.values());
    }, [sales, dateRange]);

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
        if (selectedSales.size === sales.length) setSelectedSales(new Set());
        else setSelectedSales(new Set(sales.map(s => s.uuid)));
    };

    const handleBulkCancel = async () => {
        const uuids = Array.from(selectedSales);
        let successCount = 0;
        for (const uuid of uuids) {
            try { await salesService.processSaleCancellation(uuid); successCount++; } catch (e) {}
        }
        if (successCount > 0) toast.success(`${successCount} ventes annulées.`);
        setSelectedSales(new Set());
    };

    const handleExportCsv = () => {
        const salesToExport = selectedSales.size > 0 ? (sales?.filter(s => selectedSales.has(s.uuid)) || []) : (sales || []);
        if (salesToExport.length === 0) { toast.error("Aucune donnée."); return; }
        const csv = Papa.unparse(salesToExport.map(s => {
            const customer = s.customerUuid ? customerMap.get(s.customerUuid) : null;
            return {
                Date: s.createdAt ? new Date(s.createdAt).toLocaleString('fr-FR') : 'N/A',
                Facture: s.invoiceNumber,
                Client: customer ? `${customer.firstName} ${customer.lastName}` : 'Passage',
                Total: s.total,
                Payé: s.amountPaid,
                Statut: s.paymentStatus
            };
        }));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ventes-elite-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
        setDate(undefined); // Ouverture de l'archive complète
        toast.info("Filtres réinitialisés. Affichage de l'archive complète.");
    };

    const toggleFullHistory = () => {
        setDate(undefined);
        toast.success("Mode : Archive complète activé");
    };

    useKeyboardShortcuts([
        { key: 'F3', action: () => searchInputRef.current?.focus(), description: 'Rechercher', ignoreInputFocus: true },
        { key: 'h', ctrl: true, action: toggleFullHistory, description: 'Afficher tout l\'historique', ignoreInputFocus: true }
    ], 'Historique');

    const isFiltered = searchQuery !== '' || filterStatus !== 'all' || !!dateRange?.from;
    const isFullHistory = !dateRange?.from;
    
    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000 pb-20">
            <PageHeader title="Registre des Ventes Elite" description="Management souverain de l'historique et des flux financiers">
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <div className="flex items-center bg-card/40 backdrop-blur-md rounded-2xl border border-white/5 p-1 shadow-inner group">
                        <DateRangePicker date={dateRange} setDate={setDate} />
                        {isFullHistory ? (
                            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase px-3 py-1 animate-pulse">
                                Archive Complète
                            </Badge>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={toggleFullHistory} className="h-8 w-8 ml-1 rounded-lg hover:bg-primary/10 text-primary/40 hover:text-primary transition-all" title="Voir tout l'historique">
                                <History className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button variant="outline" onClick={handleExportCsv} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase border-primary/20 hover:bg-primary/5 transition-all">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/5 bg-card/40 hover:bg-primary/10 transition-all" onClick={() => window.location.reload()}>
                        <RefreshCw className="h-5 w-5 text-primary" />
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1 space-y-4">
                    <Card className="app-card rounded-lg bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden shadow-sm">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
                            <CardTitle className="text-[10px] font-black uppercase text-primary flex items-center gap-2 tracking-widest">
                                <Sparkles className="h-3.5 w-3.5" /> Bilan de la Période
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase">Chiffre d'Affaires Net</p>
                                <p className="text-3xl font-black tracking-tighter text-primary tabular-nums">{formatCurrency(stats.total)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground/60">{stats.count} factures identifiées</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 pt-2">
                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 shadow-inner group hover:bg-emerald-500/10 transition-all">
                                    <p className="text-[9px] font-semibold uppercase text-emerald-600 mb-1">Total Encaissé</p>
                                    <p className="font-bold text-xl text-emerald-600 tracking-tight tabular-nums">{formatCurrency(stats.received)}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 shadow-inner group hover:bg-destructive/10 transition-all">
                                    <p className="text-[9px] font-semibold uppercase text-destructive mb-1">Dettes en Souffrance</p>
                                    <p className="font-bold text-xl text-destructive tracking-tight tabular-nums">{formatCurrency(stats.debt)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="app-card rounded-lg bg-card/40 backdrop-blur-sm border-white/5 p-6 space-y-6 shadow-sm">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input ref={searchInputRef} placeholder="N° Facture, Client... [F3]" className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold text-lg" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/40 ml-1">Filtrer par Règlement</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between rounded-xl h-12 bg-black/20 border-white/5 text-xs font-semibold uppercase">
                                        <div className="flex items-center gap-3"><Banknote className="h-4 w-4 text-primary" />{filterStatus === 'all' ? 'Tous règlements' : filterStatus === 'paid' ? 'Payés' : filterStatus === 'partial' ? 'Partiels' : 'Dettes'}</div>
                                        <ChevronRight className="h-3 w-3 opacity-30" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[240px] rounded-2xl border-white/10 bg-card/95 backdrop-blur-md shadow-2xl">
                                    <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'all'} onCheckedChange={() => setFilterStatus('all')}>Toutes les factures</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'paid'} onCheckedChange={() => setFilterStatus('paid')}>Règlements complets</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'partial'} onCheckedChange={() => setFilterStatus('partial')}>Paiements partiels</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'unpaid'} onCheckedChange={() => setFilterStatus('unpaid')}>Dettes totales</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {isFiltered && (
                            <Button variant="ghost" onClick={resetFilters} className="w-full text-destructive hover:bg-destructive/10 text-[10px] font-bold uppercase rounded-xl h-12 gap-2">
                                <FilterX className="h-4 w-4" /> Réinitialiser
                            </Button>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-3 space-y-4">
                    <Card className="app-card rounded-lg bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-white/5 bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-sm"><TrendingUp className="h-6 w-6" /></div>
                                <div>
                                    <CardTitle className="text-xl font-bold tracking-tighter uppercase">Analyse des Flux</CardTitle>
                                    <p className="text-[10px] font-semibold uppercase text-primary/50 tracking-widest">
                                        {isFullHistory ? 'Performance Historique (Tendance)' : 'Variation journalière sur la période'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 p-1.5 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                                <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="h-72 p-4">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center opacity-20"><RefreshCw className="animate-spin h-10 w-10 text-primary" /></div>
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.2)" />
                                        <XAxis dataKey="date" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground) / 0.4)" dy={15}/>
                                        <YAxis fontSize={10} fontWeight="900" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground) / 0.4)" dx={-15} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}/>
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card) / 0.9)', backdropFilter: 'blur(16px)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)'}} itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }} formatter={(v: number, name: string) => [formatCurrency(v), name === 'total' ? 'Facturation' : 'Encaissements']}/>
                                        <Area type="monotone" dataKey="total" name="total" stroke="hsl(var(--chart-primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={5} isAnimationActive={false} />
                                        <Area type="monotone" dataKey="received" name="received" stroke="hsl(var(--chart-quaternary))" fillOpacity={0} strokeWidth={3} strokeDasharray="10 10" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex flex-col items-center justify-center opacity-20 uppercase text-[10px] font-black italic gap-4">
                                <Calendar className="h-12 w-12" />
                                Aucun flux détecté sur cette période
                            </div>}
                        </CardContent>
                    </Card>

                    <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg bg-card/40 animate-pulse border border-white/5" />)}
                            </div>
                        ) : sales && sales.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-4 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10 w-fit shadow-inner">
                                        <Checkbox id="select-all-sales" checked={selectedSales.size === sales.length && sales.length > 0} onCheckedChange={handleSelectAll} className="h-6 w-6 border-primary data-[state=checked]:bg-primary rounded-xl" />
                                        <label htmlFor="select-all-sales" className="text-[10px] font-black uppercase text-primary cursor-pointer tracking-widest">Tout sélectionner ({selectedSales.size} flux)</label>
                                    </div>
                                    {isFullHistory && (
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground/30 italic">
                                            <History className="h-3.5 w-3.5" /> L'archive complète est affichée
                                        </div>
                                    )}
                                </div>
                                
                                {viewMode === 'list' ? (
                                    <SalesHistoryTable sales={sales} customerMap={customerMap} selectedSales={selectedSales} onToggleSelection={handleToggleSelection} onViewDetails={(s) => { setSelectedSale(s); setIsDetailsOpen(true); }} onPrint={(s) => { setSelectedSale(s); setIsPrintOpen(true); }} onCancel={(s) => { setSelectedSale(s); setIsCancelOpen(true); }} />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sales.map(s => <SalesHistoryCard key={s.uuid} sale={s} customerName={s.customerUuid ? `${customerMap.get(s.customerUuid)?.firstName} ${customerMap.get(s.customerUuid)?.lastName}` : 'Client de passage'} isSelected={selectedSales.has(s.uuid)} onToggleSelection={() => handleToggleSelection(s.uuid)} onViewDetails={(sale) => { setSelectedSale(sale); setIsDetailsOpen(true); }} onCancelSale={(sale) => { setSelectedSale(sale); setIsCancelOpen(true); }} />)}
                                    </div>
                                )}
                            </div>
                        ) : <EmptyState icon={History} title="Archives Vides" description={isFiltered ? "Ajustez vos filtres de recherche." : "Validez votre première transaction Elite."} />}
                    </div>
                </div>
            </div>

            {selectedSales.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-4">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10"><div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black">{selectedSales.size}</div><span className="text-[10px] font-black uppercase text-muted-foreground">Flux Sélectionnés</span></div>
                        <Button variant="ghost" onClick={handleExportCsv} className="rounded-full h-12 px-6 font-black text-[10px] uppercase hover:bg-primary/10 hover:text-primary transition-all"><FileUp className="mr-2 h-4 w-4" /> Exporter</Button>
                        <Button variant="ghost" onClick={() => setIsBulkCancelConfirmOpen(true)} className="rounded-full h-12 px-6 font-black text-[10px] uppercase text-destructive hover:bg-destructive/10 transition-all"><Trash2 className="mr-2 h-4 w-4" /> Annuler Flux</Button>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedSales(new Set())} className="rounded-full h-12 w-12 hover:bg-white/5"><X className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}

            <SaleDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} sale={selectedSale} />
            <CancelSaleDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} sale={selectedSale} onSuccess={() => setSelectedSales(new Set())} />
            <PrintReceiptDialog isOpen={isPrintOpen} onOpenChange={setIsPrintOpen} sale={selectedSale} customerName={selectedSale?.customerUuid ? (customerMap.get(selectedSale.customerUuid) ? `${customerMap.get(selectedSale.customerUuid)?.firstName} ${customerMap.get(selectedSale.customerUuid)?.lastName}` : undefined) : 'Client de passage'} />
            <ConfirmAlertDialog isOpen={isBulkCancelConfirmOpen} onOpenChange={setIsBulkCancelConfirmOpen} title={`Annuler ${selectedSales.size} transactions ?`} description="Opération définitive : réintégration du stock et ajustement des soldes clients." onConfirm={handleBulkCancel} confirmText="Confirmer Annulation" />
        </div>
    );
}
