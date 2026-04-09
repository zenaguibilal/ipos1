'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { ProductSelector } from '@/components/sell/ProductSearch';
import { CartDisplay } from '@/components/sell/CartDisplay';
import { SaleActions } from '@/components/sell/SaleActions';
import { CustomerCombobox } from '@/components/sell/CustomerCombobox';
import { useCartActions } from '@/stores/cartStore';
import { toast } from 'sonner';

const KEYS = {
    SEARCH: 'F1',
    PAY: 'F2',
    CUSTOMER: 'F4',
    SUSPEND: 'F9',
    CUSTOM: 'F10',
    ESCAPE: 'Escape',
    ENTER: 'Enter',
} as const;

function SellPageContent() {
    const { createCart } = useCartActions();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const payButtonRef = useRef<HTMLButtonElement>(null);
    const customerComboRef = useRef<HTMLButtonElement>(null);
    const customItemButtonRef = useRef<HTMLButtonElement>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

        const target = e.target as HTMLElement;
        const isTyping =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.contentEditable === 'true';

        if (e.key === KEYS.SEARCH) {
            e.preventDefault();
            searchInputRef.current?.focus();
            return;
        }

        if (isTyping && target !== searchInputRef.current && !e.key.startsWith('F')) return;

        switch (e.key) {
            case KEYS.PAY:
                e.preventDefault();
                payButtonRef.current?.click();
                break;
            case KEYS.CUSTOMER:
                e.preventDefault();
                customerComboRef.current?.click();
                break;
            case KEYS.SUSPEND:
                e.preventDefault();
                createCart();
                toast.success('Session suspendue. Nouveau manifeste prêt.');
                break;
            case KEYS.CUSTOM:
                e.preventDefault();
                customItemButtonRef.current?.click();
                break;
            case KEYS.ESCAPE:
                if (isTyping) target.blur();
                break;
        }
    }, [createCart]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="h-full flex flex-col p-3 sm:p-4 gap-4 overflow-hidden animate-in slide-in-from-bottom-2 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-grow min-h-0">
                {/* Left: Cart & Customer */}
                <div className="lg:col-span-3 flex flex-col bg-card/60 backdrop-blur-md rounded-xl overflow-hidden border border-black/[0.03] shadow-sm min-h-0">
                    <div className="p-4 bg-muted/30 border-b border-black/[0.03]">
                        <CustomerCombobox ref={customerComboRef} />
                    </div>
                    <CartDisplay />
                    <div className="mt-auto p-6 space-y-4 bg-muted/20 border-t border-black/[0.03]">
                        <SaleActions payButtonRef={payButtonRef} />
                    </div>
                </div>

                {/* Right: Product Catalog */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <ProductSelector
                        searchInputRef={searchInputRef}
                        customItemButtonRef={customItemButtonRef}
                    />
                </div>
            </div>

            {/* Protocols Footer */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-6 py-2 px-6 bg-white/40 backdrop-blur-xl border border-black/[0.03] rounded-full text-[8px] font-black tracking-widest text-muted-foreground uppercase">
                <div className="flex items-center justify-center gap-2 pr-4 border-r">
                    <span className="text-primary">System Protocols</span>
                </div>
                {[
                    { key: KEYS.SEARCH, label: 'Search' },
                    { key: KEYS.PAY, label: 'Pay' },
                    { key: KEYS.CUSTOMER, label: 'Client' },
                    { key: KEYS.SUSPEND, label: 'Suspend' },
                    { key: KEYS.CUSTOM, label: 'Custom' },
                ].map(item => (
                    <div key={item.key} className="flex items-center gap-2 opacity-60">
                        <kbd className="bg-black/5 px-1.5 py-0.5 rounded border border-black/10 text-primary">{item.key}</kbd>
                        <span>{item.label}</span>
                    </div>
                ))}
                <div className="h-3 w-px bg-black/10" />
                <div className="flex items-center gap-2 text-primary">
                    <kbd className="bg-primary text-white px-1.5 py-0.5 rounded shadow-sm">{KEYS.ENTER}</kbd>
                    <span className="font-black">Validate</span>
                </div>
            </div>
        </div>
    );
}

const SellPage = memo(SellPageContent);
SellPage.displayName = 'SellPage';
export default SellPage;
