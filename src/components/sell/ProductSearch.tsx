'use client';

import React, { useState, useEffect, useDeferredValue, forwardRef, useImperativeHandle, useRef } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { productService } from '@/services/product.service';
import { useCartActions } from '@/stores/cartStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomItemDialog } from './CustomItemDialog';
import { cn } from '@/lib/utils';

const SearchResultItem = React.memo(({ product, onSelect }: { product: Product, onSelect: (p: Product) => void }) => {
    return (
        <div
            onClick={() => onSelect(product)}
            className="group relative flex flex-col justify-between p-5 cursor-pointer bg-card/40 backdrop-blur-md border border-white/5 rounded-lg transition-all duration-500 hover:bg-primary/10 hover:border-primary/30 hover:shadow-sm active:scale-95 overflow-hidden"
        >
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                <ShoppingBag className="h-24 w-24 rotate-12" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[8px] font-semibold uppercase border border-primary/20">
                        {product.category || 'Elite Catalog'}
                    </span>
                    {product.quantity <= product.minStockLevel && (
                        <span className="px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive text-[8px] font-semibold uppercase border border-destructive/20 animate-pulse">
                            Critical Stock
                        </span>
                    )}
                </div>
                <p className="text-base font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                </p>
            </div>

            <div className="relative z-10 mt-6 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground opacity-50">Stock: {product.quantity} {product.unite}</span>
                    <span className="text-xl font-semibold text-primary tracking-tighter">{formatCurrency(product.price)}</span>
                </div>
            </div>
        </div>
    );
});
SearchResultItem.displayName = 'SearchResultItem';

export const ProductSelector = forwardRef<{ focusInput: () => void }, any>((_, ref) => {
    const { addItemToCart } = useCartActions();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 150);
    const deferredResults = useDeferredValue(debouncedSearchQuery);

    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focusInput: () => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }));

    useEffect(() => {
        if (!deferredResults.trim()) {
            setSearchResults([]);
            setSearchError(null);
            return;
        }

        const controller = new AbortController();
        
        const fetchSearchResults = async () => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const data = await productService.filterProducts({ query: deferredResults });
                if (!controller.signal.aborted) {
                    setSearchResults(data.slice(0, 15));
                }
            } catch (e: any) {
                if (!controller.signal.aborted) {
                    setSearchError("Moteur de recherche indisponible.");
                }
            } finally {
                if (!controller.signal.aborted) setIsSearching(false);
            }
        };

        fetchSearchResults();
        return () => controller.abort();
    }, [deferredResults]);

    const handleSelect = (product: Product) => {
        addItemToCart(product);
        setSearchQuery('');
        setSearchResults([]);
        setTimeout(() => inputRef.current?.focus(), 0);
    };
    
    const isActiveSearch = searchQuery.trim().length > 0;

    return (
        <div className="flex flex-col h-full bg-card/20 backdrop-blur-sm app-card rounded-lg overflow-hidden border-white/5 shadow-sm">
            <div className="p-6 bg-muted/20 border-b border-white/5 flex gap-4 items-center">
                <div className="relative flex-grow group">
                    <Search className={cn(
                        "absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-500",
                        isActiveSearch ? "text-primary scale-110" : "text-muted-foreground/30"
                    )} />
                    <Input
                        ref={inputRef}
                        placeholder="Scanner ou rechercher [F3]..."
                        className="pl-14 text-lg h-9 rounded-3xl bg-background/50 border-none shadow-inner focus-visible:ring-primary/20 font-semibold tracking-tight"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchResults.length > 0) {
                                handleSelect(searchResults[0]);
                            }
                        }}
                    />
                    {isSearching && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary opacity-40" />
                        </div>
                    )}
                </div>
                <CustomItemDialog>
                    <Button 
                        variant="outline" 
                        className="h-9 w-16 flex-shrink-0 rounded-3xl border-none bg-primary/5 hover:bg-primary/20 hover:text-primary transition-all shadow-xl group" 
                    >
                        <ShoppingBag className="h-6 w-6 transition-transform group-hover:scale-110 group-hover:-rotate-12"/>
                    </Button>
                </CustomItemDialog>
            </div>

            <ScrollArea className="flex-grow p-4">
                {searchError ? (
                    <div className="py-20 text-center space-y-4 bg-destructive/5 rounded-lg border border-dashed border-destructive/20 animate-in zoom-in-95">
                        <AlertCircle className="h-10 w-10 text-destructive mx-auto opacity-40" />
                        <p className="text-xs font-semibold uppercase text-destructive/70 tracking-wide">{searchError}</p>
                    </div>
                ) : !isActiveSearch ? (
                    <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-6">
                        <div className="relative p-4 rounded-lg bg-card/40 border border-white/5 shadow-inner">
                            <Search className="h-14 w-14 text-primary/20" />
                        </div>
                        <p className="text-sm font-semibold uppercase text-muted-foreground/20 max-w-[250px] mx-auto leading-relaxed">
                            Prêt pour le scan [F3]. Saisissez une référence ou utilisez le lecteur.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-semibold uppercase text-primary flex items-center gap-3">
                                <Sparkles className="h-3 w-3 text-primary" />
                                Résultats Indexés
                            </h3>
                            <span className="text-[9px] font-semibold text-muted-foreground/30 uppercase">{searchResults.length} Trouvés</span>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {searchResults.map(product => (
                                    <SearchResultItem key={product.uuid} product={product} onSelect={handleSelect} />
                                ))}
                            </div>
                        ) : !isSearching && (
                            <div className="py-20 text-center space-y-4 opacity-20 flex flex-col items-center">
                                <ShoppingBag className="h-12 w-12 mb-2" />
                                <p className="text-[10px] font-semibold uppercase ">Néant. Produit non répertorié.</p>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
});
ProductSelector.displayName = "ProductSelector";
