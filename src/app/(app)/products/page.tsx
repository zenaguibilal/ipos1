
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, Supplier, ProductImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, LayoutGrid, List, Printer, Trash2, PackageCheck, PackageX, AlertTriangle, Archive, SortAsc, FileDown, Building, Package, Loader2, CalendarClock, CalendarX, FileUp, FilterX, RefreshCw } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { ProductTable } from '@/components/products/product-table';
import { ProductTableSkeleton } from '@/components/products/product-table-skeleton';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { DeleteMultipleProductsDialog } from '@/components/products/DeleteMultipleProductsDialog';
import { PrintLabelsDialog } from '@/components/products/PrintLabelsDialog';
import { InventoryStats } from '@/components/products/InventoryStats';
import { ProductImportPreviewDialog } from '@/components/products/ProductImportPreviewDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { productService } from '@/services/product.service';
import { supplierService } from '@/services/supplier.service';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';

const stockStatusOptions: { value: StockStatus, label: string, icon: React.ElementType }[] = [
    { value: 'all', label: 'Tous les statuts', icon: Archive },
    { value: 'in_stock', label: 'En Stock', icon: PackageCheck },
    { value: 'low_stock', label: 'Stock Faible', icon: AlertTriangle },
    { value: 'out_of_stock', label: 'En Rupture', icon: PackageX },
    { value: 'expiring_soon', label: 'Expire Bientôt', icon: CalendarClock },
    { value: 'expired', label: 'Expiré', icon: CalendarX },
];

const sortOptions: { [key: string]: string } = {
    'name_asc': 'Nom (A-Z)',
    'name_desc': 'Nom (Z-A)',
    'price_desc': 'Prix (décroissant)',
    'price_asc': 'Prix (croissant)',
    'quantity_desc': 'Stock (décroissant)',
    'quantity_asc': 'Stock (croissant)',
    'createdAt_desc': 'Plus récents',
    'createdAt_asc': 'Plus anciens',
    'dateExpiration_asc': 'Date d\'expiration (proche)',
};

