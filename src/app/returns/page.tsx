'use client';

import { useState, useEffect, useCallback } from 'react';
import { returnService } from '@/services/return.service';
import { customerService } from '@/services/customer.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductReturn, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Search, 
    Plus, 
    Undo2, 
    LayoutGrid, 
    List, 
    FileUp, 
    RefreshCw, 
    FilterX, 
    Trash2, 
    X
} from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Skeleton } from '@/components/ui/skeleton';
import { ReturnHistoryCard } from '@/components/returns/ReturnHistoryCard';
import { ReturnTable } from '@/components/returns/ReturnTable';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import { CancelReturnDialog } from '@/components/returns/CancelReturnDialog';
import { ReturnStats } from '@/components/returns/ReturnStats';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import Papa from 'papaparse';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

export default function ReturnsPage() {
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.returnsViewMode,
        setViewMode: state.actions.setReturnsViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [selectedReturns, setSelectedReturns] = useState<Set<string>>(new Set());
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isBulkCancelConfirmOpen, setIsBulkCancelConfirmOpen] = useState(false);

    const [returns, setReturns] = useState<ProductReturn[] | undefined>(undefined);
    const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map());
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const isLoading = returns === undefined;
    
    const fetchReturnsAndCustomers = useCallback(async () => {
        if (!isMounted || !dateRange) return;
        setIsRefreshing(true);
        try {
            const [returnsData, customersData] = await Promise.all([
                returnService.filterReturns({
                    query: debouncedSearchQuery,
                    from: dateRange.from,
                    to: dateRange.to
                }),
                customerService.getCustomers()
            ]);
            setReturns(returnsData);
            setCustomerMap(new Map(customersData.map(c => [c.uuid, c])));
        } catch (error: any) {
            toast.error("Impossible de charger l'historique des retours.");
            setReturns([]);
        } finally {
            setIsRefreshing(false);
        }
    }, [isMounted, debouncedSearchQuery, dateRange]);

    useEffect(() => {
        fetchReturnsAndCustomers();
    }, [fetchReturnsAndCustomers]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedReturns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleBulkCancel = async () => {
        const uuids = Array.from(selectedReturns);
        let successCount = 0;
        let failCount = 0;

        for (const uuid of uuids) {
            try {
                await returnService.processReturnCancellation(uuid);
                successCount++;
            } catch (e) {
                failCount++;
            }
        }

        if (successCount > 0) toast.success(`${successCount} retour(s) annulé(s).`);
        if (failCount > 0) toast.error(`${failCount} échec(s) d'annulation.`);
        
        setSelectedReturns(new Set());
        fetchReturnsAndCustomers();
    };

    const handleExportCsv = () => {
        const returnsToExport = selectedReturns.size > 0 
            ? (returns?.filter(r => selectedReturns.has(r.uuid)) || [])
            : (returns || []);

        if (returnsToExport.length === 0) {
            toast.error("Aucune donnée à exporter.");
            return;
        }

        const csvData = returnsToExport.map(r => {
            const customer = r.customerUuid ? customerMap.get(r.customerUuid) : null;
            return {
                Date: r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'N/A',
                'Facture Originale': r.originalInvoiceNumber,
                Client: customer ? `${customer.firstName} ${customer.lastName}` : 'Passage',
                'Valeur Retour': r.totalReturnValue,
                'Montant Remboursé': r.amountRefunded,
                Articles: r.items.length,
                Notes: r.notes || ''
            };
        });

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `retours-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${returnsToExport.length} retour(s) exporté(s).`);
    };

    const handleViewDetails = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsDetailsOpen(true);
    };

    const handleCancelReturn = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsCancelOpen(true);
    };

    const resetFilters = () => {
        setSearchQuery('');
    };

    const isFiltered = searchQuery !== '';
    
    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader
                title="Registre des Retours"
                description="Régularisation Elite des flux de marchandises et des crédits"
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCsv} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide border-primary/20 hover:bg-primary/5 transition-all">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button asChild className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl shadow-sm transition-all active:scale-95">
                        <Link href="/returns/new">
                            <Plus className="mr-2 h-4 w-4" /> Nouveau Retour
                        </Link>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-12 w-12 rounded-2xl border-white/5 bg-card/40 hover:bg-primary/10 transition-all group"
                        onClick={fetchReturnsAndCustomers}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-5 w-5 text-primary transition-all duration-1000", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <ReturnStats returns={returns} isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/20 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
                <div className="relative group flex-grow max-w-xl px-4">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-500" />
                    <Input 
                        placeholder="Rechercher par N° Facture..."
                        className="pl-14 h-9 rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20 font-bold text-lg"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 px-4">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                    
                    <div className="flex items-center gap-1 p-1 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                        <Button 
                            variant={viewMode === 'grid' ? 'secondary': 'ghost'} 
                            size="icon" 
                            className="rounded-xl h-10 w-10"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-5 w-5"/>
                        </Button>
                        <Button 
                            variant={viewMode === 'list' ? 'secondary': 'ghost'} 
                            size="icon" 
                            className="rounded-xl h-10 w-10"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-5 w-5"/>
                        </Button>
                    </div>

                    {isFiltered && (
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-destructive hover:bg-destructive/10" onClick={resetFilters}>
                            <FilterX className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
            
            {selectedReturns.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-sm rounded-full px-8 py-4 flex items-center gap-4">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-lg">
                                {selectedReturns.size}
                            </div>
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Retours Sélectionnés</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={handleExportCsv} className="rounded-full h-12 px-6 font-semibold text-[10px] uppercase tracking-wide hover:bg-primary/10 hover:text-primary transition-all">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter (.csv)
                            </Button>
                            <Button variant="ghost" onClick={() => setIsBulkCancelConfirmOpen(true)} className="rounded-full h-12 px-6 font-semibold text-[10px] uppercase tracking-wide text-destructive hover:bg-destructive/10 transition-all">
                                <Trash2 className="mr-2 h-4 w-4" /> Annuler Flux
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedReturns(new Set())} className="rounded-full h-12 w-12 hover:bg-white/5 transition-all">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg bg-card/40 animate-pulse" />)}
                    </div>
                ) : returns.length === 0 ? (
                    <EmptyState
                        icon={Undo2}
                        title="Aucun retour identifié"
                        description={isFiltered ? "Ajustez vos filtres pour localiser les flux." : "Commencez par enregistrer votre premier retour Premium."}
                    >
                        {isFiltered && <Button variant="outline" onClick={resetFilters} className="rounded-2xl h-12 font-bold px-8 border-primary/20 hover:bg-primary/5">Effacer les filtres</Button>}
                    </EmptyState>
                ) : (
                    viewMode === 'list' ? (
                        <ReturnTable 
                            returns={returns}
                            customerMap={customerMap}
                            selectedReturns={selectedReturns}
                            onToggleSelection={handleToggleSelection}
                            onViewDetails={handleViewDetails}
                            onCancel={handleCancelReturn}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {returns.map(r => {
                                const customer = r.customerUuid ? customerMap.get(r.customerUuid) : undefined;
                                return (
                                    <ReturnHistoryCard 
                                        key={r.uuid} 
                                        productReturn={r}
                                        customerName={customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
                                        isSelected={selectedReturns.has(r.uuid)}
                                        onToggleSelection={() => handleToggleSelection(r.uuid)}
                                        onViewDetails={handleViewDetails}
                                        onCancelReturn={handleCancelReturn}
                                    />
                                )
                            })}
                        </div>
                    )
                )}
            </div>

            <ReturnDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                productReturn={selectedReturn}
                customerName={selectedReturn?.customerUuid ? `${customerMap.get(selectedReturn.customerUuid)?.firstName} ${customerMap.get(selectedReturn.customerUuid)?.lastName}` : 'Client de passage'}
            />
            
            <CancelReturnDialog 
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                productReturn={selectedReturn}
                onSuccess={fetchReturnsAndCustomers}
            />

            <ConfirmAlertDialog
                isOpen={isBulkCancelConfirmOpen}
                onOpenChange={setIsBulkCancelConfirmOpen}
                title={`Annuler ${selectedReturns.size} retours de marchandise ?`}
                description={
                    <div className="space-y-4">
                        <p>Cette opération est <b>définitive</b>. Les conséquences suivantes seront appliquées :</p>
                        <ul className="list-disc list-inside text-xs space-y-1 opacity-70 ml-2">
                            <li>Soustraction immédiate des articles du stock</li>
                            <li>Annulation des avoirs et recalcul des soldes clients</li>
                            <li>Réversion des écritures comptables associées</li>
                        </ul>
                    </div>
                }
                onConfirm={handleBulkCancel}
                confirmText="Confirmer l'Annulation Elite"
            />
        </div>
    );
}