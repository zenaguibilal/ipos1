import { create } from 'zustand';
import type { CompanyProfile, ReturnItem, StockIntakeItem } from '@/lib/types';
import { toast } from 'sonner';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

import { companyProfileService } from '@/services/profile.service';
import { returnService }         from '@/services/return.service';
import { inventoryService }      from '@/services/inventory.service';
import { supplierService }       from '@/services/supplier.service';
import { productService }        from '@/services/product.service';
import { customerService }       from '@/services/customer.service';
import { supabaseSyncService }   from '@/services/supabase.service';
import { preciseMultiply, safeNumber } from '@/lib/utils';

interface AppState {
    companyProfile:          CompanyProfile | null;
    isCompanyProfileLoading: boolean;

    isSyncing:    boolean;
    lastSyncDate: Date | null;

    productViewMode:   'grid' | 'list';
    stockViewMode:     'grid' | 'list';
    returnsViewMode:   'grid' | 'list';
    customersViewMode: 'grid' | 'list';
    expensesViewMode:  'grid' | 'list';
    salesViewMode:     'grid' | 'list';

    actions: AppActions;
}

interface AppActions {
    fetchCompanyProfile:  () => Promise<void>;
    updateCompanyProfile: (profileData: Partial<CompanyProfile>) => Promise<void>;

    performCloudSync:      (mode: 'push' | 'pull') => Promise<void>;
    performBackgroundSync: () => Promise<void>;
    triggerSmartSync:      () => void;

    processReturn: (returnData: {
        originalSaleUuid: string;
        items:            ReturnItem[];
        totalReturnValue: number;
        amountRefunded:   number;
        customerUuid?:    string;
        notes?:           string;
    }) => Promise<boolean>;

    processStockIntake: (intakeData: {
        supplierName:   string;
        supplierUuid?:  string;
        invoiceNumber:  string;
        invoiceDate:    Date;
        items:          StockIntakeItem[];
        totalValue:     number;
        shippingCost:   number;
    }) => Promise<boolean>;

    setProductViewMode:   (mode: 'grid' | 'list') => void;
    setStockViewMode:     (mode: 'grid' | 'list') => void;
    setReturnsViewMode:   (mode: 'grid' | 'list') => void;
    setCustomersViewMode: (mode: 'grid' | 'list') => void;
    setExpensesViewMode:  (mode: 'grid' | 'list') => void;
    setSalesViewMode:     (mode: 'grid' | 'list') => void;
}

const initialState: Omit<AppState, 'actions'> = {
    companyProfile:          null,
    isCompanyProfileLoading: true,
    isSyncing:               false,
    lastSyncDate:            null,
    productViewMode:         'grid',
    stockViewMode:           'grid',
    returnsViewMode:         'grid',
    customersViewMode:       'grid',
    expensesViewMode:        'list',
    salesViewMode:           'grid',
};

