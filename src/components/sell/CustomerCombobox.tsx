
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { customerService } from '@/services/customer.service';
import { useCartActions, useActiveCart } from '@/stores/cartStore';
import type { ComboboxOption } from '@/components/ui/combobox';
import { Combobox } from '@/components/ui/combobox';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer } from '@/lib/types';
import { toast } from 'sonner';
import { UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerDialog } from '@/components/customers/customer-dialog';

export function CustomerCombobox() {
    const { setCustomer } = useCartActions();
    const activeCart = useActiveCart();
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 300);

    const fetchCustomers = useCallback(async () => {
        try {
            const data = await customerService.filterCustomers({ query: debouncedSearch });
            setCustomers(data);
        } catch (e) {
            toast.error("Impossible de charger les clients.");
        }
    }, [debouncedSearch]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const customerOptions = useMemo<ComboboxOption[]>(() => {
        const options: ComboboxOption[] = customers.map(c => ({
            value: c.uuid,
            label: `${c.firstName} ${c.lastName}`,
            subLabel: c.outstandingBalance > 0 
                ? `Flux dû: ${formatCurrency(c.outstandingBalance)} • ${formatCurrency(c.totalSpent)} total` 
                : `Elite • ${formatCurrency(c.totalSpent)} d'achats`,
            subLabelClassName: c.debtStatus === 'overdue' ? 'text-destructive font-black' : 'text-muted-foreground font-medium',
        }));

        options.unshift({
            value: 'walk-in',
            label: 'Client de Passage',
            subLabel: "Protocole Standard • Sans suivi financier",
        });

        return options;
    }, [customers]);

    const handleSelect = (value: string) => {
        if (value === 'walk-in' || !value) {
            setCustomer(null);
        } else {
            setCustomer(value);
        }
    };
    
    const selectedValue = activeCart?.customerUuid || 'walk-in';

    const handleNewCustomerSuccess = (customer?: Customer) => {
        fetchCustomers();
        if (customer) {
            setCustomer(customer.uuid);
            toast.success(`${customer.firstName} a été associé à cette vente.`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2 mb-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> Relation Client Elite
                </h3>
                <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">
                    {customers.length} Partenaires Enregistrés
                </span>
            </div>
            
            <Combobox
                id="sell-customer-combobox"
                options={customerOptions}
                value={selectedValue}
                onSelect={handleSelect}
                placeholder="Identifier le client [F4]..."
                searchPlaceholder="Rechercher par nom ou mobile..."
                onSearchChange={setSearchQuery}
                shouldFilter={false}
                notFoundMessage={
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="p-4 rounded-full bg-muted/20 border border-dashed border-white/5">
                            <UserPlus className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-bold">Aucun partenaire trouvé</p>
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40">Inscrire un nouveau profil ?</p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsDialogOpen(true)}
                            className="rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                            <UserPlus className="mr-2 h-3.5 w-3.5" /> Création Express
                        </Button>
                    </div>
                }
            />

            <CustomerDialog 
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                customer={null}
                onSuccess={handleNewCustomerSuccess}
            />
        </div>
    );
}
