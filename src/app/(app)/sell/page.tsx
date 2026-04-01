'use client';

import { ProductSelector } from "@/components/sell/ProductSearch";
import { CartDisplay } from "@/components/sell/CartDisplay";
import { CartTotalBar } from "@/components/sell/CartTotalBar";
import { SaleActions } from "@/components/sell/SaleActions";
import { CustomerCombobox } from "@/components/sell/CustomerCombobox";

export default function SellPage() {
    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6">
            {/* Left Column: Product Search and Grid */}
            <div className="flex flex-col min-h-0">
                 <ProductSelector />
            </div>

            {/* Right Column: Cart and Finalization */}
            <div className="flex flex-col bg-card border rounded-xl shadow-lg">
                <div className="p-4 border-b">
                    <CustomerCombobox />
                </div>
                <CartDisplay />
                <div className="mt-auto p-4 border-t space-y-4 bg-background/30 rounded-b-xl">
                    <CartTotalBar />
                    <SaleActions />
                </div>
            </div>
        </div>
    );
}
