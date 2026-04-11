import { create } from 'zustand';
import { produce } from 'immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Cart, CartItem, Product, Sale } from '@/lib/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { useAppStore } from './appStore';
import { FINANCIAL_EPSILON } from '@/lib/utils';

// State Interface
interface CartState {
    carts: Cart[];
    activeCartId: string | null;
    actions: CartActions;
}

// Actions Interface
interface CartActions {
    getActiveCart: () => Cart | null;
    createCart: (name?: string) => string;
    deleteCart: (cartId: string) => void;
    selectCart: (cartId: string) => void;
    renameCart: (cartId: string, newName: string) => void;
    
    addItemToCart: (product: Product, quantity?: number) => void;
    removeItemFromCart: (productUuid: string) => void;
    /**
     * Updates item quantity with floating point support and high-precision stock validation.
     */
    updateItemQuantity: (productUuid: string, newQuantity: number) => void;
    
    setCustomer: (customerUuid: string | null) => void;
    setDiscount: (type: 'fixed' | 'percentage', value: number) => void;
    
    clearCart: () => void;
    resetCart: () => void;
    
    processSale: (amountPaid: number, dueDate?: Date) => Promise<Sale | null>;
}

// Initial State
const defaultCart: Omit<Cart, 'id' | 'name'> = {
    items: [],
    customerUuid: null,
    discount: { type: 'fixed', value: 0 },
};

const INITIAL_CART_ID = 'initial-cart-id';

const createInitialCart = (): Cart => ({
    id: INITIAL_CART_ID,
    name: `Vente 1`,
    ...defaultCart,
});

const initialState: Omit<CartState, 'actions'> = {
    carts: [createInitialCart()],
    activeCartId: INITIAL_CART_ID,
};


// Store Implementation - Hardened for Financial Consistency
export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                getActiveCart: () => {
                    const { carts, activeCartId } = get();
                    return carts.find((c: Cart) => c.id === activeCartId) || carts[0] || null;
                },
                createCart: (name) => {
                    const newId = uuidv4();
                    set(produce((state: CartState) => {
                        state.carts.push({
                            id: newId,
                            name: name || `Vente ${state.carts.length + 1}`,
                            ...defaultCart,
                        });
                        state.activeCartId = newId;
                    }));
                    return newId;
                },
                deleteCart: (cartId) => {
                    set(produce((state: CartState) => {
                        if (state.carts.length <= 1) {
                            const cart = state.carts[0];
                            if (cart) Object.assign(cart, { ...defaultCart, name: 'Vente 1' });
                            return;
                        }
                        state.carts = state.carts.filter(c => c.id !== cartId);
                        if (state.activeCartId === cartId) {
                            state.activeCartId = state.carts[0]?.id || null;
                        }
                    }));
                },
                selectCart: (cartId) => {
                    if (get().carts.find(c => c.id === cartId)) {
                        set({ activeCartId: cartId });
                    }
                },
                renameCart: (cartId, newName) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === cartId);
                        if (cart) cart.name = newName;
                    }));
                },
                addItemToCart: (product, quantity = 1) => {
                    const { activeCartId, carts } = get();
                    const currentCart = carts.find(c => c.id === activeCartId);
                    if (!currentCart) return;

                    const existingItem = currentCart.items.find(item => item.uuid === product.uuid);
                    const isStockedItem = !product.uuid.startsWith('custom-') && product.uuid !== 'BREAD_PRODUCT';

                    if (isStockedItem) {
                        const currentCartQuantity = existingItem ? existingItem.cartQuantity : 0;
                        const requestedTotalQuantity = currentCartQuantity + quantity;
                        
                        if (product.quantity < (requestedTotalQuantity - FINANCIAL_EPSILON)) {
                            toast.error(`Stock insuffisant para "${product.name}"`, {
                                description: `Demandé: ${requestedTotalQuantity}, Disponible: ${product.quantity}.`,
                            });
                            return;
                        }
                    }
                    
                    set(produce((state: CartState) => {
                        const targetCart = state.carts.find(c => c.id === state.activeCartId);
                        if (!targetCart) return;

                        const item = targetCart.items.find(i => i.uuid === product.uuid);
                        if (item) {
                            item.cartQuantity += quantity;
                            item.flash = true;
                        } else {
                            targetCart.items.unshift({ ...product, cartQuantity: quantity, flash: true } as CartItem);
                        }
                    }));

                    setTimeout(() => {
                        set(produce((state: CartState) => {
                            const targetCart = state.carts.find(c => c.id === state.activeCartId);
                            const item = targetCart?.items.find(i => i.uuid === product.uuid);
                            if (item) item.flash = false;
                        }));
                    }, 500);
                },
                removeItemFromCart: (productUuid) => {
                    set(produce((state: CartState) => {
                         const cart = state.carts.find(c => c.id === state.activeCartId);
                         if (cart) cart.items = cart.items.filter(item => item.uuid !== productUuid);
                    }));
                },
                updateItemQuantity: (productUuid, newQuantity) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        const item = cart?.items.find(i => i.uuid === productUuid);
                        if (item) {
                            const isStockedItem = !item.uuid.startsWith('custom-') && item.uuid !== 'BREAD_PRODUCT';
                            if (isStockedItem && newQuantity > (item.quantity + FINANCIAL_EPSILON)) {
                                toast.error(`Stock insuffisant`, { description: `Max: ${item.quantity}` });
                                item.cartQuantity = item.quantity;
                                return;
                            }
                            if (newQuantity > 0) {
                                item.cartQuantity = Number(newQuantity.toFixed(3));
                            } else {
                                cart!.items = cart!.items.filter(i => i.uuid !== productUuid);
                            }
                        }
                    }));
                },
                setCustomer: (customerUuid) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) cart.customerUuid = customerUuid;
                    }));
                },
                setDiscount: (type, value) => {
                     set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) cart.discount = { type, value: Math.max(0, value) };
                    }));
                },
                clearCart: () => {
                     set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) cart.items = [];
                    }));
                },
                resetCart: () => {
                     set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) {
                            const { id, name } = cart;
                            Object.assign(cart, { ...defaultCart, id, name });
                        }
                    }));
                },
                processSale: async (amountPaid, dueDate) => {
                    const activeCart = get().actions.getActiveCart();
                    if (!activeCart || activeCart.items.length === 0) {
                        toast.error("Le manifeste est vide.");
                        return null;
                    }

                    try {
                        const sale = await salesService.createSale({
                            items: activeCart.items,
                            discountType: activeCart.discount.type,
                            discountValue: activeCart.discount.value,
                            amountPaid: amountPaid,
                            customerUuid: activeCart.customerUuid,
                            dueDate: dueDate,
                        });
                        
                        get().actions.resetCart();
                        if (activeCart.customerUuid) await customerService.recalculateCustomerStatus(activeCart.customerUuid);
                        useAppStore.getState().actions.triggerSmartSync();
                        return sale;
                    } catch (error: any) {
                        toast.error("Échec de la transaction.", { description: error.message });
                        return null;
                    }
                }
            }
        }),
        {
            name: 'ipos-cart-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                carts: state.carts,
                activeCartId: state.activeCartId,
            }),
        }
    )
);

export const useCartActions = () => useCartStore((state) => state.actions);
export const useActiveCart = () => {
    const carts = useCartStore(state => state.carts);
    const activeCartId = useCartStore(state => state.activeCartId);
    return carts.find(c => c.id === activeCartId) || carts[0] || null;
}