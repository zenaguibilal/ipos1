'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, Supplier, ProductImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, Search, LayoutGrid, List, Archive, SortAsc, 
    Package, Loader2, FileUp, RefreshCw, X, FileDown 
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { ProductTable } from '@/components/products/product-table';
import { ProductTableSkeleton } from '@/components/products/product-table-skeleton';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { DeleteMultipleProductsDialog } from '@/components/products/DeleteMultipleProductsDialog';
import { PrintLabelsDialog } from '@/components/products/PrintLabelsDialog';
import { InventoryStats } from '@/components/products/InventoryStats';
import { ProductImportPreviewDialog } from '@/components/products/ProductImportPreviewDialog';
import { ProductHistoryDialog } from '@/components/products/ProductHistoryDialog';
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
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { productService } from '@/services/product.service';
import { supplierService } from '@/services/supplier.service';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useLiveQuery } from '@/hooks/useLiveQuery';

type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';

function ProductsContent() {
    const searchParams = useSearchParams();
    const viewMode = useAppStore(state => state.productViewMode);
    const setViewMode = useAppStore(state => state.actions.setProductViewMode);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [stockStatus, setStockStatus] = useState<StockStatus>('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');

    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const products = useLiveQuery(
        () => productService.filterProducts({ 
            query: debouncedSearchQuery, 
            category: selectedCategory, 
            supplierUuid: selectedSupplier,
            stockStatus, 
            sortBy 
        }),
        [debouncedSearchQuery, selectedCategory, selectedSupplier, stockStatus, sortBy]
    );

    const [categories, setCategories] = useState<string[] | undefined>(undefined);
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const isLoading = products === undefined || categories === undefined || suppliers === undefined;

    useEffect(() => {
        const statusFromQuery = searchParams.get('stockStatus') as StockStatus;
        if (statusFromQuery) setStockStatus(statusFromQuery);
    }, [searchParams]);

    const fetchMeta = useCallback(async () => {
        try {
            const [cats, sups] = await Promise.all([productService.getCategories(), supplierService.getSuppliers()]);
            setCategories(cats);
            setSuppliers(sups);
        } catch(error) {
            setCategories([]);
            setSuppliers([]);
        }
    }, []);

    useEffect(() => { fetchMeta(); }, [fetchMeta]);
    
    useEffect(() => { setSelectedProducts(new Set()); }, [stockStatus, selectedCategory, selectedSupplier, debouncedSearchQuery]);

    return (
        <div className="p-3 sm:p-4 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <PageHeader title="Inventaire" description="Gestion du catalogue">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchMeta()} className="h-8 px-2"><RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} /></Button>
                    <Button size="sm" onClick={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }} className="h-8 font-bold text-[10px] uppercase">Nouveau</Button>
                </div>
            </PageHeader>

            <InventoryStats isLoading={isLoading} />

            <div className="flex flex-col sm:flex-row gap-2 items-center bg-white/50 p-2 rounded-lg border shadow-sm">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                    <Input placeholder="Rechercher..." className="pl-8 h-8 text-xs bg-transparent border-none focus-visible:ring-0" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex gap-1 items-center overflow-x-auto w-full sm:w-auto shrink-0 pb-1 sm:pb-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold"><Archive className="mr-1.5 h-3 w-3" /> Rayon</Button></DropdownMenuTrigger>
                        <DropdownMenuContent className="text-xs">
                            <DropdownMenuCheckboxItem checked={selectedCategory === 'all'} onCheckedChange={() => setSelectedCategory('all')}>Tous</DropdownMenuCheckboxItem>
                            {categories?.map(c => <DropdownMenuCheckboxItem key={c} checked={selectedCategory === c} onCheckedChange={() => setSelectedCategory(c)}>{c}</DropdownMenuCheckboxItem>)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="h-4 w-px bg-border mx-1" />
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}><LayoutGrid className="h-3.5 w-3.5"/></Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5"/></Button>
                </div>
            </div>

            <div className="min-h-[400px]">
                {isLoading ? (
                    viewMode === 'grid' ? <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">{[...Array(12)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div> : <ProductTableSkeleton />
                ) : products.length === 0 ? (
                    <EmptyState icon={Package} title="Aucun produit" description="Le catalogue est vide." />
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-3">
                            {products.map(p => <ProductCard key={p.uuid} product={p} onEdit={() => { setSelectedProduct(p); setIsProductDialogOpen(true); }} onDuplicate={() => {}} onHistory={() => { setSelectedProduct(p); setIsHistoryDialogOpen(true); }} onDelete={() => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} isSelected={selectedProducts.has(p.uuid)} onToggleSelection={() => {}} isSelectionActive={false} />)}
                        </div>
                    ) : (
                        <ProductTable products={products} onEdit={(p) => { setSelectedProduct(p); setIsProductDialogOpen(true); }} onDuplicate={() => {}} onHistory={(p) => { setSelectedProduct(p); setIsHistoryDialogOpen(true); }} onDelete={(p) => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} selectedProducts={selectedProducts} onToggleProductSelection={() => {}} onToggleSelectAll={() => {}} suppliers={suppliers || []} />
                    )
                )}
            </div>

            <ProductDialog isOpen={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} product={selectedProduct} categories={categories || []} suppliers={suppliers || []} onSuccess={fetchMeta} />
            <DeleteProductDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} product={selectedProduct} onSuccess={fetchMeta} />
            <ProductHistoryDialog isOpen={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} product={selectedProduct} />
        </div>
    );
}

export default function ProductsPage() { return <Suspense><ProductsContent /></Suspense>; }