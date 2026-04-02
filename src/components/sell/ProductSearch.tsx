'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PackagePlus, Tag, ShoppingBag, Loader2, Sparkles } from 'lucide-react';
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
            className="group relative flex flex-col justify-between p-5 cursor-pointer bg-card/40 backdrop-blur-md border border-white/5 rounded-[2rem] transition-all duration-500 hover:bg-primary/10 hover:border-primary/30 hover:shadow-2xl active:scale-95 overflow-hidden"
        >
            {/* Background Accent */}
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                <ShoppingBag className="h-24 w-24 rotate-12" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.2em] border border-primary/20">
                        {product.category || 'Général'}
                    </span>
                    {product.quantity <= product.minStockLevel && (
                        <span className="px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive text-[8px] font-black uppercase tracking-[0.2em] border border-destructive/20 animate-pulse">
                            Stock Faible
                        </span>
                    )}
                </div>
                <p className="text-base font-black leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                </p>
            </div>

            <div className="relative z-10 mt-6 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Stock: {product.quantity}</span>
                    <span className="text-xl font-black text-primary tracking-tighter">{formatCurrency(product.price)}</span>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                    <PackagePlus className="h-5 w-5" />
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

    // Fetch search results only when query is NOT empty
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
        <div className="flex flex-col h-full bg-card/20 backdrop-blur-3xl luxury-card rounded-[2.5rem] overflow-hidden border-white/5">
            {/* Search Header */}
            <div className="p-6 bg-muted/20 border-b border-white/5 flex gap-4 items-center">
                <div className="relative flex-grow">
                    <Search className={cn(
                        "absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-500",
                        isActiveSearch ? "text-primary scale-110" : "text-muted-foreground/30"
                    )} />
                    <Input
                        id="sell-search-input"
                        placeholder="Rechercher un produit [F1]..."
                        className="pl-14 text-lg h-16 rounded-3xl bg-background/50 border-none shadow-inner focus-visible:ring-primary/20 font-black tracking-tight"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                    />
                    {isSearching && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    )}
                </div>
                <CustomItemDialog>
                    <Button 
                        id="sell-custom-item-button" 
                        variant="outline" 
                        className="h-16 w-16 flex-shrink-0 rounded-3xl border-none bg-primary/5 hover:bg-primary/20 hover:text-primary transition-all shadow-xl group" 
                        aria-label="Article Personnalisé"
                    >
                        <Tag className="h-6 w-6 transition-transform group-hover:scale-110 group-hover:-rotate-12"/>
                    </Button>
                </CustomItemDialog>
            </div>

            {/* Results Area */}
            <ScrollArea className="flex-grow p-8">
                {!isActiveSearch ? (
                    <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                            <div className="relative p-8 rounded-[2.5rem] bg-card/40 border border-white/5 shadow-2xl">
                                <Search className="h-14 w-14 text-primary/30" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Mode Attente</p>
                            <p className="text-base font-medium text-muted-foreground/30 italic max-w-[200px] mx-auto leading-relaxed">
                                Tapez le nom du produit pour commencer la recherche.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                                <Sparkles className="h-3 w-3 text-primary animate-bounce" />
                                Sélection Elite
                            </h3>
                            <span className="px-3 py-1 rounded-full bg-muted/50 text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest border border-white/5">
                                Top 5 Résultats
                            </span>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-4 duration-700">
                                {searchResults.map(product => (
                                    <SearchResultItem 
                                        key={product.uuid} 
                                        product={product} 
                                        onSelect={handleSelect} 
                                    />
                                ))}
                            </div>
                        ) : !isSearching && (
                            <div className="py-20 text-center space-y-4 bg-destructive/5 rounded-[3rem] border border-dashed border-destructive/20 animate-in zoom-in-95 duration-500">
                                <div className="p-4 rounded-2xl bg-destructive/10 w-fit mx-auto">
                                    <ShoppingBag className="h-10 w-10 text-destructive/40" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-black text-destructive/70 tracking-tight">Aucun produit trouvé</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Vérifiez l'orthographe ou le code-barres</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
