'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PackagePlus, Tag, ShoppingBag, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { productService } from '@/services/product.service';
import { useCartActions } from '@/stores/cartStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomItemDialog } from './CustomItemDialog';
import { cn } from '@/lib/utils';

const SearchResultItem = ({ product, onSelect }: { product: Product, onSelect: (product: Product) => void }) => {
    return (
        <div
            onClick={() => onSelect(product)}
            className="group relative flex flex-col justify-between p-4 cursor-pointer bg-muted/20 border border-white/5 rounded-2xl transition-all duration-300 hover:bg-primary/5 hover:border-primary/20 hover:shadow-lg active:scale-95 overflow-hidden"
        >
            <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <ShoppingBag className="h-16 w-16" />
            </div>
            
            <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-1">
                    {product.category || 'Général'}
                </p>
                <p className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                </p>
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground">Stock: {product.quantity}</span>
                    <span className="text-lg font-black text-primary tracking-tighter">{formatCurrency(product.price)}</span>
                </div>
                <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <PackagePlus className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
};

export function ProductSelector() {
    const { addItemToCart } = useCartActions();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 200);

    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch search results when query changes
    useEffect(() => {
        if (!debouncedSearchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const fetchSearchResults = async () => {
            setIsSearching(true);
            try {
                const data = await productService.filterProducts({ query: debouncedSearchQuery });
                // Limit to 5 results as requested
                setSearchResults(data.slice(0, 5));
            } catch (e) {
                console.error("Search error:", e);
            } finally {
                setIsSearching(false);
            }
        };
        fetchSearchResults();
    }, [debouncedSearchQuery]);

    const handleSelect = (product: Product) => {
        addItemToCart(product);
        setSearchQuery('');
        setSearchResults([]);
    };
    
    const isActiveSearch = searchQuery.trim().length > 0;

    return (
        <div className="flex flex-col h-full bg-card/40 backdrop-blur-xl luxury-card rounded-[2.5rem] overflow-hidden border-white/5">
            <div className="p-6 bg-muted/30 border-b border-white/5 flex gap-3 items-center">
                <div className="relative flex-grow">
                    <Search className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
                        isActiveSearch ? "text-primary" : "text-muted-foreground/30"
                    )} />
                    <Input
                        id="sell-search-input"
                        placeholder="Rechercher un produit [F1]..."
                        className="pl-12 text-base h-14 rounded-2xl bg-background border-none shadow-inner focus-visible:ring-primary/20 font-bold"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                    />
                    {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                    )}
                </div>
                <CustomItemDialog>
                    <Button 
                        id="sell-custom-item-button" 
                        variant="outline" 
                        className="h-14 w-14 flex-shrink-0 rounded-2xl border-none bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm" 
                        aria-label="Article Personnalisé"
                    >
                        <Tag className="h-6 w-6"/>
                    </Button>
                </CustomItemDialog>
            </div>

            <ScrollArea className="flex-grow p-6">
                {!isActiveSearch ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in duration-700">
                        <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 shadow-inner">
                            <Search className="h-12 w-12 text-primary/20" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Prêt pour la recherche</p>
                            <p className="text-sm font-medium text-muted-foreground/30 italic">Tapez le nom ou scannez un code-barres</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                Résultats de recherche
                            </h3>
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">Max 5 produits</span>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 animate-in slide-in-from-bottom-2 duration-500">
                                {searchResults.map(product => (
                                    <SearchResultItem 
                                        key={product.uuid} 
                                        product={product} 
                                        onSelect={handleSelect} 
                                    />
                                ))}
                            </div>
                        ) : !isSearching && (
                            <div className="py-12 text-center space-y-2 bg-destructive/5 rounded-[2rem] border border-dashed border-destructive/20 animate-in zoom-in-95">
                                <p className="text-sm font-bold text-destructive/70">Aucun produit trouvé</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Vérifiez l'orthographe ou le code-barres</p>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}