export default function ProductsPage() {
    const searchParams = useSearchParams();
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.productViewMode,
        setViewMode: state.actions.setProductViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [stockStatus, setStockStatus] = useState<StockStatus>('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');

    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [products, setProducts] = useState<Product[] | undefined>(undefined);
    const [categories, setCategories] = useState<string[] | undefined>(undefined);
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const isLoading = products === undefined || categories === undefined || suppliers === undefined;
    
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ProductImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const stockStatusFromQuery = searchParams.get('stockStatus') as StockStatus;
        if (stockStatusFromQuery && ['all', 'in_stock', 'low_stock', 'out_of_stock', 'expiring_soon', 'expired'].includes(stockStatusFromQuery)) {
            setStockStatus(stockStatusFromQuery);
        }
        const queryFromUrl = searchParams.get('query');
        if (queryFromUrl) {
            setSearchQuery(queryFromUrl);
        }
    }, [searchParams]);

    const fetchProducts = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await productService.filterProducts({ 
                query: debouncedSearchQuery, 
                category: selectedCategory, 
                supplierUuid: selectedSupplier,
                stockStatus, 
                sortBy 
            });
            setProducts(data);
        } catch(error: any) {
            toast.error("Impossible de charger les produits.");
            setProducts([]);
        } finally {
            setIsRefreshing(false);
        }
    }, [debouncedSearchQuery, selectedCategory, selectedSupplier, stockStatus, sortBy]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const fetchMeta = useCallback(async () => {
        try {
            const [cats, sups] = await Promise.all([
                productService.getCategories(),
                supplierService.getSuppliers()
            ]);
            setCategories(cats);
            setSuppliers(sups);
        } catch(error: any) {
            setCategories([]);
            setSuppliers([]);
        }
    }, []);

    useEffect(() => {
        fetchMeta();
    }, [fetchMeta]);
    
    useEffect(() => {
        setSelectedProducts(new Set());
    }, [products]);

    const onDialogSuccess = () => {
        fetchProducts();
        fetchMeta();
    }

    const handleEditProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsProductDialogOpen(true);
    }, []);

    const handleToggleSelection = useCallback((productUuid: string) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productUuid)) {
                newSet.delete(productUuid);
            } else {
                newSet.add(productUuid);
            }
            return newSet;
        });
    }, []);
    
    const handleToggleSelectAll = useCallback(() => {
        if (!products) return;
        if (selectedProducts.size === products.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(products.map(p => p.uuid)));
        }
    }, [products, selectedProducts.size]);

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const analysis = await productService.analyzeImport(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur d'analyse CSV", { description: error.message });
        } finally {
            setIsAnalyzing(false);
            e.target.value = ''; 
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await productService.executeImport(confirmedData);
            toast.success("Importation réussie.");
            setIsImportPreviewOpen(false);
            setImportAnalysis(null);
            onDialogSuccess();
        } catch (error: any) {
            toast.error("Échec de l'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportCsv = () => {
        if (!products || products.length === 0) {
            toast.error("Aucun produit à exporter.");
            return;
        }

        const csv = Papa.unparse(products.map(p => ({
            Désignation: p.name,
            Catégorie: p.category,
            Prix_Vente: p.price,
            Prix_Achat: p.purchasePrice,
            Stock: p.quantity,
            Unité: p.unite,
            Codes_Barres: p.barcodes?.join('|'),
            Stock_Minimum: p.minStockLevel,
            Date_Expiration: p.dateExpiration ? new Date(p.dateExpiration).toLocaleDateString() : '',
        })));

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ipos-produits-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Exportation terminée.");
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedSupplier('all');
        setStockStatus('all');
        setSortBy('createdAt_desc');
    };

    const isFiltered = searchQuery !== '' || selectedCategory !== 'all' || selectedSupplier !== 'all' || stockStatus !== 'all' || sortBy !== 'createdAt_desc';
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-card border-none animate-pulse p-4 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between mt-auto">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return viewMode === 'grid' ? renderSkeletons() : <ProductTableSkeleton />;
        }

        if (!products || products.length === 0) {
            return (
                <EmptyState
                    icon={Package}
                    title="Aucun produit trouvé"
                    description={isFiltered ? "Essayez d'ajuster vos filtres ou de réinitialiser la recherche." : "Commenceز par ajouter votre premier produit."}
                >
                    <div className="flex gap-2 justify-center">
                        {isFiltered && <Button variant="outline" onClick={resetFilters}><FilterX className="mr-2 h-4 w-4" /> Effacer</Button>}
                        <Button onClick={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Ajouter un produit</Button>
                    </div>
                </EmptyState>
            );
        }
        
        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {products.map(p => (
                        <ProductCard 
                            key={p.uuid} 
                            product={p} 
                            onEdit={handleEditProduct} 
                            onDelete={() => {
                                setSelectedProduct(p);
                                setIsDeleteDialogOpen(true);
                            }}
                            isSelected={selectedProducts.has(p.uuid)}
                            onToggleSelection={() => handleToggleSelection(p.uuid)}
                        />
                    ))}
                </div>
            );
        }

        return (
            <ProductTable 
                products={products}
                onEdit={handleEditProduct}
                onDelete={(p) => {
                    setSelectedProduct(p);
                    setIsDeleteDialogOpen(true);
                }}
                selectedProducts={selectedProducts}
                onToggleProductSelection={handleToggleSelection}
                onToggleSelectAll={handleToggleSelectAll}
                suppliers={suppliers || []}
            />
        );
    }

    const currentStockStatusOption = stockStatusOptions.find(o => o.value === stockStatus)!;

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
            <PageHeader
                title="Gestion de l'Inventaire"
                description="Contrôlez vos produits et vos stocks avec précision."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCsv} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button asChild variant="outline" disabled={isAnalyzing} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <label htmlFor="csv-product-importer" className="cursor-pointer">
                            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4 text-primary" />}
                            {isAnalyzing ? 'Analyse...' : 'Importer'}
                            <input type="file" id="csv-product-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button onClick={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }} className="rounded-xl font-bold shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Nouveau
                    </Button>
                </div>
            </PageHeader>

            <InventoryStats products={products} isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                        placeholder="Rechercher par nom أو code-barres..."
                        className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 min-w-[140px] font-medium">
                                <Archive className="mr-2 h-4 w-4 opacity-50" />
                                {selectedCategory === 'all' ? 'Tous les Rayons' : selectedCategory}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px] max-h-80 overflow-y-auto custom-scrollbar">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrer par Catégorie</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={selectedCategory === 'all'} onCheckedChange={() => setSelectedCategory('all')}>Toutes les catégories</DropdownMenuCheckboxItem>
                            {categories?.map(cat => (
                                <DropdownMenuCheckboxItem key={cat} checked={selectedCategory === cat} onCheckedChange={() => setSelectedCategory(cat)}>{cat}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 min-w-[140px] font-medium">
                                <Building className="mr-2 h-4 w-4 opacity-50" />
                                {selectedSupplier === 'all' ? 'Tous les Moteurs' : suppliers?.find(s => s.uuid === selectedSupplier)?.name}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px] max-h-80 overflow-y-auto custom-scrollbar">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrer par Fournisseur</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={selectedSupplier === 'all'} onCheckedChange={() => setSelectedSupplier('all')}>Tous les fournisseurs</DropdownMenuCheckboxItem>
                            {suppliers?.map(sup => (
                                <DropdownMenuCheckboxItem key={sup.uuid} checked={selectedSupplier === sup.uuid} onCheckedChange={() => setSelectedSupplier(sup.uuid)}>{sup.name}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 min-w-[140px] font-medium">
                                <currentStockStatusOption.icon className="mr-2 h-4 w-4 opacity-50" />
                                {currentStockStatusOption.label}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">État du Stock</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {stockStatusOptions.map(option => (
                                <DropdownMenuCheckboxItem
                                    key={option.value}
                                    checked={stockStatus === option.value}
                                    onCheckedChange={() => setStockStatus(option.value)}
                                >
                                    <option.icon className="mr-2 h-4 w-4 opacity-50" />
                                    {option.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 font-medium">
                                <SortAsc className="mr-2 h-4 w-4 opacity-50" />
                                {sortOptions[sortBy]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trier par</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key} className="text-xs">{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                    
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-11 w-11 rounded-xl border-none shadow-sm bg-card"
                        onClick={fetchProducts}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedProducts.size > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-primary/10 border border-primary/20 rounded-2xl p-4 animate-in slide-in-from-top-2 shadow-inner">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="select-all"
                            checked={!isLoading && products && products.length > 0 && selectedProducts.size === products.length}
                            onCheckedChange={handleToggleSelectAll}
                            className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                        />
                        <label htmlFor="select-all" className="text-xs font-black text-primary uppercase tracking-widest">
                            {selectedProducts.size} sélectionné(s)
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsPrintDialogOpen(true)} className="rounded-xl bg-background border-none shadow-sm font-bold">
                            <Printer className="mr-2 h-4 w-4 text-primary" /> Étiquettes
                        </Button>
                        <Button variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)} className="rounded-xl shadow-lg shadow-destructive/20 font-bold">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </Button>
                    </div>
                </div>
            )}
            
            <div className="min-h-[450px]">
               {renderContent()}
            </div>

            <>
                <ProductDialog 
                    isOpen={isProductDialogOpen}
                    onOpenChange={setIsProductDialogOpen}
                    product={selectedProduct}
                    categories={categories || []}
                    suppliers={suppliers || []}
                    onSuccess={onDialogSuccess}
                />
                <DeleteProductDialog 
                    isOpen={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    product={selectedProduct}
                    onSuccess={fetchProducts}
                />
                <PrintLabelsDialog
                    isOpen={isPrintDialogOpen}
                    onOpenChange={setIsPrintDialogOpen}
                    productUuids={Array.from(selectedProducts)}
                />
                 <DeleteMultipleProductsDialog
                    isOpen={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    productUuids={Array.from(selectedProducts)}
                    onSuccess={() => {
                        setSelectedProducts(new Set());
                        fetchProducts();
                    }}
                />
                 <ProductImportPreviewDialog
                    isOpen={isImportPreviewOpen}
                    onOpenChange={setIsImportPreviewOpen}
                    analysis={importAnalysis}
                    onConfirm={handleConfirmImport}
                    isImporting={isImporting}
                />
            </>
        </div>
    );
}
