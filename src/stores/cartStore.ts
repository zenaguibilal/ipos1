import { create } from 'zustand';
import { produce } from 'immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Cart, CartItem, Product, Sale } from '@/lib/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';

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

// Use a stable ID for the initial cart to prevent hydration mismatch
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


// Store Implementation
export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                getActiveCart: () => {
                    const { carts, activeCartId } = get();
                    return carts.find(c => c.id === activeCartId) || carts[0] || null;
                },
                createCart: (name) => {
                    const newId = uuidv4();
                    const newCart: Cart = {
                        id: newId,
                        name: name || `Vente ${get().carts.length + 1}`,
                        ...defaultCart,
                    };
                    set(produce(state => {
                        state.carts.push(newCart);
                        state.activeCartId = newId;
                    }));
                    return newId;
                },
                deleteCart: (cartId) => {
                    set(produce(state => {
                        if (state.carts.length <= 1) {
                            // Don't delete last cart, just reset it
                            const cart = state.carts.find(c => c.id === cartId);
                            if (cart) {
                                Object.assign(cart, { ...defaultCart, name: 'Vente 1' });
                            }
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
                    set(produce(state => {
                        const cart = state.carts.find(c => c.id === cartId);
                        if (cart) {
                            cart.name = newName;
                        }
                    }));
                },
                addItemToCart: (product, quantity = 1) => {
                    const { activeCartId, carts } = get();
                    const cart = carts.find(c => c.id === activeCartId);
                    if (!cart) return;

                    const existingItem = cart.items.find(item => item.uuid === product.uuid);
                    const isStockedItem = !product.uuid.startsWith('custom-') && product.uuid !== 'BREAD_PRODUCT';

                    if (isStockedItem) {
                        const currentCartQuantity = existingItem ? existingItem.cartQuantity : 0;
                        const requestedTotalQuantity = currentCartQuantity + quantity;
                        
                        if (product.quantity < requestedTotalQuantity) {
                            toast.error(`Stock insuffisant pour "${product.name}"`, {
                                description: `Demandé: ${requestedTotalQuantity}, Disponible: ${product.quantity}.`,
                            });
                            return;
                        }
                    }
                    
                    set(produce(state => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (!cart) return;

                        const existingItem = cart.items.find(item => item.uuid === product.uuid);
                        if (existingItem) {
                            existingItem.cartQuantity += quantity;
                            existingItem.flash = true;
                        } else {
                            cart.items.unshift({ ...product, cartQuantity: quantity, flash: true });
                        }
                    }));

                    setTimeout(() => {
                        set(produce(state => {
                            const cart = state.carts.find(c => c.id === state.activeCartId);
                            if (cart) {
                                const item = cart.items.find(i => i.uuid === product.uuid);
                                if (item) item.flash = false;
                            }
                        }));
                    }, 500);
                },
                removeItemFromCart: (productUuid) => {
                    set(produce(state => {
                         const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) {
                            cart.items = cart.items.filter(item => item.uuid !== productUuid);
                        }
                    }));
                },
                updateItemQuantity: (productUuid, newQuantity) => {
                    set(produce(state => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) {
                            const item = cart.items.find(item => item.uuid === productUuid);
                            if (item) {
                                const isStockedItem = !item.uuid.startsWith('custom-') && item.uuid !== 'BREAD_PRODUCT';
                
                                if (isStockedItem && newQuantity > item.quantity) {
                                    toast.error(`Stock insuffisant pour "${item.name}"`, {
                                        description: `Demandé: ${newQuantity}, Disponible: ${item.quantity}.`,
                                    });
                                    item.cartQuantity = item.quantity;
                                    return;
                                }

                                if (newQuantity > 0) {
                                    item.cartQuantity = newQuantity;
                                } else {
                                    cart.items = cart.items.filter(i => i.uuid !== productUuid);
                                }
                            }
                        }
                    }));
                },
                setCustomer: (customerUuid) => {
                    set(produce(state => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) {
                            cart.customerUuid = customerUuid;
                        }
                    }));
                },
                setDiscount: (type, value) => {
                     set(produce(state => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) {
                            cart.discount = { type, value: Math.max(0, value) };
                        }
                    }));
                },
                clearCart: () => {
                     set(produce(state => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) {
                            cart.items = [];
                        }
                    }));
                },
                resetCart: () => {
                     set(produce(state => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) {
                            const oldId = cart.id;
                            const oldName = cart.name;
                            // Reset active cart data
                            Object.assign(cart, { ...defaultCart, id: oldId, name: oldName });
                        }
                    }));
                },
                processSale: async (amountPaid, dueDate) => {
                    const { getActiveCart, resetCart, deleteCart } = get().actions;
                    const activeCart = getActiveCart();
                    
                    if (!activeCart || activeCart.items.length === 0) {
                        toast.error("Le panier est vide.");
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
                        
                        toast.success(`Vente #${sale.invoiceNumber} enregistrée.`);
                        
                        // After success, if it was a draft, we might want to delete it or just clear it.
                        // For MVP, we just clear the active cart.
                        resetCart();
                        
                        if (activeCart.customerUuid) {
                            customerService.recalculateCustomerStatus(activeCart.customerUuid);
                        }

                        return sale;

                    } catch (error: any) {
                        toast.error("Échec de la vente.", { description: error.message });
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

// Convenience hooks
export const useCartActions = () => useCartStore((state) => state.actions);

export const useActiveCart = () => {
    const carts = useCartStore(state => state.carts);
    const activeCartId = useCartStore(state => state.activeCartId);
    return carts.find(c => c.id === activeCartId) || carts[0] || null;
}
