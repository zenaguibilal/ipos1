'use client';

import { useEffect } from 'react';
import { ProductSelector } from "@/components/sell/ProductSearch";
import { CartDisplay } from "@/components/sell/CartDisplay";
import { CartTotalBar } from "@/components/sell/CartTotalBar";
import { SaleActions } from "@/components/sell/SaleActions";
import { CustomerCombobox } from "@/components/sell/CustomerCombobox";
import { useCartActions } from '@/stores/cartStore';
import { toast } from 'sonner';

export default function SellPage() {
    const { createCart } = useCartActions();
    
    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement as HTMLElement;
            const isTyping = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true';
            
            if (e.key === 'F1') {
                e.preventDefault();
                document.getElementById('sell-search-input')?.focus();
                return;
            }
            
            if (isTyping && activeElement.id !== 'sell-search-input') return;

            if (e.key === 'F2') {
                e.preventDefault();
                document.getElementById('sell-pay-button')?.click();
            }
            if (e.key === 'F4') {
                e.preventDefault();
                const combo = document.getElementById('sell-customer-combobox');
                combo?.focus();
                combo?.click();
            }
            if (e.key === 'F8') {
                e.preventDefault();
                document.getElementById('sell-drafts-button')?.click();
            }
            if (e.key === 'F9') {
                e.preventDefault();
                createCart();
                toast.success("Vente suspendue. Nouveau panier créé.");
            }
            if (e.key === 'F10') {
                e.preventDefault();
                document.getElementById('sell-custom-item-button')?.click();
            }
            if (e.key === 'Escape') {
                activeElement.blur();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [createCart]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-8 gap-6 overflow-hidden animate-in slide-in-from-bottom-2 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 flex-grow min-h-0">
                {/* Main Column: Cart and Finalization */}
                <div className="lg:col-span-3 flex flex-col bg-card luxury-card rounded-[2rem] overflow-hidden border-none min-h-0">
                    <div className="p-6 bg-muted/30 border-b border-white/5">
                        <CustomerCombobox />
                    </div>
                    
                    <CartDisplay />
                    
                    <div className="mt-auto p-6 space-y-6 bg-muted/20 border-t border-white/5">
                        <CartTotalBar />
                        <SaleActions />
                    </div>
                </div>

                {/* Secondary Column: Product Search and Grid */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <ProductSelector />
                </div>
            </div>

            {/* Shortcut Help Legend - Professional Luxury Bar */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-8 py-4 px-10 bg-card/50 backdrop-blur-xl border border-white/5 rounded-full text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase shadow-2xl">
                <div className="flex items-center justify-center gap-3 pr-4 border-r border-white/10">
                    <span className="text-primary font-black">Légende des Raccourcis</span>
                </div>
                <div className="flex items-center gap-3 group">
                    <kbd className="bg-muted px-2.5 py-1.5 rounded-xl border border-white/10 text-primary shadow-inner transition-all group-hover:scale-110">F1</kbd>
                    <span>Rechercher</span>
                </div>
                <div className="flex items-center gap-3 group">
                    <kbd className="bg-muted px-2.5 py-1.5 rounded-xl border border-white/10 text-primary shadow-inner transition-all group-hover:scale-110">F2</kbd>
                    <span>Payer</span>
                </div>
                <div className="flex items-center gap-3 group">
                    <kbd className="bg-muted px-2.5 py-1.5 rounded-xl border border-white/10 text-primary shadow-inner transition-all group-hover:scale-110">F4</kbd>
                    <span>Client</span>
                </div>
                <div className="flex items-center gap-3 group">
                    <kbd className="bg-muted px-2.5 py-1.5 rounded-xl border border-white/10 text-primary shadow-inner transition-all group-hover:scale-110">F8</kbd>
                    <span>Brouillons</span>
                </div>
                <div className="flex items-center gap-3 group">
                    <kbd className="bg-muted px-2.5 py-1.5 rounded-xl border border-white/10 text-primary shadow-inner transition-all group-hover:scale-110">F9</kbd>
                    <span>Suspendre</span>
                </div>
                <div className="flex items-center gap-3 group">
                    <kbd className="bg-muted px-2.5 py-1.5 rounded-xl border border-white/10 text-primary shadow-inner transition-all group-hover:scale-110">F10</kbd>
                    <span>Spécial</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-3 group">
                    <kbd className="bg-primary text-primary-foreground px-2.5 py-1.5 rounded-xl shadow-lg group-hover:scale-110 transition-all">Enter</kbd>
                    <span className="text-primary">Valider</span>
                </div>
            </div>
        </div>
    );
}