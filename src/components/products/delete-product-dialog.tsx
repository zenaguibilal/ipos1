'use client';

import type { Product } from '@/lib/types';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { productService } from '@/services/product.service';
import { toast } from 'sonner';

interface DeleteProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
    onSuccess: () => void;
}

export function DeleteProductDialog({ isOpen, onOpenChange, product, onSuccess }: DeleteProductDialogProps) {
    
    const handleConfirm = async () => {
        if (!product) return;
        
        // The business logic is now in the service layer.
        // ConfirmAlertDialog will catch and display any errors thrown by the service.
        await productService.deleteProduct(product.uuid);
        toast.success(`Produit "${product.name}" supprimé.`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Êtes-vous absolument sûr ?'
            description={`Cette action est irréversible. Le produit "${product?.name}" sera définitivement supprimé.`}
            onConfirm={handleConfirm}
            confirmText="Continuer et supprimer"
        />
    );
}