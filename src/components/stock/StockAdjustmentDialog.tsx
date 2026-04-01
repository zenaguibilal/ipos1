'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ProductIntakeCombobox } from './ProductIntakeCombobox';
import type { Product } from '@/lib/types';
import { inventoryService } from '@/services/inventory.service';
import { toast } from 'sonner';
import { Loader2, ArrowUpDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StockAdjustmentDialog({ isOpen, onOpenChange, onSuccess }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [adjustment, setAdjustment] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleSave = async () => {
        const change = parseInt(adjustment);
        if (!selectedProduct) {
            toast.error("Veuillez sélectionner un produit.");
            return;
        }
        if (isNaN(change) || change === 0) {
            toast.error("Veuillez entrer une variation valide (ex: -5 ou +10).");
            return;
        }

        if (selectedProduct.quantity + change < 0) {
            toast.error("Le stock ne peut pas devenir négatif.");
            return;
        }

        setIsLoading(true);
        try {
            await inventoryService.adjustStock(selectedProduct.uuid, change, 'manual_adjustment');
            toast.success("Stock ajusté avec succès.");
            onSuccess();
            onOpenChange(false);
            resetForm();
        } catch (error: any) {
            toast.error("Erreur lors de l'ajustement.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedProduct(null);
        setAdjustment('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if(!open) resetForm(); }}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl">
                <DialogHeader className="bg-primary/5 -mx-6 -mt-6 p-6 border-b border-primary/10 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
                            <ArrowUpDown className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Correction Manuelle</DialogTitle>
                            <DialogDescription>Ajustez le stock sans facture (perte, don, correction...)</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">1. Choisir le Produit</Label>
                        <ProductIntakeCombobox 
                            onProductSelected={handleProductSelect}
                            onNewProductCreated={() => {}} // Disabled here
                        />
                    </div>

                    {selectedProduct && (
                        <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-4 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-sm font-bold">{selectedProduct.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Stock Actuel:</span>
                                    <span className="font-black px-2 py-0.5 bg-muted rounded-md">{selectedProduct.quantity}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adj-qty" className="text-xs font-bold text-muted-foreground ml-1">Variation (Quantité)</Label>
                                <div className="relative">
                                    <Input
                                        id="adj-qty"
                                        type="number"
                                        placeholder="Ex: -5 (Perte) ou +2 (Trouvé)"
                                        className="h-14 text-xl font-bold text-center rounded-xl bg-background shadow-inner"
                                        value={adjustment}
                                        onChange={(e) => setAdjustment(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs uppercase opacity-50">
                                        PCS
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-1">
                                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-[10px] text-muted-foreground">Utilisez le signe "-" pour les sorties (Pertes/Casses).</p>
                                </div>
                            </div>

                            {adjustment && parseInt(adjustment) !== 0 && (
                                <div className={cn(
                                    "p-3 rounded-xl border flex justify-between items-center transition-all",
                                    parseInt(adjustment) > 0 ? "bg-green-500/5 border-green-500/20 text-green-500" : "bg-destructive/5 border-destructive/20 text-destructive"
                                )}>
                                    <span className="text-xs font-bold">Stock final prévu:</span>
                                    <span className="text-lg font-black">{selectedProduct.quantity + parseInt(adjustment)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6 border-t pt-6 -mx-6 px-6">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold flex-1">Annuler</Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isLoading || !selectedProduct || !adjustment}
                        className="rounded-xl h-12 font-bold flex-1 shadow-lg shadow-primary/20"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirmer التعديل
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
