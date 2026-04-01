
'use client';

import { ProductSelector } from "@/components/sell/ProductSearch";
import { CartDisplay } from "@/components/sell/CartDisplay";
import { CartTotalBar } from "@/components/sell/CartTotalBar";
import { SaleActions } from "@/components/sell/SaleActions";
import { CustomerCombobox } from "@/components/sell/CustomerCombobox";

export default function SellPage() {
    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-6 p-4 sm:p-6">
            {/* Main Column: Cart and Finalization */}
            <div className="lg:col-span-3 flex flex-col bg-card border rounded-xl shadow-lg">
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
    );
}
