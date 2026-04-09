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
                toast.success('Session suspendue.');
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
        <div className="h-full flex flex-col p-2 gap-2 overflow-hidden animate-in fade-in duration-500 bg-muted/10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 flex-grow min-h-0">
                {/* Left: Cart - High Density */}
                <div className="lg:col-span-7 flex flex-col bg-white/90 backdrop-blur-md rounded-xl overflow-hidden border shadow-sm min-h-0">
                    <div className="p-2 bg-indigo-50/50 border-b">
                        <CustomerCombobox ref={customerComboRef} />
                    </div>
                    <CartDisplay />
                    <div className="mt-auto p-2 bg-muted/10 border-t">
                        <SaleActions payButtonRef={payButtonRef} />
                    </div>
                </div>

                {/* Right: Product Selector - Matrix Optimized */}
                <div className="lg:col-span-5 flex flex-col min-h-0">
                    <ProductSelector
                        searchInputRef={searchInputRef}
                        customItemButtonRef={customItemButtonRef}
                    />
                </div>
            </div>

            {/* Micro Shortcut Bar */}
            <div className="hidden md:flex items-center justify-center gap-4 py-1 px-4 bg-white/80 backdrop-blur-xl border rounded-full text-[8px] font-black tracking-tighter text-muted-foreground uppercase shadow-sm">
                <span className="text-indigo-600 pr-3 border-r border-indigo-100 font-black">Smart POS Protocol</span>
                {[
                    { key: KEYS.SEARCH, label: 'Chercher' },
                    { key: KEYS.PAY, label: 'Encaisser' },
                    { key: KEYS.CUSTOMER, label: 'Client' },
                    { key: KEYS.CUSTOM, label: 'Manuel' },
                ].map(item => (
                    <div key={item.key} className="flex items-center gap-1.5 opacity-80">
                        <kbd className="bg-muted px-1 py-0.5 rounded border text-indigo-600 font-mono leading-none">{item.key}</kbd>
                        <span>{item.label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-1.5 text-indigo-600">
                    <kbd className="bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-sm font-mono leading-none">{KEYS.ENTER}</kbd>
                    <span className="font-black">Valider</span>
                </div>
            </div>
        </div>
    );
}

const SellPage = memo(SellPageContent);
SellPage.displayName = 'SellPage';
export default SellPage;
