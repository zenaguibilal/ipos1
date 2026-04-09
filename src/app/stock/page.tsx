'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockIntake, Supplier, InventoryLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive, LayoutGrid, List, History, ArrowUpDown, RefreshCw, Building } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeTable } from '@/components/stock/stock-intake-table';
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
import { SupplierTable } from '@/components/stock/SupplierTable';
import { SupplierPaymentDialog } from '@/components/stock/SupplierPaymentDialog';
import { SupplierDialog } from '@/components/stock/SupplierDialog';
import { cn } from '@/lib/utils';

export default function StockPage() {
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.stockViewMode,
        setViewMode: state.actions.setStockViewMode,
    }));

    const [activeTab, setActiveTab] = useState<'intakes' | 'logs' | 'suppliers'>('intakes');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [isSupplierPayOpen, setIsSupplierPayOpen] = useState(false);
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [stockIntakes, setStockIntakes] = useState<StockIntake[] | undefined>(undefined);
    const [inventoryLogs, setInventoryLogs] = useState<(InventoryLog & { productName: string })[] | undefined>(undefined);
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
    const [supplierMap, setSupplierMap] = useState<Map<string, Supplier>>(new Map());
    
    const isLoading = activeTab === 'intakes' ? stockIntakes === undefined : activeTab === 'logs' ? inventoryLogs === undefined : suppliers === undefined;

    const fetchData = useCallback(async () => {
        if (!isMounted || !dateRange?.from) return;
        setIsRefreshing(true);
        try {
            if (activeTab === 'intakes') {
                const [intakesData, suppliersData] = await Promise.all([
                    stockService.getStockIntakes({ query: debouncedSearchQuery, from: dateRange.from, to: dateRange.to }),
                    supplierService.getSuppliers()
                ]);
                setStockIntakes(intakesData);
                setSupplierMap(new Map(suppliersData.map(s => [s.uuid, s])));
            } else if (activeTab === 'logs') {
                const logsData = await inventoryService.getLogs({ query: debouncedSearchQuery, from: dateRange.from, to: dateRange.to });
                setInventoryLogs(logsData);
            } else {
                const suppliersData = await supplierService.getSuppliers();
                setSuppliers(suppliersData);
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [isMounted, debouncedSearchQuery, dateRange, activeTab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleViewDetails = (intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsDetailsOpen(true);
    };

    const handleCancelIntake = (intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsCancelOpen(true);
    };

    return (
        <div className="p-3 sm:p-4 space-y-3 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <PageHeader title="Flux & Stock" description="Inventaire et Fournisseurs">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsAdjustmentOpen(true)} className="h-8 text-[9px] uppercase font-bold px-3"><ArrowUpDown className="mr-1.5 h-3 w-3" /> Correction</Button>
                    <Button asChild size="sm" className="h-8 text-[9px] uppercase font-bold px-3 bg-indigo-600 hover:bg-indigo-700 text-white"><Link href="/stock/intake"><Plus className="mr-1.5 h-3 w-3" /> Réception</Link></Button>
                </div>
            </PageHeader>

            <div className="flex gap-1 items-center bg-white/50 p-1 rounded-lg border shadow-sm w-fit overflow-x-auto no-scrollbar">
                <Button variant={activeTab === 'intakes' ? "secondary" : "ghost"} size="sm" className="h-7 text-[9px] uppercase font-black px-3 rounded-md" onClick={() => setActiveTab('intakes')}>Réceptions</Button>
                <Button variant={activeTab === 'suppliers' ? "secondary" : "ghost"} size="sm" className="h-7 text-[9px] uppercase font-black px-3 rounded-md" onClick={() => setActiveTab('suppliers')}>Fournisseurs</Button>
                <Button variant={activeTab === 'logs' ? "secondary" : "ghost"} size="sm" className="h-7 text-[9px] uppercase font-black px-3 rounded-md" onClick={() => setActiveTab('logs')}>Audit</Button>
            </div>

            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
                ) : activeTab === 'intakes' ? (
                    <div className="space-y-3">
                        <StockIntakeStats intakes={stockIntakes} />
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                {stockIntakes?.map(i => <StockIntakeCard key={i.uuid} intake={i} supplierName={i.supplierUuid ? supplierMap.get(i.supplierUuid)?.name : undefined} onViewDetails={handleViewDetails} onCancelIntake={handleCancelIntake} />)}
                            </div>
                        ) : <StockIntakeTable intakes={stockIntakes!} supplierMap={supplierMap} onViewDetails={handleViewDetails} onCancelIntake={handleCancelIntake} />}
                    </div>
                ) : activeTab === 'logs' ? <InventoryLogTable logs={inventoryLogs!} /> : <SupplierTable suppliers={suppliers!} onPay={(s) => { setSelectedSupplier(s); setIsSupplierPayOpen(true); }} onEdit={(s) => { setSelectedSupplier(s); setIsSupplierDialogOpen(true); }} onDelete={() => {}} selectedSuppliers={new Set()} onToggleSupplierSelection={() => {}} onToggleSelectAll={() => {}} />}
            </div>

            <StockIntakeDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} intake={selectedIntake} />
            <CancelIntakeDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} intake={selectedIntake} onSuccess={fetchData} />
            <StockAdjustmentDialog isOpen={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen} onSuccess={fetchData} />
            <SupplierPaymentDialog isOpen={isSupplierPayOpen} onOpenChange={setIsSupplierPayOpen} supplier={selectedSupplier} onSuccess={fetchData} />
            <SupplierDialog isOpen={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen} supplier={selectedSupplier} onSuccess={fetchData} />
        </div>
    );
}
