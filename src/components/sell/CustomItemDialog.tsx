'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCartActions } from '@/stores/cartStore';
import type { Product } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export function CustomItemDialog({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addItemToCart } = useCartActions();

    const handleAdd = () => {
        const priceNum = parseFloat(price);
        if (!name.trim() || isNaN(priceNum) || priceNum <= 0) {
            toast.error("Veuillez entrer un nom et un prix valide.");
            return;
        }

        setIsLoading(true);

        const customProduct: Product = {
            uuid: `custom-${uuidv4()}`,
            name: name.trim(),
            price: priceNum,
            purchasePrice: 0,
            quantity: Infinity, // Custom items don't have stock
            minStockLevel: 0,
            category: 'Personnalisé',
            unite: 'Pièce',
        };

        addItemToCart(customProduct);
        
        toast.success(`"${name.trim()}" ajouté au panier.`);
        setIsLoading(false);
        setIsOpen(false); // Close dialog on success
    };

    // Reset form when dialog is closed
    const onOpenChange = (open: boolean) => {
        if (!open) {
            setName('');
            setPrice('');
        }
        setIsOpen(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter un article personnalisé</DialogTitle>
                    <DialogDescription>
                       Créez un article temporaire avec un nom et un prix personnalisés. Cet article ne sera pas sauvegardé dans votre inventaire.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="custom-name">Nom de l'article</Label>
                        <Input id="custom-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="custom-price">Prix de vente (DA)</Label>
                        <Input id="custom-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleAdd() }} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button onClick={handleAdd} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ajouter au panier
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}