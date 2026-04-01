import { create } from 'zustand';
import { produce } from 'immer';
import type { CompanyProfile, ReturnItem, StockIntakeItem, Sale, StockIntake } from '@/lib/types';
import { toast } from 'sonner';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

import { companyProfileService } from '@/services/profile.service';
import { returnService } from '@/services/return.service';
import { inventoryService } from '@/services/inventory.service';
import { supplierService } from '@/services/supplier.service';
import { productService } from '@/services/product.service';
import { stockService } from '@/services/stock.service';
import { customerService } from '@/services/customer.service';
import { salesService } from '@/services/sales.service';

// Main State Interface
interface AppState {
    companyProfile: CompanyProfile | null;
    isCompanyProfileLoading: boolean;
    
    productViewMode: 'grid' | 'list';
    stockViewMode: 'grid' | 'list';
    returnsViewMode: 'grid' | 'list';
    actions: AppActions;
}

// Actions Interface
interface AppActions {
    fetchCompanyProfile: () => Promise<void>;
    updateCompanyProfile: (profileData: Partial<CompanyProfile>) => Promise<void>;
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
        totalValue: number,
        shippingCost: number
    }) => Promise<boolean>;
    setProductViewMode: (mode: 'grid' | 'list') => void;
    setStockViewMode: (mode: 'grid' | 'list') => void;
    setReturnsViewMode: (mode: 'grid' | 'list') => void;
}

// Initial State
const initialState: Omit<AppState, 'actions'> = {
    companyProfile: null,
    isCompanyProfileLoading: true,
    productViewMode: 'grid',
    stockViewMode: 'grid',
    returnsViewMode: 'grid',
};

// Store Implementation
export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                fetchCompanyProfile: async () => {
                    set({ isCompanyProfileLoading: true });
                    try {
                        const profile = await companyProfileService.getProfile();
                        set({ companyProfile: profile });
                    } catch (error: any) {
                        toast.error("Impossible de charger le profil de l'entreprise.", { description: error.message });
                    } finally {
                        set({ isCompanyProfileLoading: false });
                    }
                },
                updateCompanyProfile: async (profileData) => {
                    const updatedProfile = await companyProfileService.updateProfile(profileData);
                    set({ companyProfile: updatedProfile });
                },
                processReturn: async (returnData) => {
                     try {
                        await db.transaction('rw', db.product_returns, db.products, db.customers, db.inventory_logs, async () => {
                            const newReturn = await returnService.addReturn(returnData);
                            for (const item of newReturn.items) {
                                if (item.wasRestocked && item.productUuid) {
                                    await inventoryService.adjustStock(item.productUuid, item.quantity, 'return', newReturn.uuid);
                                }
                            }
                            if (newReturn.customerUuid) {
                                await customerService.recalculateCustomerStatus(newReturn.customerUuid);
                            }
                        });
                        toast.success("Retour de produit enregistré avec succès.");
                        return true;
                    } catch (error: any) {
                        toast.error("Échec du traitement du retour.", { description: error.message });
                        return false;
                    }
                },
                processStockIntake: async (intakeData) => {
                    try {
                         await db.transaction('rw', db.stock_intakes, db.products, db.suppliers, db.inventory_logs, async () => {
                            const supplier = await supplierService.findOrCreateSupplier(intakeData.supplierName, intakeData.supplierUuid);
            
                            // Calculate shipping distribution factor
                            const itemsTotalValue = intakeData.items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
                            const shippingFactor = itemsTotalValue > 0 ? intakeData.shippingCost / itemsTotalValue : 0;

                            const intakeUuid = uuidv4();
                            const finalItems = [];
                            
                            for (const item of intakeData.items) {
                                let productUuid = item.productUuid;
                                
                                // Calculate landing cost for this item (Purchase Price + share of shipping)
                                const landingCost = item.purchasePrice * (1 + shippingFactor);

                                if (item.isNew) {
                                    const newProduct = await productService.addProduct({
                                        name: item.name,
                                        category: item.category,
                                        price: item.price,
                                        purchasePrice: landingCost,
                                        quantity: 0, 
                                        minStockLevel: 10,
                                        supplierUuid: supplier.uuid,
                                        unite: item.unite,
                                        barcodes: item.barcodes,
                                    });
                                    productUuid = newProduct.uuid;
                                } else {
                                    const p = await inventoryService.getProductInfo(productUuid!);
                                    if (p) {
                                        await productService.updateProduct(p.uuid, { purchasePrice: landingCost, dateMajPrix: new Date() });
                                    }
                                }
            
                                if (productUuid) {
                                    const quantityReceived = item.quantity - item.quantityDamaged;
                                    if (quantityReceived > 0) {
                                        await inventoryService.adjustStock(productUuid, quantityReceived, 'stock_intake', intakeUuid);
                                    }
                                    finalItems.push({
                                        productUuid: productUuid,
                                        productName: item.name,
                                        quantityReceived: item.quantity,
                                        quantityDamaged: item.quantityDamaged,
                                        purchasePrice: item.purchasePrice,
                                        landingCost: landingCost,
                                    });
                                }
                            }
            
                            await db.stock_intakes.add({
                                uuid: intakeUuid,
                                supplierUuid: supplier.uuid,
                                invoiceNumber: intakeData.invoiceNumber,
                                invoiceDate: intakeData.invoiceDate,
                                shippingCost: intakeData.shippingCost,
                                items: finalItems,
                                totalValue: itemsTotalValue + intakeData.shippingCost,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                            
                            await supplierService.updateSupplierBalance(supplier.uuid, itemsTotalValue + intakeData.shippingCost);
                        });

                        toast.success("Réception de stock enregistrée.");
                        return true;
                    } catch (error: any) {
                        toast.error("Échec du traitement de la réception de stock.", { description: error.message });
                        return false;
                    }
                },
                setProductViewMode: (mode) => set({ productViewMode: mode }),
                setStockViewMode: (mode) => set({ stockViewMode: mode }),
                setReturnsViewMode: (mode) => set({ returnsViewMode: mode }),
            }
        }),
        {
          name: 'ipos-app-store',
          storage: createJSONStorage(() => localStorage),
          partialize: (state) => ({ 
              productViewMode: state.productViewMode,
              stockViewMode: state.stockViewMode,
              returnsViewMode: state.returnsViewMode,
          }),
        }
    )
);

export const useAppActions = () => useAppStore((state) => state.actions);
