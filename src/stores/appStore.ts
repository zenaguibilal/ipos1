
import { create } from 'zustand';
import { produce } from 'immer';
import type { CompanyProfile, ReturnItem, StockIntakeItem } from '@/lib/types';
import { toast } from 'sonner';
import { persist, createJSONStorage } from 'zustand/middleware';

import { profileService } from '@/services/profile.service';
import { returnService } from '@/services/return.service';
import { inventoryService } from '@/services/inventory.service';
import { supplierService } from '@/services/supplier.service';
import { productService } from '@/services/product.service';
import { stockService } from '@/services/stock.service';
import { customerService } from '@/services/customer.service';

// Main State Interface
interface AppState {
    profile: CompanyProfile | null;
    isSettingsLoading: boolean;
    
    productViewMode: 'grid' | 'list';
    stockViewMode: 'grid' | 'list';
    actions: AppActions;
}

// Actions Interface
interface AppActions {
    fetchProfile: () => Promise<void>;
    updateProfile: (profileData: Partial<CompanyProfile>) => Promise<void>;
    processReturn: (returnData: {
        originalSaleUuid: string,
        items: ReturnItem[],
        totalReturnValue: number,
        amountRefunded: number,
        customerUuid?: string,
        notes?: string
    }) => Promise<boolean>;
    processStockIntake: (intakeData: {
        supplierName: string,
        supplierUuid?: string,
        invoiceNumber: string,
        invoiceDate: Date,
        items: StockIntakeItem[],
        totalValue: number
    }) => Promise<boolean>;
    setProductViewMode: (mode: 'grid' | 'list') => void;
    setStockViewMode: (mode: 'grid' | 'list') => void;
}

// Initial State
const initialState: Omit<AppState, 'actions'> = {
    profile: null,
    isSettingsLoading: true,
    productViewMode: 'grid',
    stockViewMode: 'grid',
};

// Store Implementation
export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                fetchProfile: async () => {
                    if (get().profile) return; // Fetch only once
                    try {
                        set({ isSettingsLoading: true });
                        const profile = await profileService.getProfile();
                        set({ profile });
                    } catch (error: any) {
                        toast.error("Impossible de charger le profil de l'entreprise.", { description: error.message });
                    } finally {
                        set({ isSettingsLoading: false });
                    }
                },
                updateProfile: async (profileData) => {
                    const updatedProfile = await profileService.updateProfile(profileData);
                    set({ profile: updatedProfile });
                },
                processReturn: async (returnData) => {
                     try {
                        const newReturn = await returnService.addReturn(returnData);
                        for (const item of newReturn.items) {
                            if (item.wasRestocked && item.productUuid) {
                                await inventoryService.adjustStock(item.productUuid, item.quantity, 'return', newReturn.uuid);
                            }
                        }
                        if (newReturn.customerUuid) {
                            await customerService.recalculateCustomerStatus(newReturn.customerUuid);
                        }
                        toast.success("Retour de produit enregistré avec succès.");
                        return true;
                    } catch (error: any) {
                        toast.error("Échec du traitement du retour.", { description: error.message });
                        return false;
                    }
                },
                processStockIntake: async (intakeData) => {
                    try {
                        const supplier = await supplierService.findOrCreateSupplier(intakeData.supplierName, intakeData.supplierUuid);
        
                        const finalItems = [];
                        for (const item of intakeData.items) {
                            let productUuid = item.productUuid;
                            if (item.isNew) {
                                const newProduct = await productService.addProduct({
                                    name: item.name,
                                    category: item.category,
                                    price: item.price,
                                    purchasePrice: item.purchasePrice,
                                    quantity: 0, // Initial quantity is 0, will be adjusted by inventory service
                                    minStockLevel: 10,
                                    supplierUuid: supplier.uuid,
                                    unite: item.unite,
                                    barcodes: item.barcodes,
                                });
                                productUuid = newProduct.uuid;
                            } else {
                                const p = await inventoryService.getProductInfo(productUuid!);
                                if (p && p.purchasePrice !== item.purchasePrice) {
                                    await productService.updateProduct(p.uuid, { purchasePrice: item.purchasePrice, dateMajPrix: new Date() });
                                }
                            }
        
                            if (productUuid) {
                                const quantityReceived = item.quantity - item.quantityDamaged;
                                if (quantityReceived > 0) {
                                    await inventoryService.adjustStock(productUuid, quantityReceived, 'stock_intake');
                                }
                                finalItems.push({
                                    productUuid: productUuid,
                                    productName: item.name,
                                    quantityReceived: item.quantity,
                                    quantityDamaged: item.quantityDamaged,
                                    purchasePrice: item.purchasePrice,
                                });
                            }
                        }
        
                        await stockService.addStockIntake({
                            supplierUuid: supplier.uuid,
                            invoiceNumber: intakeData.invoiceNumber,
                            invoiceDate: intakeData.invoiceDate,
                            items: finalItems,
                            totalValue: intakeData.totalValue,
                        });
                        
                        await supplierService.updateSupplierBalance(supplier.uuid, intakeData.totalValue);

                        toast.success("Réception de stock enregistrée et solde fournisseur mis à jour.");
                        return true;
                    } catch (error: any) {
                        toast.error("Échec du traitement de la réception de stock.", { description: error.message });
                        return false;
                    }
                },
                setProductViewMode: (mode) => set({ productViewMode: mode }),
                setStockViewMode: (mode) => set({ stockViewMode: mode }),
            }
        }),
        {
          name: 'ipos-app-store',
          storage: createJSONStorage(() => localStorage),
          partialize: (state) => ({ 
              productViewMode: state.productViewMode,
              stockViewMode: state.stockViewMode,
          }),
        }
    )
);

// Convenience hooks
export const useAppActions = () => useAppStore((state) => state.actions);
