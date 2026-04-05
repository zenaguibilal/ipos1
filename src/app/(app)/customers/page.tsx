'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, ImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus, Search, Users, FileDown, Loader2, FileUp,
    FilterX, RefreshCw, SortAsc, Printer, Wheat,
    Trash2, X, LayoutGrid, List
} from 'lucide-react';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { DeleteMultipleCustomersDialog } from '@/components/customers/DeleteMultipleCustomersDialog';
import { toast } from 'sonner';
import { CustomerStats } from '@/components/customers/CustomerStats';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
    DropdownMenuRadioGroup, DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/card';
import { customerService } from '@/services/customer.service';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import Papa from 'papaparse';
import { useAppStore } from '@/stores/appStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'has_debt' | 'overdue' | 'over_limit' | 'is_bread_client';

const SORT_OPTIONS: Record<string, string> = {
    'createdAt_desc': 'Plus récents',
    'searchName_asc': 'Nom (A-Z)',
    'totalSpent_desc': 'Plus dépensier',
    'outstandingBalance_desc': 'Plus endetté',
};

const VALID_STATUSES: FilterStatus[] = ['all', 'has_debt', 'overdue', 'over_limit', 'is_bread_client'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CustomerGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i} className="rounded-3xl border-none animate-pulse h-48 bg-card" />
            ))}
        </div>
    );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function CustomersContent() {
    const searchParams = useSearchParams();

    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.customersViewMode,
        setViewMode: state.actions.setCustomersViewMode,
    }));

    // ── State ────────────────────────────────────────────────────────────────

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');

    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [customers, setCustomers] = useState<Customer[] | undefined>(undefined);
    const isLoading = customers === undefined;

    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // ── Init from URL params ──────────────────────────────────────────────────

    useEffect(() => {
        const statusFromQuery = searchParams.get('status') as FilterStatus;
        if (statusFromQuery && VALID_STATUSES.includes(statusFromQuery)) {
            setFilterStatus(statusFromQuery);
        }
    }, [searchParams]);

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchCustomers = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await customerService.filterCustomers({
                query: debouncedSearchQuery,
                status: filterStatus,
                sortBy,
            });
            setCustomers(data);
        } catch {
            toast.error('Impossible de charger les clients.');
            setCustomers([]);
        } finally {
            setIsRefreshing(false);
        }
    }, [debouncedSearchQuery, filterStatus, sortBy]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Clear selection when filters change
    useEffect(() => {
        setSelectedCustomers(new Set());
    }, [filterStatus, sortBy, debouncedSearchQuery]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleEditCustomer = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsCustomerDialogOpen(true);
    }, []);

    const handleDeleteCustomer = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleToggleSelection = useCallback((customerUuid: string) => {
        setSelectedCustomers(prev => {
            const next = new Set(prev);
            if (next.has(customerUuid)) next.delete(customerUuid);
            else next.add(customerUuid);
            return next;
        });
    }, []);

    const handleToggleSelectAll = useCallback(() => {
        if (!customers) return;
        if (selectedCustomers.size === customers.length) {
            setSelectedCustomers(new Set());
        } else {
            setSelectedCustomers(new Set(customers.map(c => c.uuid)));
        }
    }, [customers, selectedCustomers.size]);

    // ── Export CSV ────────────────────────────────────────────────────────────

    const handleExportCsv = () => {
        if (!customers || customers.length === 0) {
            toast.error('Aucun client à exporter.');
            return;
        }

        const dataToExport = selectedCustomers.size > 0
            ? customers.filter(c => selectedCustomers.has(c.uuid))
            : customers;

        const csv = Papa.unparse(dataToExport.map(c => ({
            Prénom: c.firstName,
            Nom: c.lastName,
            Téléphone: c.phone || '',
            Adresse: c.address || '',
            Total_Dépensé: c.totalSpent,
            Solde_Impayé: c.outstandingBalance,
            Limite_Crédit: c.creditLimit ?? 'N/A',
            Dernière_Activité: c.lastActivityDate
                ? new Date(c.lastActivityDate).toLocaleDateString('fr-FR')
                : 'N/A',
            Client_Pain: c.isBreadClient ? 'Oui' : 'Non',
        })));

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ipos-clients-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Exportation terminée.');
    };

    // ── Print Debt List ───────────────────────────────────────────────────────

    const handlePrintDebtList = () => {
        if (!customers) return;
        const debtors = customers.filter(c => c.outstandingBalance > 0);
        if (debtors.length === 0) {
            toast.info("Aucun client n'a de dette à imprimer.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const totalDebt = debtors.reduce((sum, c) => sum + c.outstandingBalance, 0);
        const sortedDebtors = [...debtors].sort((a, b) => b.outstandingBalance - a.outstandingBalance);

        const html = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8" />
                <title>Liste des Dettes Clients</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; background: white; color: black; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #f4f4f4; font-size: 12px; text-transform: uppercase; }
                    h1 { text-align: center; margin-bottom: 5px; }
                    .subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
                    .total { text-align: right; font-weight: bold; margin-top: 20px; font-size: 18px; border-top: 2px solid black; padding-top: 10px; }
                </style>
            </head>
            <body>
                <h1>Rapport des Dettes Clients</h1>
                <p class="subtitle">Date du rapport: ${new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Téléphone</th>
                            <th>Dernière Activité</th>
                            <th style="text-align:right">Solde Impayé</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedDebtors.map(c => `
                            <tr>
                                <td><b>${c.firstName} ${c.lastName}</b></td>
                                <td>${c.phone || '-'}</td>
                                <td>${c.lastActivityDate
                                    ? new Date(c.lastActivityDate).toLocaleDateString('fr-FR')
                                    : 'Jamais'}</td>
                                <td style="text-align:right"><b>${formatCurrency(c.outstandingBalance)}</b></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">Total Global des Créances: ${formatCurrency(totalDebt)}</div>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    // ── Import CSV ────────────────────────────────────────────────────────────

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        try {
            const analysis = await customerService.analyzeImport(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch {
            toast.error("Erreur d'analyse CSV.");
        } finally {
            setIsAnalyzing(false);
            event.target.value = '';
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[]; toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await customerService.executeImport(confirmedData);
            toast.success('Importation réussie !');
            setIsImportPreviewOpen(false);
            setImportAnalysis(null);
            fetchCustomers();
        } catch {
            toast.error("Échec de l'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    // ── Filters ───────────────────────────────────────────────────────────────

    const resetFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
        setSortBy('createdAt_desc');
    };

    const isFiltered =
        searchQuery !== '' ||
        filterStatus !== 'all' ||
        sortBy !== 'createdAt_desc';

    // ── Render helpers ────────────────────────────────────────────────────────

    const filterLabel: Record<FilterStatus, string> = {
        all: 'Tous les clients',
        has_debt: 'Avec une dette',
        overdue: 'Retard de paiement',
        over_limit: 'Plafond dépassé',
        is_bread_client: 'Clients de Pain',
    };

    const renderContent = () => {
        if (isLoading) return <CustomerGridSkeleton />;

        if (!customers || customers.length === 0) {
            return (
                <EmptyState
                    icon={Users}
                    title="Aucun client trouvé"
                    description={
                        isFiltered
                            ? 'Essayez d\'ajuster vos filtres.'
                            : 'Commencez par ajouter votre premier client.'
                    }
                >
                    <div className="flex gap-2 justify-center flex-wrap">
                        {isFiltered && (
                            <Button variant="outline" onClick={resetFilters} className="rounded-xl">
                                <FilterX className="mr-2 h-4 w-4" /> Effacer les filtres
                            </Button>
                        )}
                        <Button
                            onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}
                            className="rounded-xl shadow-lg shadow-primary/20"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un client
                        </Button>
                    </div>
                </EmptyState>
            );
        }

        if (viewMode === 'list') {
            return (
                <CustomerTable
                    customers={customers}
                    onEdit={handleEditCustomer}
                    onDelete={handleDeleteCustomer}
                    selectedCustomers={selectedCustomers}
                    onToggleSelection={handleToggleSelection}
                    onToggleSelectAll={handleToggleSelectAll}
                />
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {customers.map(c => (
                    <CustomerCard
                        key={c.uuid}
                        customer={c}
                        onEdit={handleEditCustomer}
                        onDelete={handleDeleteCustomer}
                        isSelected={selectedCustomers.has(c.uuid)}
                        onToggleSelection={() => handleToggleSelection(c.uuid)}
                        isSelectionActive={selectedCustomers.size > 0}
                    />
                ))}
            </div>
        );
    };

    // ── JSX ───────────────────────────────────────────────────────────────────

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <PageHeader
                title="Gestion des Clients"
                description="Suivez les dettes, les dépenses et l'activité de vos clients."
            >
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                    <Button
                        variant="outline"
                        onClick={handlePrintDebtList}
                        className="rounded-xl font-bold border-primary/20 hover:bg-primary/5"
                    >
                        <Printer className="mr-2 h-4 w-4 text-primary" /> Dettes
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportCsv}
                        className="rounded-xl font-bold border-primary/20 hover:bg-primary/5"
                    >
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    {/* FIX: label wrapping button is correct — kept as-is */}
                    <Button
                        asChild
                        variant="outline"
                        disabled={isAnalyzing}
                        className="rounded-xl font-bold border-primary/20 hover:bg-primary/5"
                    >
                        <label htmlFor="csv-importer" className="cursor-pointer">
                            {isAnalyzing
                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                : <FileDown className="mr-2 h-4 w-4 text-primary" />}
                            {isAnalyzing ? 'Analyse...' : 'Importer'}
                            <input
                                type="file"
                                id="csv-importer"
                                accept=".csv"
                                className="sr-only"
                                onChange={handleFileSelected}
                            />
                        </label>
                    </Button>
                    <Button
                        onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}
                        className="rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nouveau
                    </Button>
                </div>
            </PageHeader>

            {/* Stats */}
            <CustomerStats />

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                        placeholder="Rechercher par nom ou téléphone..."
                        className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Status filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 min-w-[150px] font-medium"
                            >
                                <Users className="mr-2 h-4 w-4 opacity-50" />
                                {filterLabel[filterStatus]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[210px]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Filtrer par Statut
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {(Object.entries(filterLabel) as [FilterStatus, string][]).map(([key, label]) => (
                                key !== 'is_bread_client' ? (
                                    <DropdownMenuCheckboxItem
                                        key={key}
                                        checked={filterStatus === key}
                                        onCheckedChange={() => setFilterStatus(key)}
                                    >
                                        {label}
                                    </DropdownMenuCheckboxItem>
                                ) : (
                                    <div key={key}>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem
                                            checked={filterStatus === key}
                                            onCheckedChange={() => setFilterStatus(key)}
                                        >
                                            <Wheat className="mr-2 h-3 w-3 text-primary" /> {label}
                                        </DropdownMenuCheckboxItem>
                                    </div>
                                )
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 font-medium min-w-[150px]"
                            >
                                <SortAsc className="mr-2 h-4 w-4 opacity-50" />
                                {SORT_OPTIONS[sortBy]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Trier par
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                                    <DropdownMenuRadioItem key={key} value={key} className="text-xs font-bold">
                                        {label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View mode toggle */}
                    <div className="flex items-center gap-1 p-1 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="rounded-xl h-9 w-9"
                            onClick={() => setViewMode('grid')}
                            title="Vue grille"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="rounded-xl h-9 w-9"
                            onClick={() => setViewMode('list')}
                            title="Vue liste"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Reset filters */}
                    {isFiltered && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10"
                            onClick={resetFilters}
                            title="Réinitialiser les filtres"
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}

                    {/* Refresh */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-xl border-none shadow-sm bg-card"
                        onClick={fetchCustomers}
                        disabled={isRefreshing}
                        title="Actualiser"
                    >
                        <RefreshCw className={cn('h-4 w-4 text-primary', isRefreshing && 'animate-spin')} />
                    </Button>
                </div>
            </div>

            {/* Bulk action bar */}
            {selectedCustomers.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-3xl border-2 border-primary/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-10">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <Checkbox
                                id="select-all-customers"
                                checked={
                                    !isLoading &&
                                    !!customers &&
                                    customers.length > 0 &&
                                    selectedCustomers.size === customers.length
                                }
                                onCheckedChange={handleToggleSelectAll}
                                className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                            />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Sélection Elite
                                </span>
                                <span className="text-xs font-black text-primary">
                                    {selectedCustomers.size} client(s)
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={handleExportCsv}
                                className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
                            >
                                <FileUp className="mr-2 h-4 w-4" /> Exporter (.csv)
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsBulkDeleteDialogOpen(true)}
                                className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer Dossiers
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedCustomers(new Set())}
                                className="rounded-full h-12 w-12 hover:bg-white/5 transition-all"
                                title="Désélectionner tout"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="min-h-[450px] animate-in fade-in duration-500">
                {renderContent()}
            </div>

            {/* Dialogs */}
            <CustomerDialog
                isOpen={isCustomerDialogOpen}
                onOpenChange={setIsCustomerDialogOpen}
                customer={selectedCustomer}
                onSuccess={fetchCustomers}
            />

            <DeleteCustomerDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                customer={selectedCustomer}
                onSuccess={fetchCustomers}
            />

            <DeleteMultipleCustomersDialog
                isOpen={isBulkDeleteDialogOpen}
                onOpenChange={setIsBulkDeleteDialogOpen}
                customerUuids={Array.from(selectedCustomers)}
                onSuccess={() => {
                    setSelectedCustomers(new Set());
                    fetchCustomers();
                }}
            />

            <ImportPreviewDialog
                isOpen={isImportPreviewOpen}
                onOpenChange={setIsImportPreviewOpen}
                analysis={importAnalysis}
                onConfirm={handleConfirmImport}
                isImporting={isImporting}
            />
        </div>
    );
}

// ─── Page wrapper (Suspense for useSearchParams) ───────────────────────────────

export default function CustomersPage() {
    return (
        <Suspense
            fallback={
                <div className="p-10 text-center text-[10px] font-black uppercase tracking-[0.4em] opacity-20 animate-pulse">
                    Synchronisation du fichier clients...
                </div>
            }
        >
            <CustomersContent />
        </Suspense>
    );
}