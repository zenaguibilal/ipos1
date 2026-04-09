'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { toast } from 'sonner';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { customerService } from '@/services/customer.service';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

function CustomersContent() {
    const searchParams = useSearchParams();
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.customersViewMode,
        setViewMode: state.actions.setCustomersViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [customers, setCustomers] = useState<Customer[] | undefined>(undefined);
    const isLoading = customers === undefined;

    const fetchCustomers = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await customerService.filterCustomers({
                query: debouncedSearchQuery,
                status: filterStatus,
            });
            setCustomers(data);
        } finally {
            setIsRefreshing(false);
        }
    }, [debouncedSearchQuery, filterStatus]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    return (
        <div className="p-3 sm:p-4 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <PageHeader title="Relation Client" description="Gestion des comptes">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchCustomers()} className="h-8 px-2"><RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} /></Button>
                    <Button size="sm" onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }} className="h-8 font-bold text-[10px] uppercase">Nouveau</Button>
                </div>
            </PageHeader>

            <CustomerStats />

            <div className="flex gap-2 items-center bg-white/50 p-2 rounded-lg border shadow-sm">
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                    <Input placeholder="Chercher un client..." className="pl-8 h-8 text-xs bg-transparent border-none focus-visible:ring-0" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex gap-1 items-center">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}><LayoutGrid className="h-3.5 w-3.5"/></Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5"/></Button>
                </div>
            </div>

            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
                ) : customers.length === 0 ? (
                    <EmptyState icon={Users} title="Aucun client" description="La liste est vide." />
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-3">
                            {customers.map(c => <CustomerCard key={c.uuid} customer={c} onEdit={() => { setSelectedCustomer(c); setIsCustomerDialogOpen(true); }} onDelete={() => { setSelectedCustomer(c); setIsDeleteDialogOpen(true); }} isSelected={false} onToggleSelection={() => {}} isSelectionActive={false} />)}
                        </div>
                    ) : (
                        <CustomerTable customers={customers} onEdit={(c) => { setSelectedCustomer(c); setIsCustomerDialogOpen(true); }} onDelete={(c) => { setSelectedCustomer(c); setIsDeleteDialogOpen(true); }} selectedCustomers={new Set()} onToggleSelection={() => {}} onToggleSelectAll={() => {}} />
                    )
                )}
            </div>

            <CustomerDialog isOpen={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen} customer={selectedCustomer} onSuccess={fetchCustomers} />
            <DeleteCustomerDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} customer={selectedCustomer} onSuccess={fetchCustomers} />
        </div>
    );
}

export default function CustomersPage() { return <Suspense><CustomersContent /></Suspense>; }