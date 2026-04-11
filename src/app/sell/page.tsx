
'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { ProductSelector } from '@/components/sell/ProductSearch';
import { CartDisplay } from '@/components/sell/CartDisplay';
import { CartTotalBar } from '@/components/sell/CartTotalBar';
import { SaleActions } from '@/components/sell/SaleActions';
import { useCartActions } from '@/stores/cartStore';
import { toast } from 'sonner';

const KEYS = {
    SEARCH: 'F1', PAY: 'F2', CUSTOMER: 'F4',
    SUSPEND: 'F9', CUSTOM: 'F10', ESCAPE: 'Escape', ENTER: 'Enter',
} as const;

function SellPageContent() {
    const { createCart } = useCartActions();
    const searchInputRef      = useRef<HTMLInputElement>(null);
    const payButtonRef        = useRef<HTMLButtonElement>(null);
    const customerComboRef    = useRef<HTMLButtonElement>(null);
    const customItemButtonRef = useRef<HTMLButtonElement>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!e || !e.key) return;
        if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        
        const target   = e.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

        if (e.key === KEYS.SEARCH) { 
            e.preventDefault(); 
            searchInputRef.current?.focus(); 
            return; 
        }

        if (isTyping && target !== searchInputRef.current && !e.key.startsWith('F')) return;

        switch (e.key) {
            case KEYS.PAY:      e.preventDefault(); payButtonRef.current?.click(); break;
            case KEYS.CUSTOMER: e.preventDefault(); customerComboRef.current?.click(); break;
            case KEYS.SUSPEND:  e.preventDefault(); createCart(); toast.success('Vente suspendue.'); break;
            case KEYS.CUSTOM:   e.preventDefault(); customItemButtonRef.current?.click(); break;
            case KEYS.ESCAPE:   if (isTyping) target.blur(); break;
        }
    }, [createCart]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="h-full flex flex-col p-2 gap-2 overflow-hidden bg-background">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 flex-grow min-h-0">
                {/* Cart panel */}
                <div className="lg:col-span-3 flex flex-col bg-card border border-border rounded-lg overflow-hidden min-h-0 shadow-sm">
                    <CartDisplay />
                    <div className="mt-auto p-3 space-y-3 border-t border-border bg-muted/20">
                        <CartTotalBar />
                        <SaleActions 
                            payButtonRef={payButtonRef} 
                            customerComboRef={customerComboRef}
                        />
                    </div>
                </div>

                {/* Product search panel */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <ProductSelector
                        searchInputRef={searchInputRef}
                        customItemButtonRef={customItemButtonRef}
                    />
                </div>
            </div>

            {/* Keyboard shortcuts bar */}
            <div className="hidden md:flex items-center justify-center gap-4 py-1.5 text-[10px] text-muted-foreground/60 border-t border-border/50">
                {[
                    { key: 'F1', label: 'Chercher' }, { key: 'F2', label: 'Payer' },
                    { key: 'F4', label: 'Client' },   { key: 'F9', label: 'Suspendre' },
                    { key: 'F10', label: 'Perso' },   { key: 'Enter', label: 'Valider', primary: true },
                ].map(k => (
                    <div key={k.key} className="flex items-center gap-1.5">
                        <kbd className={`px-1.5 py-0.5 rounded border text-[9px] font-mono shadow-sm ${k.primary ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}>
                            {k.key}
                        </kbd>
                        <span className="font-semibold uppercase">{k.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const SellPage = memo(SellPageContent);
SellPage.displayName = 'SellPage';
export default SellPage;
