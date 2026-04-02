
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseService } from '@/services/expense.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, 
    Filter, 
    FileUp, 
    Search, 
    RefreshCw, 
    Wallet, 
    FilterX, 
    TrendingDown,
    PieChart,
    CalendarDays,
    BarChart3
} from 'lucide-react';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import DeleteExpenseDialog from '@/components/expenses/DeleteExpenseDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import Papa from 'papaparse';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-secondary))', 'hsl(var(--chart-tertiary))', 'hsl(var(--chart-quaternary))', 'hsl(var(--chart-quinary))'];

export default function ExpensesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [expenses, setExpenses] = useState<Expense[] | undefined>(undefined);
    const [categories, setCategories] = useState<string[] | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isLoading = expenses === undefined || categories === undefined;
    
    const fetchExpenses = useCallback(async () => {
         if (!isMounted || !dateRange?.from || !dateRange?.to) return;
        setIsRefreshing(true);
        try {
            const data = await expenseService.filter({
                category: selectedCategory,
                from: dateRange.from,
                to: dateRange.to
            });
            
            // Filtrage par recherche côté client
            let filteredData = data;
            if (debouncedSearch) {
                const q = debouncedSearch.toLowerCase();
                filteredData = data.filter(e => e.description.toLowerCase().includes(q));
            }
            
            setExpenses(filteredData);
        } catch (error: any) {
            toast.error("Impossible de charger les dépenses.");
            setExpenses([]);
        } finally {
            setIsRefreshing(false);
        }
    }, [isMounted, selectedCategory, dateRange, debouncedSearch]);
    
    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const fetchCategories = useCallback(async () => {
        try {
            const cats = await expenseService.getCategories();
            setCategories(cats);
        } catch (error: any) {
            setCategories([]);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleExportCsv = () => {
        if (!expenses || expenses.length === 0) {
            toast.error("Aucune dépense à exporter.");
            return;
        }

        const csv = Papa.unparse(expenses.map(e => ({
            Date: new Date(e.expenseDate).toLocaleDateString('fr-FR'),
            Description: e.description,
            Catégorie: e.category,
            Montant: e.amount
        })));

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ipos-depenses-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Exportation terminée.");
    };

    const handleEditExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsExpenseDialogOpen(true);
    };

    const handleDeleteExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsDeleteDialogOpen(true);
    };
    
    const onDialogSuccess = () => {
        fetchExpenses();
        fetchCategories();
    };

    const stats = useMemo(() => {
        if (!expenses) return { total: 0, count: 0, topCategory: '-', chartData: [] };
        
        const total = expenses.reduce((acc, e) => acc + e.amount, 0);
        
        const catMap = new Map<string, number>();
        expenses.forEach(e => {
            catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
        });
        
        let topCat = '-';
        let maxVal = 0;
        catMap.forEach((val, cat) => {
            if (val > maxVal) {
                maxVal = val;
                topCat = cat;
            }
        });

        const chartData = Array.from(catMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { total, count: expenses.length, topCategory: topCat, chartData };
    }, [expenses]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
    };

    const isFiltered = searchQuery !== '' || selectedCategory !== 'all';
    
    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto pb-24">
            <PageHeader
                title="Gestion des Dépenses"
                description="Suivez et analysez toutes les charges de votre établissement."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCsv} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter CSV
                    </Button>
                    <Button 
                        onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}
                        className="rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Section */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden group relative">
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                            <TrendingDown className="h-32 w-32 rotate-12" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-destructive/10 text-destructive shadow-inner">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Total Période</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tighter leading-none text-destructive">
                                    {isLoading ? '...' : formatCurrency(stats.total)}
                                </span>
                            </div>
                            <p className="mt-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">
                                Basé sur {stats.count} transaction(s)
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden group relative">
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                            <PieChart className="h-32 w-32 -rotate-12" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                                    <PieChart className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Poste Principal</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black tracking-tighter leading-none truncate max-w-full">
                                    {isLoading ? '...' : stats.topCategory}
                                </span>
                            </div>
                            <p className="mt-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">
                                Catégorie la plus dépensière
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden group relative">
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                            <CalendarDays className="h-32 w-32 rotate-6" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
                                    <CalendarDays className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Fréquence</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tighter leading-none">
                                    {isLoading ? '...' : (stats.count / (dateRange?.to && dateRange?.from ? Math.max(1, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 3600 * 24))) : 1)).toFixed(1)}
                                </span>
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Op/Jour</span>
                            </div>
                            <p className="mt-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">
                                Moyenne sur la plage sélectionnée
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Visual Analysis Chart */}
                <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
                                <BarChart3 className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-tight">Répartition par Catégorie</CardTitle>
                                <CardDescription className="text-[10px] font-medium">Comparaison visuelle des charges financières.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 h-[320px]">
                        {isLoading ? (
                            <Skeleton className="h-full w-full rounded-2xl" />
                        ) : stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData} layout="vertical" margin={{ left: 40, right: 40, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }}
                                        width={100}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 8 }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: number) => [formatCurrency(val), 'Montant']}
                                    />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                        {stats.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground/30 italic text-xs">
                                Aucune donnée visuelle à afficher.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                        placeholder="Rechercher par description..."
                        className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 min-w-[160px] font-medium">
                                <Filter className="mr-2 h-4 w-4 opacity-50" />
                                {selectedCategory === 'all' ? 'Toutes les catégories' : selectedCategory}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px] max-h-80 overflow-y-auto custom-scrollbar">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrer par type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={selectedCategory === 'all'} onCheckedChange={() => setSelectedCategory('all')}>Toutes les catégories</DropdownMenuCheckboxItem>
                            {categories?.map(cat => (
                                <DropdownMenuCheckboxItem key={cat} checked={selectedCategory === cat} onCheckedChange={() => setSelectedCategory(cat)}>{cat}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DateRangePicker date={dateRange} setDate={setDate} />

                    {isFiltered && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10"
                            onClick={resetFilters}
                            title="Réinitialiser"
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}

                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-11 w-11 rounded-xl border-none shadow-sm bg-card"
                        onClick={fetchExpenses}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>
            
            {/* Grid of Expenses */}
            <div className="min-h-[450px] animate-in fade-in duration-500">
               {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="h-44 rounded-3xl animate-pulse bg-card border-none" />
                        ))}
                    </div>
               ) : expenses.length === 0 ? (
                    <EmptyState
                        icon={TrendingDown}
                        title="Aucune dépense trouvée"
                        description={isFiltered ? "Ajustez vos filtres de recherche ou réinitialisez-les." : "Commencez par enregistrer votre première charge financière."}
                    >
                        {isFiltered ? (
                            <Button variant="outline" onClick={resetFilters} className="rounded-xl">Effacer les filtres</Button>
                        ) : (
                            <Button onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> Ajouter une dépense
                            </Button>
                        )}
                    </EmptyState>
               ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {expenses.map(e => (
                            <ExpenseCard 
                                key={e.uuid} 
                                expense={e} 
                                onEdit={handleEditExpense} 
                                onDelete={handleDeleteExpense}
                            />
                        ))}
                    </div>
               )}
            </div>
            
            <ExpenseDialog 
                isOpen={isExpenseDialogOpen}
                onOpenChange={setIsExpenseDialogOpen}
                expense={selectedExpense}
                onSuccess={onDialogSuccess}
                existingCategories={categories || []}
            />
            <DeleteExpenseDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                expense={selectedExpense}
                onSuccess={fetchExpenses}
            />
        </div>
    );
}
