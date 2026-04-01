'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
    X,
    CheckSquare
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
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { useAppStore } from '@/stores/appStore';
import Papa from 'papaparse';

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
            toast.error("Impossible de charger l'historique des retours.", { description: error.message });
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

    const handleSelectAll = () => {
        if (!returns) return;
        if (selectedReturns.size === returns.length) {
            setSelectedReturns(new Set());
        } else {
            setSelectedReturns(new Set(returns.map(r => r.uuid)));
        }
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
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-3xl" />)}
                </div>
            );
        }

        if (!returns || returns.length === 0) {
            return (
                <EmptyState
                    icon={Undo2}
                    title="Aucun retour trouvé"
                    description={isFiltered ? "Ajustez vos filtres de recherche." : "Les retours de produits apparaîtront ici."}
                >
                    <div className="flex gap-2 justify-center">
                        {isFiltered && <Button variant="outline" onClick={resetFilters} className="rounded-xl"><FilterX className="mr-2 h-4 w-4" /> Effacer</Button>}
                        <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
                            <Link href="/returns/new"><Plus className="mr-2 h-4 w-4" /> Nouveau Retour</Link>
                        </Button>
                    </div>
                </EmptyState>
            );
        }
        
        if (viewMode === 'list') {
            return (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10 w-fit">
                        <Checkbox 
                            id="select-all" 
                            checked={selectedReturns.size === returns.length && returns.length > 0} 
                            onCheckedChange={handleSelectAll}
                            className="border-primary data-[state=checked]:bg-primary"
                        />
                        <label htmlFor="select-all" className="text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer">
                            Tout sélectionner ({selectedReturns.size})
                        </label>
                    </div>
                    <ReturnTable 
                        returns={returns}
                        customerMap={customerMap}
                        selectedReturns={selectedReturns}
                        onToggleSelection={handleToggleSelection}
                        onViewDetails={handleViewDetails}
                        onCancel={handleCancelReturn}
                    />
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {returns.map(r => {
                    const customer = r.customerUuid ? customerMap.get(r.customerUuid) : undefined;
                    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : undefined;
                    return (
                        <ReturnHistoryCard 
                            key={r.uuid} 
                            productReturn={r}
                            customerName={customerName}
                            isSelected={selectedReturns.has(r.uuid)}
                            onToggleSelection={() => handleToggleSelection(r.uuid)}
                            onViewDetails={handleViewDetails}
                            onCancelReturn={handleCancelReturn}
                        />
                    )
                })}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto pb-24">
            <PageHeader
                title="Gestion des Retours"
                description="Suivez les retours de marchandises et régularisez vos stocks."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCsv} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button asChild className="rounded-xl font-bold shadow-lg shadow-primary/20">
                        <Link href="/returns/new"><Plus className="mr-2 h-4 w-4" /> Nouveau</Link>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-xl border-none shadow-sm bg-card h-10 w-10"
                        onClick={fetchReturnsAndCustomers}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <ReturnStats returns={returns} isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                        placeholder="Rechercher par N° Facture..."
                        className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2">
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

            {/* Selection Action Bar */}
            {selectedReturns.size > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-card/80 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
                        <div className="flex items-center gap-2 pr-6 border-r border-border/50">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black">
                                {selectedReturns.size}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sélectionnées</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={handleExportCsv} className="rounded-full h-10 font-bold hover:bg-primary/10 hover:text-primary">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsBulkCancelConfirmOpen(true)} className="rounded-full h-10 font-bold text-destructive hover:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Annuler Tout
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedReturns(new Set())} className="rounded-full h-10 w-10 hover:bg-muted">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                title={`Annuler ${selectedReturns.size} retour(s) ?`}
                description="Cette opération est irréversible. Toutes les quantités seront soustraites du stock (si elles ont été réintégrées) et les soldes clients seront recalculés."
                onConfirm={handleBulkCancel}
                confirmText="Oui, Annuler Tout"
            />
        </div>
    );
}
