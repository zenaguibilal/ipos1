'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockIntake, Supplier, InventoryLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive, LayoutGrid, List, History, ArrowUpDown, RefreshCw, Building, Wallet, UserPlus, Trash2, X, FileUp } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeTable } from '@/components/stock/stock-intake-table';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { cn, formatCurrency } from '@/lib/utils';
import Papa from 'papaparse';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

type StockTab = 'intakes' | 'logs' | 'suppliers';

export default function StockPage() {
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
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
    const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
    
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [isSupplierPayOpen, setIsSupplierPayOpen] = useState(false);
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [isDeleteSupplierOpen, setIsDeleteSupplierOpen] = useState(false);
    const [isBulkDeleteSupplierOpen, setIsBulkDeleteSupplierOpen] = useState(false);
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
                if (debouncedSearchQuery) {
                    const q = debouncedSearchQuery.toLowerCase();
                    setSuppliers(suppliersData.filter(s => s.name.toLowerCase().includes(q)));
                } else {
                    setSuppliers(suppliersData);
                }
            }
        } catch (error: any) {
            toast.error("Erreur lors du chargement des données.");
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

    useEffect(() => {
        setSelectedSuppliers(new Set());
    }, [activeTab, debouncedSearchQuery]);


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

    const handleEditSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsSupplierDialogOpen(true);
    };

    const handleAddSupplier = () => {
        setSelectedSupplier(null);
        setIsSupplierDialogOpen(true);
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

    const handleToggleSupplierSelection = (uuid: string) => {
        setSelectedSuppliers(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    };

    const handleToggleSelectAllSuppliers = () => {
        if (!suppliers) return;
        if (selectedSuppliers.size === suppliers.length) {
            setSelectedSuppliers(new Set());
        } else {
            setSelectedSuppliers(new Set(suppliers.map(s => s.uuid)));
        }
    };

    const handleBulkDeleteSuppliers = async () => {
        const uuids = Array.from(selectedSuppliers);
        try {
            await supplierService.bulkDelete(uuids);
            toast.success(`${uuids.length} fournisseur(s) supprimé(s).`);
            setSelectedSuppliers(new Set());
            fetchData();
        } catch (e: any) {
            toast.error("Échec de la suppression groupée.", { description: e.message });
        }
    };

    const handleExportSuppliers = () => {
        if (!suppliers) return;
        const toExport = selectedSuppliers.size > 0 
            ? suppliers.filter(s => selectedSuppliers.has(s.uuid))
            : suppliers;

        const csv = Papa.unparse(toExport.map(s => ({
            Nom: s.name,
            Contact: s.contactPerson || '',
            Téléphone: s.phone || '',
            Email: s.email || '',
            Adresse: s.address || '',
            Solde: s.balance
        })));

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ipos-fournisseurs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Exportation terminée.");
    };

    const totalSuppliersDebt = useMemo(() => {
        if (!suppliers) return 0;
        return suppliers.reduce((sum, s) => sum + s.balance, 0);
    }, [suppliers]);

    // Raccourcis pour la page logistique
    useKeyboardShortcuts([
        {
            key: 'F3',
            action: () => searchInputRef.current?.focus(),
            description: 'Rechercher un flux ou partenaire',
            ignoreInputFocus: true
        },
        {
            key: 'n',
            action: () => { 
                if (activeTab === 'suppliers') handleAddSupplier();
                else router.push('/stock/intake');
            },
            description: activeTab === 'suppliers' ? 'Nouveau fournisseur' : 'Nouvelle réception',
            ignoreInputFocus: false
        }
    ], 'Logistique');

    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
            <PageHeader
                title="Elite Inventory"
                description="Contrôle absolu des flux de marchandises & Partenaires"
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    {activeTab === 'suppliers' ? (
                        <Button onClick={handleAddSupplier} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl transition-all active:scale-95">
                            <UserPlus className="mr-2 h-4 w-4" /> Nouveau Fournisseur [N]
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsAdjustmentOpen(true)} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide border-primary/20 hover:bg-primary/5 transition-all">
                                <ArrowUpDown className="mr-2 h-4 w-4 text-primary" /> Correction
                            </Button>
                            <Button asChild className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl transition-all active:scale-95">
                                <Link href="/stock/intake">
                                    <Plus className="mr-2 h-4 w-4" /> Réception [N]
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <div className="animate-in slide-in-from-top-4 duration-700">
                {activeTab === 'suppliers' ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <Skeleton className="h-32 w-full rounded-lg bg-card/40" />)
                        ) : (
                            <>
                                <div className="app-card p-4 rounded-lg bg-card/40 backdrop-blur-sm border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Total Partenaires</p>
                                        <p className="text-xl font-semibold tracking-tighter">{suppliers?.length}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                                        <Building className="h-8 w-8" />
                                    </div>
                                </div>
                                <div className="app-card p-4 rounded-lg bg-card/40 backdrop-blur-sm border-white/5 flex items-center justify-between col-span-2">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase text-destructive mb-2">Dette Globale Fournisseurs</p>
                                        <p className="text-xl font-semibold tracking-tighter text-destructive">{formatCurrency(totalSuppliersDebt)}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-destructive/10 text-destructive">
                                        <Wallet className="h-8 w-8" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <StockIntakeStats intakes={stockIntakes} isLoading={isLoading && activeTab === 'intakes'} />
                )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/20 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 p-1.5 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('intakes')}
                        className={cn(
                            "flex items-center gap-3 px-8 py-3 rounded-lg text-[10px] font-semibold uppercase transition-all duration-500",
                            activeTab === 'intakes' 
                                ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                                : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Archive className="h-4 w-4" />
                        Réceptions
                    </button>
                    <button 
                        onClick={() => setActiveTab('suppliers')}
                        className={cn(
                            "flex items-center gap-3 px-8 py-3 rounded-lg text-[10px] font-semibold uppercase transition-all duration-500",
                            activeTab === 'suppliers' 
                                ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                                : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Building className="h-4 w-4" />
                        Fournisseurs
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={cn(
                            "flex items-center gap-3 px-8 py-3 rounded-lg text-[10px] font-semibold uppercase transition-all duration-500",
                            activeTab === 'logs' 
                                ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                                : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <History className="h-4 w-4" />
                        Audit Flux
                    </button>
                </div>

                <div className="flex items-center gap-4 px-4">
                    <div className="relative group flex-grow max-w-xs">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            ref={searchInputRef}
                            placeholder="Rechercher [F3]..."
                            className="pl-11 h-12 rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20 font-bold"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <DateRangePicker date={dateRange} setDate={setDate} />
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-12 w-12 rounded-2xl border-white/5 bg-card/40 hover:bg-primary/10 transition-all group"
                        onClick={fetchData}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-5 w-5 text-primary transition-all duration-1000", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {activeTab === 'suppliers' && selectedSuppliers.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-sm rounded-full px-8 py-4 flex items-center gap-4">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-lg">
                                {selectedSuppliers.size}
                            </div>
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Sélection Elite</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={handleExportSuppliers} className="rounded-full h-12 px-6 font-semibold text-[10px] uppercase tracking-wide hover:bg-primary/10 hover:text-primary transition-all">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter (.csv)
                            </Button>
                            <Button variant="ghost" onClick={() => setIsBulkDeleteSupplierOpen(true)} className="rounded-full h-12 px-6 font-semibold text-[10px] uppercase tracking-wide text-destructive hover:bg-destructive/10 transition-all">
                                <Trash2 className="mr-2 h-4 w-4" /> Révoquer Comptes
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSuppliers(new Set())} className="rounded-full h-12 w-12 hover:bg-white/5 transition-all">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg bg-card/40" />)}
                    </div>
                ) : (
                    <>
                        {activeTab === 'intakes' && (
                            <div className="space-y-4">
                                <div className="flex justify-end px-4">
                                    <div className="flex items-center gap-1 p-1 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                {stockIntakes?.length === 0 ? (
                                    <EmptyState icon={Archive} title="Silence Radio" description="Aucune réception enregistrée pour cette période." />
                                ) : viewMode === 'list' ? (
                                    <StockIntakeTable intakes={stockIntakes!} supplierMap={supplierMap} onViewDetails={handleViewDetails} onCancelIntake={handleCancelIntake} />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {stockIntakes!.map(s => (
                                            <StockIntakeCard key={s.uuid} intake={s} supplierName={s.supplierUuid ? supplierMap.get(s.supplierUuid)?.name : undefined} onViewDetails={handleViewDetails} onCancelIntake={handleCancelIntake} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'logs' && (
                            inventoryLogs?.length === 0 ? (
                                <EmptyState icon={History} title="Historique Vierge" description="Aucun mouvement de stock détecté sur cette période." />
                            ) : <InventoryLogTable logs={inventoryLogs!} />
                        )}
                        {activeTab === 'suppliers' && (
                            suppliers?.length === 0 ? (
                                <EmptyState icon={Building} title="Aucun Partenaire" description="Commencez par ajouter votre premier fournisseur." />
                            ) : (
                                <SupplierTable 
                                    suppliers={suppliers!} 
                                    onPay={handlePaySupplier} 
                                    onEdit={handleEditSupplier} 
                                    onDelete={handleDeleteSupplier} 
                                    selectedSuppliers={selectedSuppliers}
                                    onToggleSupplierSelection={handleToggleSupplierSelection}
                                    onToggleSelectAll={handleToggleSelectAllSuppliers}
                                />
                            )
                        )}
                    </>
                )}
            </div>

            <StockIntakeDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} intake={selectedIntake} supplierName={selectedIntake?.supplierUuid ? supplierMap.get(selectedIntake.supplierUuid)?.name : 'Partenaire Inconnu'} />
            <CancelIntakeDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} intake={selectedIntake} onSuccess={fetchData} />
            <StockAdjustmentDialog isOpen={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen} onSuccess={fetchData} />
            <SupplierPaymentDialog isOpen={isSupplierPayOpen} onOpenChange={setIsSupplierPayOpen} supplier={selectedSupplier} onSuccess={fetchData} />
            <SupplierDialog isOpen={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen} supplier={selectedSupplier} onSuccess={fetchData} />
            
            <ConfirmAlertDialog 
                isOpen={isDeleteSupplierOpen} 
                onOpenChange={setIsDeleteSupplierOpen} 
                title={`Révoquer le partenaire ${selectedSupplier?.name} ?`} 
                description="Cette action est irréversible. Seuls les comptes sans factures actives et avec un solde nul peuvent être supprimés." 
                onConfirm={performDeleteSupplier} 
                confirmText="Confirmer Révocation" 
            />

            <ConfirmAlertDialog
                isOpen={isBulkDeleteSupplierOpen}
                onOpenChange={setIsBulkDeleteSupplierOpen}
                title={`Révoquer ${selectedSuppliers.size} comptes partenaires ?`}
                description="Seuls les comptes sans historique et avec un solde nul seront effectivement supprimés. Les autres seront ignorés pour préserver l'intégrité comptable."
                onConfirm={handleBulkDeleteSuppliers}
                confirmText="Confirmer Révocation Groupée"
            />
        </div>
    );
}
