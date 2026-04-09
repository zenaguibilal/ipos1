'use client';

import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '@/services/expense.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import DeleteExpenseDialog from '@/components/expenses/DeleteExpenseDialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

export default function ExpensesPage() {
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.expensesViewMode,
        setViewMode: state.actions.setExpensesViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const [expenses, setExpenses] = useState<Expense[] | undefined>(undefined);
    const [categories, setCategories] = useState<string[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isMounted || !dateRange?.from) return;
        setIsRefreshing(true);
        try {
            const [data, cats] = await Promise.all([
                expenseService.filter({ from: dateRange.from, to: dateRange.to }),
                expenseService.getCategories()
            ]);
            setExpenses(data);
            setCategories(cats);
        } finally {
            setIsRefreshing(false);
        }
    }, [isMounted, dateRange]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="p-3 sm:p-4 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <PageHeader title="Charges & Dépenses" description="Suivi de trésorerie">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchData()} className="h-8 px-2"><RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} /></Button>
                    <Button size="sm" onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }} className="h-8 font-bold text-[10px] uppercase">Nouvelle Dépense</Button>
                </div>
            </PageHeader>

            <div className="flex gap-2 items-center bg-white/50 p-2 rounded-lg border shadow-sm">
                <DateRangePicker date={dateRange} setDate={setDate} />
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                    <Input placeholder="Filtrer..." className="pl-8 h-8 text-xs bg-transparent border-none focus-visible:ring-0" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex gap-1 items-center">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}><LayoutGrid className="h-3.5 w-3.5"/></Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5"/></Button>
                </div>
            </div>

            <div className="min-h-[400px]">
                {expenses === undefined ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
                ) : expenses.length === 0 ? (
                    <EmptyState icon={Archive} title="Aucune dépense" description="Registre vide." />
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                            {expenses.map(e => <ExpenseCard key={e.uuid} expense={e} onEdit={() => { setSelectedExpense(e); setIsExpenseDialogOpen(true); }} onDelete={() => { setSelectedExpense(e); setIsDeleteDialogOpen(true); }} isSelected={false} onToggleSelection={() => {}} />)}
                        </div>
                    ) : <ExpenseTable expenses={expenses} onEdit={(e) => { setSelectedExpense(e); setIsExpenseDialogOpen(true); }} onDelete={(e) => { setSelectedExpense(e); setIsDeleteDialogOpen(true); }} selectedExpenses={new Set()} onToggleSelection={() => {}} onToggleSelectAll={() => {}} />
                )}
            </div>

            <ExpenseDialog isOpen={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen} expense={selectedExpense} onSuccess={fetchData} existingCategories={categories} />
            <DeleteExpenseDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} expense={selectedExpense} onSuccess={fetchData} />
        </div>
    );
}