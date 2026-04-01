'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PackagePlus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { productService } from '@/services/product.service';
import { useCartActions } from '@/stores/cartStore';

export function ProductSearch() {
    const { addItemToCart } = useCartActions();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 200);

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!debouncedSearchQuery) {
            setProducts([]);
            return;
        }
        
        const fetchProducts = async () => {
            setIsLoading(true);
            const data = await productService.filterProducts({ query: debouncedSearchQuery });
            setProducts(data);
            setIsLoading(false);
        };
        fetchProducts();
    }, [debouncedSearchQuery]);

    const handleSelect = (product: Product) => {
        addItemToCart(product);
        setSearchQuery('');
        setProducts([]);
    };
    
    return (
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                placeholder="Rechercher un produit par nom ou code-barres..."
                className="pl-12 text-base h-14"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {debouncedSearchQuery && (
                 <div className="absolute top-full mt-2 w-full z-10 bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-muted-foreground">Recherche...</div>
                    ) : products.length > 0 ? (
                        products.map(product => (
                             <div 
                                key={product.uuid} 
                                className="flex items-center gap-4 p-3 hover:bg-accent cursor-pointer"
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
            )}
        </div>
    );
}
