
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockIntake, Supplier, InventoryLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive, LayoutGrid, List, History, ArrowUpDown, RefreshCw, Filter, Building, Wallet, Trash2 } from 'lucide-react';
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
import { SupplierTable } from '@/components/stock/SupplierTable';
import { SupplierPaymentDialog } from '@/components/stock/SupplierPaymentDialog';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { cn, formatCurrency } from '@/lib/utils';

type StockTab = 'intakes' | 'logs' | 'suppliers';

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
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [isSupplierPayOpen, setIsSupplierPayOpen] = useState(false);
    const [isDeleteSupplierOpen, setIsDeleteSupplierOpen] = useState(false);
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
                    stockService.getStockIntakes({
                        query: debouncedSearchQuery,
                        from: dateRange.from,
                        to: dateRange.to
                    }),
                    supplierService.getSuppliers()
                ]);
                setStockIntakes(intakesData);
                setSupplierMap(new Map(suppliersData.map(s => [s.uuid, s])));
            } else if (activeTab === 'logs') {
                const logsData = await inventoryService.getLogs({
                    query: debouncedSearchQuery,
                    from: dateRange.from,
                    to: dateRange.to
                });
                setInventoryLogs(logsData);
            } else {
                const suppliersData = await supplierService.getSuppliers();
                setSuppliers(suppliersData);
            }
        } catch (error: any) {
            toast.error("Erreur lors du chargement des données.", { description: error.message });
            if (activeTab === 'intakes') setStockIntakes([]);
            else if (activeTab === 'logs') setInventoryLogs([]);
            else setSuppliers([]);
        } finally {
            setIsRefreshing(false);
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

    const handlePaySupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsSupplierPayOpen(true);
    };

    const handleDeleteSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsDeleteSupplierOpen(true);
    };

    const performDeleteSupplier = async () => {
        if (selectedSupplier) {
            await supplierService.deleteSupplier(selectedSupplier.uuid);
            toast.success(`Fournisseur "${selectedSupplier.name}" supprimé.`);
            fetchData();
        }
    };

    const totalSuppliersDebt = useMemo(() => {
        if (!suppliers) return 0;
        return suppliers.reduce((sum, s) => sum + s.balance, 0);
    }, [suppliers]);

    const renderSkeletons = () => {
        if (activeTab === 'intakes' && viewMode === 'list') {
            return <StockIntakeTableSkeleton />;
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-3xl" />)}
            </div>
        );
    }

    const renderIntakesContent = () => {
        if (!stockIntakes || stockIntakes.length === 0) {
            return (
                <EmptyState
                    icon={Archive}
                    title="Aucune réception de stock trouvée"
                    description="Commencez par enregistrer une nouvelle réception de stock ou modifier les dates."
                >
                     <Button asChild className="rounded-2xl h-12 px-8 font-bold shadow-lg shadow-primary/20">
                        <Link href="/stock/intake"><Plus className="mr-2 h-5 w-5" /> Nouvelle Réception</Link>
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

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
            <PageHeader
                title="Gestion du Stock & Fournisseurs"
                description="Surveillez vos réceptions, gérez vos fournisseurs et suivez chaque mouvement."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setIsAdjustmentOpen(true)} className="flex-1 sm:flex-none rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <ArrowUpDown className="mr-2 h-4 w-4 text-primary" /> Correction
                    </Button>
                    <Button asChild className="flex-1 sm:flex-none rounded-xl font-bold shadow-lg shadow-primary/20">
                        <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Réception</Link>
                    </Button>
                </div>
            </PageHeader>

            {activeTab === 'suppliers' ? (
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className={cn("h-24 w-full rounded-2xl", !isLoading && "hidden")} />
                    {!isLoading && (
                        <>
                            <div className="p-6 rounded-2xl bg-card border shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">Total Fournisseurs</p>
                                    <p className="text-3xl font-black">{suppliers?.length}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                                    <Building className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-card border shadow-sm flex items-center justify-between col-span-2">
                                <div>
                                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">Dette Totale Fournisseurs</p>
                                    <p className="text-3xl font-black text-destructive">{formatCurrency(totalSuppliersDebt)}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-destructive/10 text-destructive">
                                    <Wallet className="h-6 w-6" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <StockIntakeStats intakes={stockIntakes} isLoading={isLoading && activeTab === 'intakes'} />
            )}

            {/* Navigation Tabs - Glassmorphism style */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50 w-fit">
                    <button 
                        onClick={() => setActiveTab('intakes')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                            activeTab === 'intakes' 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        <Archive className="h-4 w-4" />
                        Réceptions
                    </button>
                    <button 
                        onClick={() => setActiveTab('suppliers')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                            activeTab === 'suppliers' 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        <Building className="h-4 w-4" />
                        Fournisseurs
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                            activeTab === 'logs' 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        <History className="h-4 w-4" />
                        Audit
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-grow sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input 
                            placeholder={activeTab === 'intakes' ? "N° Facture, Fournisseur..." : activeTab === 'suppliers' ? "Nom du fournisseur..." : "Nom du produit..."}
                            className="pl-9 h-10 rounded-xl bg-card border-none shadow-sm focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl border-none bg-card shadow-sm"
                        onClick={fetchData}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-between">
                <div className="flex gap-2">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                </div>
                
                {activeTab === 'intakes' && (
                    <div className="flex items-center gap-1 rounded-2xl bg-muted/50 p-1">
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
                )}
            </div>
            
            <div className="min-h-[450px] animate-in fade-in duration-500">
                {isLoading ? renderSkeletons() : (
                    activeTab === 'intakes' ? renderIntakesContent() : 
                    activeTab === 'logs' ? <InventoryLogTable logs={inventoryLogs || []} /> :
                    <SupplierTable 
                        suppliers={suppliers || []} 
                        onPay={handlePaySupplier} 
                        onEdit={() => {}} 
                        onDelete={handleDeleteSupplier} 
                    />
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

            <SupplierPaymentDialog
                isOpen={isSupplierPayOpen}
                onOpenChange={setIsSupplierPayOpen}
                supplier={selectedSupplier}
                onSuccess={fetchData}
            />

            <ConfirmAlertDialog
                isOpen={isDeleteSupplierOpen}
                onOpenChange={setIsDeleteSupplierOpen}
                title={`Supprimer le fournisseur ${selectedSupplier?.name} ?`}
                description="Cette action est possible uniquement si le solde est nul et qu'il n'y a pas de factures associées."
                onConfirm={performDeleteSupplier}
                confirmText="Supprimer"
            />
        </div>
    );
}
