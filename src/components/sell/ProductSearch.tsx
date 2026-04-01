'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PackagePlus, Tag } from 'lucide-react';
import { formatCurrency, getPlaceholder } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { productService } from '@/services/product.service';
import { useCartActions } from '@/stores/cartStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Skeleton } from '../ui/skeleton';
import { CustomItemDialog } from './CustomItemDialog';

const QuickAddItem = ({ product, onSelect }: { product: Product, onSelect: (product: Product) => void }) => {
    const placeholder = getPlaceholder(product.category);
    const imageUrl = product.imageUrl || placeholder.url;

    return (
        <div
            onClick={() => onSelect(product)}
            className="relative group border rounded-lg flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:bg-accent hover:shadow-md transition-all duration-200 aspect-square"
        >
            <div className="absolute top-1 right-1 bg-background/80 text-primary font-bold text-xs px-1.5 py-0.5 rounded-full">{formatCurrency(product.price)}</div>
            <div className="relative w-16 h-16 mb-1">
                <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 10vw, (max-width: 1200px) 5vw, 5vw"
                />
            </div>
            <p className="text-xs font-semibold leading-tight line-clamp-2">{product.name}</p>
             <p className="text-[10px] text-muted-foreground">Stock: {product.quantity}</p>
        </div>
    );
};


export function ProductSelector() {
    const { addItemToCart } = useCartActions();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 200);

    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [gridProducts, setGridProducts] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isGridLoading, setIsGridLoading] = useState(true);

    // Fetch default grid products on mount
    useEffect(() => {
        const fetchGridProducts = async () => {
            setIsGridLoading(true);
            try {
                // Fetch most recent products
                const data = await productService.filterProducts({ sortBy: 'createdAt_desc' });
                setGridProducts(data.slice(0, 20)); // Show 20 most recent
            } catch (e) {
                // handle error in a real app
            } finally {
                setIsGridLoading(false);
            }
        };
        fetchGridProducts();
    }, []);

    // Fetch search results when query changes
    useEffect(() => {
        if (!debouncedSearchQuery) {
            setSearchResults([]);
            return;
        }

        const fetchSearchResults = async () => {
            setIsSearching(true);
            const data = await productService.filterProducts({ query: debouncedSearchQuery });
            setSearchResults(data);
            setIsSearching(false);
        };
        fetchSearchResults();
    }, [debouncedSearchQuery]);

    const handleSelect = (product: Product) => {
        addItemToCart(product);
        setSearchQuery('');
        setSearchResults([]);
    };
    
    const showSearchResults = !!debouncedSearchQuery;

    return (
        <div className="flex flex-col h-full bg-card border rounded-xl shadow-lg">
            <div className="p-4 border-b flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom ou code-barres..."
                        className="pl-12 text-base h-12"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <CustomItemDialog>
                    <Button variant="outline" className="h-12 w-12 flex-shrink-0" aria-label="Ajouter un article personnalisé">
                        <Tag className="h-5 w-5"/>
                    </Button>
                </CustomItemDialog>
            </div>
            <ScrollArea className="flex-grow">
                {showSearchResults ? (
                    <div className="p-2">
                        {isSearching ? (
                            <div className="p-4 text-center text-muted-foreground">Recherche...</div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(product => (
                                 <div 
                                    key={product.uuid} 
                                    className="flex items-center gap-4 p-3 hover:bg-accent cursor-pointer rounded-lg"
                                    onClick={() => handleSelect(product)}
                                >
                                    <div className="flex-grow">
                                        <p className="font-semibold">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Stock: {product.quantity} | {formatCurrency(product.price)}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="outline"><PackagePlus className="h-4 w-4 mr-2" /> Ajouter</Button>
                                </div>
                            ))
                        ) : (
                             <div className="p-4 text-center text-muted-foreground">Aucun produit trouvé.</div>
                        )}
                    </div>
                ) : (
                    <div className="p-4">
                        {isGridLoading ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {[...Array(10)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {gridProducts.map(p => <QuickAddItem key={p.uuid} product={p} onSelect={handleSelect} />)}
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
