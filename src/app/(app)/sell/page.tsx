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
            // Check if user is typing in an input
            const activeElement = document.activeElement as HTMLElement;
            const isTyping = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true';
            
            // F1 always focuses search, even if typing
            if (e.key === 'F1') {
                e.preventDefault();
                document.getElementById('sell-search-input')?.focus();
                return;
            }
            
            // Other shortcuts only if not typing inside a modal input (unless it's the search input)
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
        <div className="h-full flex flex-col p-4 sm:p-6 gap-4 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-grow min-h-0">
                {/* Main Column: Cart and Finalization */}
                <div className="lg:col-span-3 flex flex-col bg-card border rounded-xl shadow-lg min-h-0">
                    <div className="p-4 border-b">
                        <CustomerCombobox />
                    </div>
                    <CartDisplay />
                    <div className="mt-auto p-4 border-t space-y-4 bg-background/30 rounded-b-xl">
                        <CartTotalBar />
                        <SaleActions />
                    </div>
                </div>

                {/* Secondary Column: Product Search and Grid */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <ProductSelector />
                </div>
            </div>

            {/* Shortcut Help Legend - Professional Bar */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-6 py-3 px-6 bg-muted/20 border rounded-full text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-all hover:bg-muted/30">
                <div className="flex items-center gap-2 group">
                    <kbd className="bg-background px-2 py-1 rounded-md border-2 border-border shadow-sm text-foreground transition-all group-hover:border-primary group-hover:text-primary">F1</kbd>
                    <span>Rechercher</span>
                </div>
                <div className="flex items-center gap-2 group">
                    <kbd className="bg-background px-2 py-1 rounded-md border-2 border-border shadow-sm text-foreground transition-all group-hover:border-primary group-hover:text-primary">F2</kbd>
                    <span>Payer</span>
                </div>
                <div className="flex items-center gap-2 group">
                    <kbd className="bg-background px-2 py-1 rounded-md border-2 border-border shadow-sm text-foreground transition-all group-hover:border-primary group-hover:text-primary">F4</kbd>
                    <span>Client</span>
                </div>
                <div className="flex items-center gap-2 group">
                    <kbd className="bg-background px-2 py-1 rounded-md border-2 border-border shadow-sm text-foreground transition-all group-hover:border-primary group-hover:text-primary">F8</kbd>
                    <span>Brouillons</span>
                </div>
                <div className="flex items-center gap-2 group">
                    <kbd className="bg-background px-2 py-1 rounded-md border-2 border-border shadow-sm text-foreground transition-all group-hover:border-primary group-hover:text-primary">F9</kbd>
                    <span>Suspendre</span>
                </div>
                <div className="flex items-center gap-2 group">
                    <kbd className="bg-background px-2 py-1 rounded-md border-2 border-border shadow-sm text-foreground transition-all group-hover:border-primary group-hover:text-primary">F10</kbd>
                    <span>Spécial</span>
                </div>
                <div className="flex items-center gap-2 group">
                    <kbd className="bg-background px-2 py-1 rounded-md border-2 border-border shadow-sm text-foreground transition-all group-hover:border-primary group-hover:text-primary font-black px-1.5">Esc</kbd>
                    <span>Fermer</span>
                </div>
                <div className="flex items-center gap-2 group">
                    <kbd className="bg-background px-2 py-1 rounded-md border-2 border-border shadow-sm text-foreground transition-all group-hover:border-primary group-hover:text-primary font-black px-1.5">Enter</kbd>
                    <span>Valider</span>
                </div>
            </div>
        </div>
    );
}
