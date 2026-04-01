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

export function CustomerCombobox() {
    const { setCustomer } = useCartActions();
    const activeCart = useActiveCart();
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
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
                ? `Dette: ${formatCurrency(c.outstandingBalance)}` 
                : undefined,
            subLabelClassName: c.debtStatus === 'overdue' ? 'text-destructive' : 'text-muted-foreground',
        }));

        options.unshift({
            value: 'walk-in',
            label: 'Client de Passage',
            subLabel: "Aucun historique ou crédit n'est suivi.",
        });

        return options;
    }, [customers]);

    const handleSelect = (value: string) => {
        if (value === 'walk-in') {
            setCustomer(null);
        } else {
            setCustomer(value);
        }
    };
    
    const selectedValue = activeCart?.customerUuid || 'walk-in';

    return (
        <Combobox
            id="sell-customer-combobox"
            options={customerOptions}
            value={selectedValue}
            onSelect={handleSelect}
            placeholder="Sélectionner un client [F4]..."
            searchPlaceholder="Rechercher un client..."
            notFoundMessage="Aucun client trouvé."
            onSearchChange={setSearchQuery}
        />
    );
}
