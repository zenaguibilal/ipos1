'use client';

import { useEffect } from 'react';
import { ProductSelector } from "@/components/sell/ProductSearch";
import { CartDisplay } from "@/components/sell/CartDisplay";
import { CartTotalBar } from "@/components/sell/CartTotalBar";
import { SaleActions } from "@/components/sell/SaleActions";
import { CustomerCombobox } from "@/components/sell/CustomerCombobox";

export default function SellPage() {
    
    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in an input unless it's Escape
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);
            
            if (e.key === 'F1') {
                e.preventDefault();
                document.getElementById('sell-search-input')?.focus();
            }
            if (e.key === 'F2') {
                e.preventDefault();
                document.getElementById('sell-pay-button')?.click();
            }
            if (e.key === 'F4') {
                e.preventDefault();
                document.getElementById('sell-customer-combobox')?.focus();
            }
            if (e.key === 'F10') {
                e.preventDefault();
                document.getElementById('sell-custom-item-button')?.click();
            }
            if (e.key === 'Escape') {
                (document.activeElement as HTMLElement)?.blur();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

            {/* Shortcut Help Legend */}
            <div className="hidden md:flex flex-wrap gap-6 text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-2 border-t pt-2">
                <span className="flex items-center gap-1.5"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-foreground">F1</kbd> Rechercher</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-foreground">F2</kbd> Payer</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-foreground">F4</kbd> Client</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-foreground">F10</kbd> Article Spécial</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-foreground">Esc</kbd> Annuler</span>
            </div>
        </div>
    );
}