let syncDebounceTimeout: NodeJS.Timeout | null = null;

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
                    } catch {
                        toast.error('Impossible de charger le profil.');
                    } finally {
                        set({ isCompanyProfileLoading: false });
                    }
                },

                updateCompanyProfile: async (profileData) => {
                    const updatedProfile =
                        await companyProfileService.updateProfile(profileData);
                    set({ companyProfile: updatedProfile });
                    get().actions.performBackgroundSync();
                },

                performCloudSync: async (mode) => {
                    const currentProfile = get().companyProfile;
                    if (
                        !currentProfile?.supabase_url ||
                        !currentProfile?.supabase_key
                    ) {
                        toast.error('Configuration Cloud manquante.');
                        return;
                    }

                    if (get().isSyncing) {
                        toast.info('Synchronisation déjà en cours…');
                        return;
                    }

                    set({ isSyncing: true });
                    try {
                        const now = new Date();

                        if (mode === 'push') {
                            await supabaseSyncService.pushAllData(
                                currentProfile.supabase_url,
                                currentProfile.supabase_key,
                            );
                        } else {
                            await supabaseSyncService.pullAllData(
                                currentProfile.supabase_url,
                                currentProfile.supabase_key,
                            );
                        }

                        const updatedProfile =
                            await companyProfileService.updateProfile({
                                last_sync_at: now,
                            });
                        set({
                            companyProfile: updatedProfile,
                            lastSyncDate:   now,
                        });
                    } catch (error: any) {
                        console.error('Sync Error:', error);
                        toast.error('Échec de la synchronisation.', {
                            description: error.message,
                        });
                    } finally {
                        set({ isSyncing: false });
                    }
                },

                performBackgroundSync: async () => {
                    const state          = get();
                    const currentProfile = state.companyProfile;

                    if (
                        !currentProfile?.supabase_url ||
                        !currentProfile?.supabase_key ||
                        state.isSyncing
                    ) {
                        return;
                    }

                    set({ isSyncing: true });
                    try {
                        const now = new Date();
                        await supabaseSyncService.pullAllData(
                            currentProfile.supabase_url,
                            currentProfile.supabase_key,
                        );
                        await supabaseSyncService.pushAllData(
                            currentProfile.supabase_url,
                            currentProfile.supabase_key,
                        );

                        const updatedProfile =
                            await companyProfileService.updateProfile({
                                last_sync_at: now,
                            });
                        set({
                            companyProfile: updatedProfile,
                            lastSyncDate:   now,
                        });
                    } catch (error: any) {
                        console.error(
                            'iPOS Zen: Échec sync arrière-plan.',
                            error,
                        );
                    } finally {
                        set({ isSyncing: false });
                    }
                },

                triggerSmartSync: () => {
                    if (syncDebounceTimeout)
                        clearTimeout(syncDebounceTimeout);
                    syncDebounceTimeout = setTimeout(() => {
                        get().actions.performBackgroundSync();
                    }, 500);
                },

                processReturn: async (returnData) => {
                    try {
                        await db.transaction(
                            'rw',
                            [
                                db.product_returns,
                                db.products,
                                db.customers,
                                db.inventory_logs,
                                db.sales,
                                db.payments,
                            ],
                            async () => {
                                const newReturn =
                                    await returnService.addReturn(returnData);
                                for (const item of newReturn.items) {
                                    if (item.wasRestocked && item.productUuid) {
                                        await inventoryService.adjustStock(
                                            item.productUuid,
                                            item.quantity,
                                            'return',
                                            newReturn.uuid,
                                        );
                                    }
                                }
                                if (newReturn.customerUuid) {
                                    await customerService.recalculateCustomerStatus(
                                        newReturn.customerUuid,
                                    );
                                }
                            },
                        );
                        toast.success('Retour de marchandise validé.');
                        get().actions.triggerSmartSync();
                        return true;
                    } catch {
                        toast.error('Échec du traitement du retour.');
                        return false;
                    }
                },

                processStockIntake: async (intakeData) => {
                    try {
                        await db.transaction(
                            'rw',
                            [
                                db.stock_intakes,
                                db.products,
                                db.suppliers,
                                db.inventory_logs,
                                db.company_profile
                            ],
                            async () => {
                                const supplier =
                                    await supplierService.findOrCreateSupplier(
                                        intakeData.supplierName,
                                        intakeData.supplierUuid,
                                    );

                                // محرك حساب القيمة الإجمالية بالسنتيمات لضمان الدقة
                                const itemsTotalValueCents = intakeData.items.reduce(
                                    (sum, item) => sum + Math.round(preciseMultiply(item.quantity, item.purchasePrice) * 100),
                                    0,
                                );
                                
                                const shippingCostCents = Math.round(safeNumber(intakeData.shippingCost) * 100);
                                
                                const shippingFactor = itemsTotalValueCents > 0
                                    ? shippingCostCents / itemsTotalValueCents
                                    : 0;

                                const intakeUuid  = uuidv4();
                                const finalItems: any[] = [];

                                for (const item of intakeData.items) {
                                    let productUuid  = item.productUuid;
                                    const costCents = Math.round(safeNumber(item.purchasePrice) * 100);
                                    
                                    // حساب تكلفة الربط (Landing Cost) بدقة عالية
                                    const landingCost = (costCents * (1 + shippingFactor)) / 100;

                                    if (item.isNew) {
                                        const newProduct =
                                            await productService.addProduct({
                                                name:          item.name,
                                                category:      item.category,
                                                price:         safeNumber(item.price),
                                                purchasePrice: landingCost,
                                                quantity:      0,
                                                minStockLevel: 10,
                                                supplierUuid:  supplier.uuid,
                                                unite:         item.unite,
                                                barcodes:      item.barcodes,
                                            });
                                        productUuid = newProduct.uuid;
                                    } else {
                                        const p = await inventoryService.getProductInfo(productUuid!);
                                        if (p) {
                                            await productService.updateProduct(
                                                p.uuid,
                                                {
                                                    purchasePrice: landingCost,
                                                    dateMajPrix:   new Date(),
                                                },
                                            );
                                        }
                                    }

                                    if (productUuid) {
                                        const qtyReceived = Number((safeNumber(item.quantity) - safeNumber(item.quantityDamaged)).toFixed(3));
                                        if (qtyReceived > 0) {
                                            await inventoryService.adjustStock(
                                                productUuid,
                                                qtyReceived,
                                                'stock_intake',
                                                intakeUuid,
                                            );
                                        }
                                        finalItems.push({
                                            productUuid,
                                            productName:       item.name,
                                            quantityReceived:  safeNumber(item.quantity),
                                            quantityDamaged:   safeNumber(item.quantityDamaged),
                                            purchasePrice:     safeNumber(item.purchasePrice),
                                            landingCost,
                                        });
                                    }
                                }

                                const finalTotalValue = (itemsTotalValueCents + shippingCostCents) / 100;

                                await db.stock_intakes.add({
                                    uuid:          intakeUuid,
                                    supplierUuid:  supplier.uuid,
                                    invoiceNumber: intakeData.invoiceNumber,
                                    invoiceDate:   intakeData.invoiceDate,
                                    shippingCost:  intakeData.shippingCost,
                                    items:         finalItems,
                                    totalValue:    finalTotalValue,
                                    createdAt:     new Date(),
                                    updatedAt:     new Date(),
                                });

                                await supplierService.updateSupplierBalance(
                                    supplier.uuid,
                                    finalTotalValue,
                                );
                            },
                        );

                        toast.success('Réception de stock enregistrée.');
                        get().actions.triggerSmartSync();
                        return true;
                    } catch (err: any) {
                        console.error("Intake Error:", err);
                        toast.error('Échec de la réception de stock.');
                        return false;
                    }
                },

                setProductViewMode:   mode => set({ productViewMode:   mode }),
                setStockViewMode:     mode => set({ stockViewMode:     mode }),
                setReturnsViewMode:   mode => set({ returnsViewMode:   mode }),
                setCustomersViewMode: mode => set({ customersViewMode: mode }),
                setExpensesViewMode:  mode => set({ expensesViewMode:  mode }),
                setSalesViewMode:     mode => set({ salesViewMode:     mode }),
            },
        }),
        {
            name:    'ipos-app-store',
            storage: createJSONStorage(() => localStorage),
            partialize: state => ({
                productViewMode:   state.productViewMode,
                stockViewMode:     state.stockViewMode,
                returnsViewMode:   state.returnsViewMode,
                customersViewMode: state.customersViewMode,
                expensesViewMode:  state.expensesViewMode,
                salesViewMode:     state.salesViewMode,
            }),
        },
    ),
);

export const useAppActions = () => useAppStore(state => state.actions);
