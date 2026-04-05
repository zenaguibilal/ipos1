'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ProductSelector } from "@/components/sell/ProductSearch";
import { CartDisplay } from "@/components/sell/CartDisplay";
import { CartTotalBar } from "@/components/sell/CartTotalBar";
import { SaleActions } from "@/components/sell/SaleActions";
import { CustomerCombobox } from "@/components/sell/CustomerCombobox";
import { useCartActions } from '@/stores/cartStore';
import { toast } from 'sonner';

/**
 * SellPage - Elite POS Transaction Interface
 * Implements strict keyboard event management and high-speed workflow.
 */
export default function SellPage() {
    const { createCart } = useCartActions();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const payButtonRef = useRef<HTMLButtonElement>(null);
    const customerComboRef = useRef<HTMLButtonElement>(null);
    const customItemButtonRef = useRef<HTMLButtonElement>(null);
    
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if any modifier key is pressed to prevent conflict with OS shortcuts
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

        const target = e.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
        
        if (e.key === 'F1') {
            e.preventDefault();
            searchInputRef.current?.focus();
            return;
        }
        
        if (isTyping && target !== searchInputRef.current) return;

        switch (e.key) {
            case 'F2':
                e.preventDefault();
                payButtonRef.current?.click();
                break;
            case 'F4':
                e.preventDefault();
                customerComboRef.current?.click();
                break;
            case 'F9':
                e.preventDefault();
                createCart();
                toast.success("Vente suspendue. Nouveau panier créé.");
                break;
            case 'F10':
                e.preventDefault();
                customItemButtonRef.current?.click();
                break;
            case 'Escape':
                target.blur();
                break;
        }
    }, [createCart]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-8 gap-6 overflow-hidden animate-in slide-in-from-bottom-2 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 flex-grow min-h-0">
                <div className="lg:col-span-3 flex flex-col bg-card luxury-card rounded-[2rem] overflow-hidden border-none min-h-0">
                    <div className="p-6 bg-muted/30 border-b border-white/5">
                        <CustomerCombobox ref={customerComboRef} />
                    </div>
                    
                    <CartDisplay />
                    
                    <div className="mt-auto p-6 space-y-6 bg-muted/20 border-t border-white/5">
                        <CartTotalBar />
                        <SaleActions payButtonRef={payButtonRef} />
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <ProductSelector 
                        searchInputRef={searchInputRef} 
                        customItemButtonRef={customItemButtonRef} 
                    />
                </div>
            </div>

            {/* Legend / Shortcut Footer */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-8 py-4 px-10 bg-card/50 backdrop-blur-xl border border-white/5 rounded-full text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase shadow-2xl">
                <div className="flex items-center justify-center gap-3 pr-4 border-r border-white/10">
                    <span className="text-primary font-black">Légende Elite</span>
                </div>
                {[
                    { key: 'F1', label: 'Rechercher' },
                    { key: 'F2', label: 'Payer' },
                    { key: 'F4', label: 'Client' },
                    { key: 'F9', label: 'Suspendre' },
                    { key: 'F10', label: 'Spécial' },
                ].map(item => (
                    <div key={item.key} className="flex items-center gap-3 group">
                        <kbd className="bg-muted px-2.5 py-1.5 rounded-xl border border-white/10 text-primary shadow-inner transition-all group-hover:scale-110">{item.key}</kbd>
                        <span>{item.label}</span>
                    </div>
                ))}
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-3 group">
                    <kbd className="bg-primary text-primary-foreground px-2.5 py-1.5 rounded-xl shadow-lg group-hover:scale-110 transition-all">Enter</kbd>
                    <span className="text-primary">Valider</span>
                </div>
            </div>
        </div>
    );
}
