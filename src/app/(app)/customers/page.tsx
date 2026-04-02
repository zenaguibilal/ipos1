
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, ImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, FileDown, Loader2, FileUp, FilterX, RefreshCw, SortAsc, Printer, Wheat, Trash2, CheckSquare } from 'lucide-react';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { DeleteMultipleCustomersDialog } from '@/components/customers/DeleteMultipleCustomersDialog';
import { toast } from 'sonner';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/card';
import { customerService } from '@/services/customer.service';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import Papa from 'papaparse';

type FilterStatus = 'all' | 'has_debt' | 'overdue' | 'over_limit' | 'is_bread_client';

const sortOptions: { [key: string]: string } = {
    'createdAt_desc': 'Plus récents',
    'searchName_asc': 'Nom (A-Z)',
    'totalSpent_desc': 'Plus dépensier',
    'outstandingBalance_desc': 'Plus endetté',
};

export default function CustomersPage() {
    const searchParams = useSearchParams();

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

    // States for CSV Import
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const statusFromQuery = searchParams.get('status') as FilterStatus;
        if (statusFromQuery && ['all', 'has_debt', 'overdue', 'over_limit', 'is_bread_client'].includes(statusFromQuery)) {
            setFilterStatus(statusFromQuery);
        }
    }, [searchParams]);

    const fetchCustomers = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await customerService.filterCustomers({ 
                query: debouncedSearchQuery, 
                status: filterStatus,
                sortBy
            });
            setCustomers(data);
        } catch (error: any) {
            toast.error("Impossible de charger les clients.");
            setCustomers([]);
        } finally {
            setIsRefreshing(false);
        }
    }, [debouncedSearchQuery, filterStatus, sortBy]);
    
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        setSelectedCustomers(new Set());
    }, [customers]);

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
            const newSet = new Set(prev);
            if (newSet.has(customerUuid)) {
                newSet.delete(customerUuid);
            } else {
                newSet.add(customerUuid);
            }
            return newSet;
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

    const handleExportCsv = () => {
        if (!customers || customers.length === 0) {
            toast.error("Aucun client à exporter.");
            return;
        }

        const csv = Papa.unparse(customers.map(c => ({
            Prénom: c.firstName,
            Nom: c.lastName,
            Téléphone: c.phone || '',
            Adresse: c.address || '',
            Total_Dépensé: c.totalSpent,
            Solde_Impayé: c.outstandingBalance,
            Limite_Crédit: c.creditLimit || 'N/A',
            Dernière_Activité: c.lastActivityDate ? new Date(c.lastActivityDate).toLocaleDateString() : 'N/A',
            Client_Pain: c.isBreadClient ? 'Oui' : 'Non'
        })));

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ipos-clients-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Exportation terminée.");
    };

    const handlePrintDebtList = () => {
        if (!customers) return;
        const debtors = customers.filter(c => c.outstandingBalance > 0);
        if (debtors.length === 0) {
            toast.info("Aucun client n'a de dette à imprimer.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Liste des Dettes Clients</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; background: white; color: black; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background-color: #f4f4f4; font-size: 12px; text-transform: uppercase; }
                        h1 { text-align: center; margin-bottom: 5px; }
                        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
                        .total { text-align: right; font-weight: bold; margin-top: 20px; font-size: 18px; border-top: 2px solid black; pt: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Rapport des Dettes Clients</h1>
                    <p class="subtitle">Date du rapport: ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Téléphone</th>
                                <th>Dernière Activité</th>
                                <th style="text-align: right;">Solde Impayé</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${debtors.sort((a,b) => b.outstandingBalance - a.outstandingBalance).map(c => `
                                <tr>
                                    <td><b>${c.firstName} ${c.lastName}</b></td>
                                    <td>${c.phone || '-'}</td>
                                    <td>${c.lastActivityDate ? new Date(c.lastActivityDate).toLocaleDateString() : 'Jamais'}</td>
                                    <td style="text-align: right;"><b>${formatCurrency(c.outstandingBalance)}</b></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="total">Total Global des Créances: ${formatCurrency(debtors.reduce((sum, c) => sum + c.outstandingBalance, 0))}</div>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const analysis = await customerService.analyzeImport(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur d'analyse CSV.");
        } finally {
            setIsAnalyzing(false);
            event.target.value = '';
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await customerService.executeImport(confirmedData);
            toast.success("Importation réussie !");
            setIsImportPreviewOpen(false);
            setImportAnalysis(null);
            fetchCustomers();
        } catch (error: any) {
            toast.error("Échec de l'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
        setSortBy('createdAt_desc');
    };

    const isFiltered = searchQuery !== '' || filterStatus !== 'all' || sortBy !== 'createdAt_desc';
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Card key={i} className="rounded-3xl border-none animate-pulse h-48 bg-card" />)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) return renderSkeletons();

        if (!customers || customers.length === 0) {
            return (
                <EmptyState
                    icon={Users}
                    title="Aucun client trouvé"
                    description={isFiltered ? "Essayez d'ajuster vos filtres." : "Commencez par ajouter votre premier client."}
                >
                    <div className="flex gap-2 justify-center">
                        {isFiltered && <Button variant="outline" onClick={resetFilters} className="rounded-xl"><FilterX className="mr-2 h-4 w-4" /> Effacer</Button>}
                        <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un client
                        </Button>
                    </div>
                </EmptyState>
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
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
            <PageHeader
                title="Gestion des Clients"
                description="Suivez les dettes, les dépenses et l'activité de vos clients."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handlePrintDebtList} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <Printer className="mr-2 h-4 w-4 text-primary" /> Dettes
                    </Button>
                    <Button variant="outline" onClick={handleExportCsv} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button asChild variant="outline" disabled={isAnalyzing} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <label htmlFor="csv-importer" className="cursor-pointer">
                            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4 text-primary" />}
                            {isAnalyzing ? 'Analyse...' : 'Importer'}
                            <input type="file" id="csv-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }} className="rounded-xl font-bold shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Nouveau
                    </Button>
                </div>
            </PageHeader>

            <CustomerStats />

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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 min-w-[140px] font-medium">
                                <Users className="mr-2 h-4 w-4 opacity-50" />
                                {filterStatus === 'all' ? 'Tous les clients' : filterStatus === 'has_debt' ? 'Avec une dette' : filterStatus === 'overdue' ? 'Retard de paiement' : filterStatus === 'over_limit' ? 'Plafond dépassé' : 'Clients de Pain'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrer par Statut</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={filterStatus === 'all'} onCheckedChange={() => setFilterStatus('all')}>Tous les clients</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterStatus === 'has_debt'} onCheckedChange={() => setFilterStatus('has_debt')}>Avec une dette</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterStatus === 'overdue'} onCheckedChange={() => setFilterStatus('overdue')}>En retard de paiement</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterStatus === 'over_limit'} onCheckedChange={() => setFilterStatus('over_limit')}>Plafond dépassé</DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={filterStatus === 'is_bread_client'} onCheckedChange={() => setFilterStatus('is_bread_client')}>
                                <Wheat className="mr-2 h-3 w-3 text-primary" /> Clients de Pain
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 font-medium min-w-[140px]">
                                <SortAsc className="mr-2 h-4 w-4 opacity-50" />
                                {sortOptions[sortBy]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trier par</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key} className="text-xs font-bold">{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {isFiltered && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10"
                            onClick={resetFilters}
                            title="Réinitialiser"
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}

                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-11 w-11 rounded-xl border-none shadow-sm bg-card"
                        onClick={fetchCustomers}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedCustomers.size > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-primary/10 border border-primary/20 rounded-2xl p-4 animate-in slide-in-from-top-2 shadow-inner">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="select-all-customers"
                            checked={!isLoading && customers && customers.length > 0 && selectedCustomers.size === customers.length}
                            onCheckedChange={handleToggleSelectAll}
                            className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                        />
                        <label htmlFor="select-all-customers" className="text-xs font-black text-primary uppercase tracking-widest">
                            {selectedCustomers.size} client(s) sélectionné(s)
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)} className="rounded-xl shadow-lg shadow-destructive/20 font-bold">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </Button>
                    </div>
                </div>
            )}
            
            <div className="min-h-[450px] animate-in fade-in duration-500">
               {renderContent()}
            </div>

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
