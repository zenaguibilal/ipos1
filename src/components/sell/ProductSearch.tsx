'use client';

import React, { useState, useEffect, useDeferredValue } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PackagePlus, ShoppingBag, Loader2, Sparkles } from 'lucide-react';
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
            className="group relative flex flex-col justify-between p-3 cursor-pointer bg-white/40 border border-white/5 rounded-xl transition-all duration-300 hover:bg-primary/10 hover:border-primary/20 active:scale-95 overflow-hidden"
        >
            <div className="relative z-10">
                <div className="flex items-center gap-1 mb-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-primary/5 text-primary text-[7px] font-black uppercase tracking-tight border border-primary/10">
                        {product.category || 'Standard'}
                    </span>
                </div>
                <p className="text-xs font-black leading-tight tracking-tight line-clamp-1">{product.name}</p>
            </div>

            <div className="relative z-10 mt-3 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[7px] font-bold text-muted-foreground/40 uppercase">Stock: {product.quantity}</span>
                    <span className="text-sm font-black text-primary tracking-tighter">{formatCurrency(product.price)}</span>
                </div>
                <div className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center transition-all group-hover:scale-110">
                    <PackagePlus className="h-4 w-4" />
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
            .then(data => setSearchResults(data.slice(0, 24)))
            .finally(() => setIsSearching(false));
    }, [deferredResults]);

    const handleSelect = (product: Product) => {
        addItemToCart(product);
        setSearchQuery('');
        setSearchResults([]);
        setTimeout(() => searchInputRef.current?.focus(), 0);
    };

    return (
        <div className="flex flex-col h-full bg-white/20 backdrop-blur-md rounded-lg overflow-hidden border shadow-sm">
            <div className="p-2 bg-muted/20 border-b flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                    <Input
                        ref={searchInputRef}
                        placeholder="Scan / Search [F1]..."
                        className="pl-9 h-9 rounded-lg bg-background/50 border-none shadow-inner font-black text-xs"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <CustomItemDialog>
                    <Button ref={customItemButtonRef} variant="outline" className="h-9 w-9 rounded-lg border-none bg-primary/5 hover:bg-primary/10 text-primary p-0">
                        <ShoppingBag className="h-4 w-4" />
                    </Button>
                </CustomItemDialog>
            </div>

            <ScrollArea className="flex-grow p-2">
                {!searchQuery.trim() ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 opacity-10 space-y-2">
                        <Sparkles className="h-8 w-8" />
                        <p className="text-[8px] font-black uppercase tracking-[0.3em]">Scanner Protocole</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-300">
                        {searchResults.map(p => <SearchResultItem key={p.uuid} product={p} onSelect={handleSelect} />)}
                        {searchResults.length === 0 && !isSearching && (
                            <div className="col-span-2 py-12 text-center text-[8px] font-black uppercase opacity-20">Néant</div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
