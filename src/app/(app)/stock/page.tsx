'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockIntake, Supplier, InventoryLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive, LayoutGrid, List, History, ArrowUpDown } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeTable } from '@/components/stock/stock-intake-table';
import { StockIntakeTableSkeleton } from '@/components/stock/stock-intake-table-skeleton';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { stockService } from '@/services/stock.service';
import { supplierService } from '@/services/supplier.service';
import { inventoryService } from '@/services/inventory.service';
import { useAppStore } from '@/stores/appStore';
import { CancelIntakeDialog } from '@/components/stock/CancelIntakeDialog';
import { StockIntakeStats } from '@/components/stock/StockIntakeStats';
import { InventoryLogTable } from '@/components/stock/InventoryLogTable';
import { StockAdjustmentDialog } from '@/components/stock/StockAdjustmentDialog';

type StockTab = 'intakes' | 'logs';

export default function StockPage() {
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.stockViewMode,
        setViewMode: state.actions.setStockViewMode,
    }));

    const [activeTab, setActiveTab] = useState<StockTab>('intakes');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);

    const [stockIntakes, setStockIntakes] = useState<StockIntake[] | undefined>(undefined);
    const [inventoryLogs, setInventoryLogs] = useState<(InventoryLog & { productName: string })[] | undefined>(undefined);
    const [supplierMap, setSupplierMap] = useState<Map<string, Supplier>>(new Map());
    
    const isLoading = activeTab === 'intakes' ? stockIntakes === undefined : inventoryLogs === undefined;

    const fetchData = useCallback(async () => {
        if (!isMounted || !dateRange?.from) return;
        
        try {
            if (activeTab === 'intakes') {
                setStockIntakes(undefined);
                const [intakesData, suppliersData] = await Promise.all([
                    stockService.getStockIntakes({
                        query: debouncedSearchQuery,
                        from: dateRange.from,
                        to: dateRange.to
                    }),
                    supplierService.getSuppliers()
                ]);
                setStockIntakes(intakesData);
                setSupplierMap(new Map(suppliersData.map(s => [s.uuid, s])));
            } else {
                setInventoryLogs(undefined);
                const logsData = await inventoryService.getLogs({
                    query: debouncedSearchQuery,
                    from: dateRange.from,
                    to: dateRange.to
                });
                setInventoryLogs(logsData);
            }
        } catch (error: any) {
            toast.error("Erreur lors du chargement des données.", { description: error.message });
            if (activeTab === 'intakes') setStockIntakes([]);
            else setInventoryLogs([]);
        }
    }, [isMounted, debouncedSearchQuery, dateRange, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleViewDetails = useCallback((intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsDetailsOpen(true);
    }, []);

    const handleCancelIntake = useCallback((intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsCancelOpen(true);
    }, []);

    const renderSkeletons = () => {
        if (activeTab === 'intakes' && viewMode === 'list') {
            return <StockIntakeTableSkeleton />;
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
            </div>
        );
    }

    const renderIntakesContent = () => {
        if (!stockIntakes || stockIntakes.length === 0) {
            return (
                <EmptyState
                    icon={Archive}
                    title="Aucune réception de stock trouvée"
                    description="Commencez par enregistrer une nouvelle réception de stock."
                >
                     <Button asChild>
                        <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                    </Button>
                </EmptyState>
            );
        }
        
        if (viewMode === 'list') {
            return (
                <StockIntakeTable
                    intakes={stockIntakes}
                    supplierMap={supplierMap}
                    onViewDetails={handleViewDetails}
                    onCancelIntake={handleCancelIntake}
                />
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stockIntakes.map(s => {
                    const supplier = s.supplierUuid ? supplierMap.get(s.supplierUuid) : undefined;
                    return (
                        <StockIntakeCard 
                            key={s.uuid} 
                            intake={s}
                            supplierName={supplier?.name}
                            onViewDetails={handleViewDetails}
                            onCancelIntake={handleCancelIntake}
                        />
                    );
                })}
            </div>
        );
    }

    const renderLogsContent = () => {
        if (!inventoryLogs || inventoryLogs.length === 0) {
            return (
                <EmptyState
                    icon={History}
                    title="Aucun mouvement de stock"
                    description="Toutes les variations de stock apparaîtront ici."
                />
            );
        }
        return <InventoryLogTable logs={inventoryLogs} />;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Gestion du Stock"
                description="Suivez vos réceptions et surveillez les mouvements de vos produits."
            >
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsAdjustmentOpen(true)}>
                        <ArrowUpDown className="mr-2 h-4 w-4" /> Correction Manuelle
                    </Button>
                    <Button asChild>
                        <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                    </Button>
                </div>
            </PageHeader>

            <StockIntakeStats intakes={stockIntakes} isLoading={isLoading && activeTab === 'intakes'} />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-4 border-b pb-1 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('intakes')}
                    className={`pb-2 px-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'intakes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Réceptions (Achats)
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('logs')}
                    className={`pb-2 px-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'logs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Mouvements (Sajal)
                    </div>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder={activeTab === 'intakes' ? "Rechercher par Fournisseur ou N° Facture..." : "Rechercher par nom de produit..."}
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <DateRangePicker date={dateRange} setDate={setDate} />
                
                {activeTab === 'intakes' && (
                    <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                            <LayoutGrid className="h-5 w-5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                            <List className="h-5 w-5"/>
                        </Button>
                    </div>
                )}
            </div>
            
            <div className="min-h-[400px]">
                {isLoading ? renderSkeletons() : (
                    activeTab === 'intakes' ? renderIntakesContent() : renderLogsContent()
                )}
            </div>

            <StockIntakeDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                intake={selectedIntake}
                supplierName={selectedIntake?.supplierUuid ? supplierMap.get(selectedIntake.supplierUuid)?.name : 'Fournisseur Inconnu'}
            />

            <CancelIntakeDialog
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                intake={selectedIntake}
                onSuccess={fetchData}
            />

            <StockAdjustmentDialog
                isOpen={isAdjustmentOpen}
                onOpenChange={setIsAdjustmentOpen}
                onSuccess={fetchData}
            />
        </div>
    );
}
