'use client';

import React, { useState, useEffect, useDeferredValue } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PackagePlus, ShoppingBag, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { productService } from '@/services/product.service';
import { useCartActions } from '@/stores/cartStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomItemDialog } from './CustomItemDialog';

const SearchResultItem = React.memo(({ product, onSelect }: { product: Product, onSelect: (p: Product) => void }) => {
    return (
        <div
            onClick={() => onSelect(product)}
            className="group relative flex flex-col justify-between p-1.5 cursor-pointer bg-white border border-transparent rounded-lg transition-all duration-300 hover:bg-primary/10 hover:border-primary/20 active:scale-95 overflow-hidden shadow-sm"
        >
            <div className="relative z-10">
                <p className="text-[9px] font-black leading-tight tracking-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">{product.name}</p>
                <div className="flex items-center gap-1">
                    <span className="px-1 py-0.5 rounded bg-primary/5 text-primary text-[6px] font-black uppercase tracking-tight">
                        {product.category || 'Standard'}
                    </span>
                </div>
            </div>

            <div className="relative z-10 mt-1.5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[6px] font-bold text-muted-foreground/40 uppercase">Stock: {product.quantity}</span>
                    <span className="text-[10px] font-black text-primary tracking-tighter">{formatCurrency(product.price)}</span>
                </div>
                <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white">
                    <PackagePlus className="h-3 w-3" />
                </div>
            </div>
        </div>
    );
});
SearchResultItem.displayName = 'SearchResultItem';

export function ProductSelector({ searchInputRef, customItemButtonRef }: { searchInputRef: any, customItemButtonRef: any }) {
    const { addItemToCart } = useCartActions();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 150);
    const deferredResults = useDeferredValue(debouncedSearchQuery);

    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!deferredResults.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        productService.filterProducts({ query: deferredResults })
            .then(data => setSearchResults(data.slice(0, 48))) // High density density
            .finally(() => setIsSearching(false));
    }, [deferredResults]);

    const handleSelect = (product: Product) => {
        addItemToCart(product);
        setSearchQuery('');
        setSearchResults([]);
        setTimeout(() => searchInputRef.current?.focus(), 0);
    };

    return (
        <div className="flex flex-col h-full bg-white/20 backdrop-blur-md rounded-xl overflow-hidden border shadow-sm">
            <div className="p-2 bg-muted/20 border-b flex gap-2 items-center shrink-0">
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                    <Input
                        ref={searchInputRef}
                        placeholder="Recherche [F1]..."
                        className="pl-8 h-8 rounded-lg bg-background border-none shadow-inner font-black text-[10px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <CustomItemDialog>
                    <Button ref={customItemButtonRef} variant="outline" className="h-8 w-8 rounded-lg border-none bg-primary/5 hover:bg-primary/10 text-primary p-0">
                        <ShoppingBag className="h-4 w-4" />
                    </Button>
                </CustomItemDialog>
            </div>

            <ScrollArea className="flex-grow p-2">
                {!searchQuery.trim() ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 opacity-10 space-y-2">
                        <Sparkles className="h-6 w-6" />
                        <p className="text-[7px] font-black uppercase tracking-[0.3em]">Scanner / Search Protocol</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 xl:grid-cols-4 gap-1.5 animate-in fade-in duration-300">
                        {searchResults.map(p => <SearchResultItem key={p.uuid} product={p} onSelect={handleSelect} />)}
                        {searchResults.length === 0 && !isSearching && (
                            <div className="col-span-full py-12 text-center text-[8px] font-black uppercase opacity-20">Aucun résultat identifié</div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
