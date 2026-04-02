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
    BarChart3,
    Trash2,
    X,
    Printer,
    BarChart,
    SortAsc,
    CheckSquare
} from 'lucide-react';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import DeleteExpenseDialog from '@/components/expenses/DeleteExpenseDialog';
import { DeleteMultipleExpensesDialog } from '@/components/expenses/DeleteMultipleExpensesDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import Papa from 'papaparse';
import { useAppStore } from '@/stores/appStore';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = [
    'hsl(var(--primary))', 
    'hsl(var(--chart-secondary))', 
    'hsl(var(--chart-tertiary))', 
    'hsl(var(--chart-quaternary))', 
    'hsl(var(--chart-quinary))'
];

const sortOptions = {
    'date_desc': 'Plus récents',
    'date_asc': 'Plus anciens',
    'amount_desc': 'Montant (Max)',
    'amount_asc': 'Montant (Min)',
};

export default function ExpensesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const debouncedSearch = useDebounce(searchQuery, 300);
    
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
    
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const profile = useAppStore(state => state.companyProfile);
    
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
            
            let filteredData = [...data];
            
            if (debouncedSearch) {
                const q = debouncedSearch.toLowerCase();
                filteredData = filteredData.filter(e => e.description.toLowerCase().includes(q));
            }

            // Sorting logic
            filteredData.sort((a, b) => {
                switch(sortBy) {
                    case 'amount_desc': return Number(b.amount) - Number(a.amount);
                    case 'amount_asc': return Number(a.amount) - Number(b.amount);
                    case 'date_asc': return new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
                    case 'date_desc': 
                    default: return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
                }
            });
            
            setExpenses(filteredData);
        } catch (error: any) {
            toast.error("Impossible de charger les dépenses.");
            setExpenses([]);
        } finally {
            setIsRefreshing(false);
        }
    }, [isMounted, selectedCategory, dateRange, debouncedSearch, sortBy]);
    
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

    useEffect(() => {
        setSelectedExpenses(new Set());
    }, [expenses]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedExpenses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (!expenses) return;
        if (selectedExpenses.size === expenses.length) {
            setSelectedExpenses(new Set());
        } else {
            setSelectedExpenses(new Set(expenses.map(e => e.uuid)));
        }
    };

    const stats = useMemo(() => {
        if (!expenses) return { total: 0, count: 0, topCategory: '-', chartData: [], dailyAverage: 0 };
        
        const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
        
        const catMap = new Map<string, number>();
        expenses.forEach(e => {
            catMap.set(e.category, (catMap.get(e.category) || 0) + Number(e.amount));
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

        // Calculate days in period for average
        const days = dateRange?.from && dateRange?.to 
            ? Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1)
            : 1;
        
        const dailyAverage = total / days;

        return { total, count: expenses.length, topCategory: topCat, chartData, dailyAverage };
    }, [expenses, dateRange]);

    const handleExportCsv = () => {
        const dataToExport = selectedExpenses.size > 0 
            ? (expenses?.filter(e => selectedExpenses.has(e.uuid)) || [])
            : (expenses || []);

        if (dataToExport.length === 0) {
            toast.error("Aucune dépense à exporter.");
            return;
        }

        const csv = Papa.unparse(dataToExport.map(e => ({
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
        toast.success(`${dataToExport.length} dépense(s) exportée(s).`);
    };

    const handlePrintSummary = () => {
        if (!expenses || expenses.length === 0) {
            toast.error("Aucune donnée à imprimer.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateStr = dateRange?.from ? `${format(dateRange.from, 'dd/MM/yyyy')} au ${format(dateRange.to!, 'dd/MM/yyyy')}` : 'Toutes les dates';

        const html = `
            <html>
                <head>
                    <title>Rapport de Dépenses - iPOS</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                        header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
                        .meta { text-align: right; font-size: 12px; color: #666; }
                        .summary-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                        .stat-card h4 { margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; color: #888; }
                        .stat-card p { margin: 0; font-size: 18px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                        th, td { border-bottom: 1px solid #eee; padding: 12px 8px; text-align: left; }
                        th { background-color: #f9f9f9; font-weight: bold; text-transform: uppercase; }
                        .amount { text-align: right; font-family: monospace; font-size: 12px; font-weight: bold; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <header>
                        <div>
                            <h1>${profile?.companyName || 'Mon Commerce'}</h1>
                            <p>${profile?.address || ''} | ${profile?.phone || ''}</p>
                        </div>
                        <div class="meta">
                            <p>RAPPORT DE DÉPENSES</p>
                            <p>Période: ${dateStr}</p>
                            <p>Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                    </header>

                    <div class="summary-grid">
                        <div class="stat-card"><h4>Total Dépensé</h4><p>${formatCurrency(stats.total)}</p></div>
                        <div class="stat-card"><h4>Moyenne / Jour</h4><p>${formatCurrency(stats.dailyAverage)}</p></div>
                        <div class="stat-card"><h4>Transactions</h4><p>${stats.count}</p></div>
                        <div class="stat-card"><h4>Poste Principal</h4><p>${stats.topCategory}</p></div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Catégorie</th>
                                <th style="text-align: right;">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map(e => `
                                <tr>
                                    <td>${format(new Date(e.expenseDate), 'dd/MM/yyyy')}</td>
                                    <td><b>${e.description}</b></td>
                                    <td>${e.category}</td>
                                    <td class="amount">${Number(e.amount).toFixed(1)} DA</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
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

    const selectedTotal = useMemo(() => {
        if (!expenses || selectedExpenses.size === 0) return 0;
        return expenses
            .filter(e => selectedExpenses.has(e.uuid))
            .reduce((sum, e) => sum + Number(e.amount), 0);
    }, [expenses, selectedExpenses]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSortBy('date_desc');
    };

    const isFiltered = searchQuery !== '' || selectedCategory !== 'all' || sortBy !== 'date_desc';
    
    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto pb-24">
            <PageHeader
                title="Gestion des Dépenses"
                description="Suivez et analysez toutes les charges de votre établissement."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handlePrintSummary} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <Printer className="mr-2 h-4 w-4 text-primary" /> Rapport
                    </Button>
                    <Button variant="outline" onClick={handleExportCsv} className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button 
                        onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}
                        className="rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden group relative">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                        <Wallet className="h-32 w-32 rotate-12" />
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
                        <BarChart className="h-32 w-32 rotate-6" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                                <BarChart className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Moyenne / Jour</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tighter leading-none text-primary">
                                {isLoading ? '...' : formatCurrency(stats.dailyAverage)}
                            </span>
                        </div>
                        <p className="mt-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">
                            Charge journalière moyenne
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden group relative">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                        <PieChart className="h-32 w-32 -rotate-12" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
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
                                {isLoading ? '...' : (stats.count / (dateRange?.to && dateRange?.from ? Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1) : 1)).toFixed(1)}
                            </span>
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Op/Jour</span>
                        </div>
                        <p className="mt-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">
                            Moyenne des opérations
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-3 rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
                                <BarChart3 className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-tight">Répartition par Catégorie</CardTitle>
                                <CardDescription className="text-[10px] font-medium">Analyse visuelle du poids financier par poste.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 h-[320px]">
                        {isLoading ? (
                            <Skeleton className="h-full w-full rounded-2xl" />
                        ) : stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={stats.chartData} layout="vertical" margin={{ left: 40, right: 40, top: 10, bottom: 10 }}>
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
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground/30 italic text-xs">
                                Aucune donnée visuelle à afficher.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

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
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 min-w-[140px] font-medium">
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-11 border-none shadow-sm bg-card hover:bg-primary/5 min-w-[140px] font-medium">
                                <SortAsc className="mr-2 h-4 w-4 opacity-50" />
                                {sortOptions[sortBy as keyof typeof sortOptions]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trier par</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key} className="text-xs font-bold">{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
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
            
            {selectedExpenses.size > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-card/80 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
                        <div className="flex items-center gap-2 pr-6 border-r border-border/50">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black">
                                {selectedExpenses.size}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Sélection</span>
                                <span className="text-xs font-black text-primary">{formatCurrency(selectedTotal)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={handleExportCsv} className="rounded-full h-10 font-bold hover:bg-primary/10 hover:text-primary">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)} className="rounded-full h-10 font-bold text-destructive hover:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer Tout
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedExpenses(new Set())} className="rounded-full h-10 w-10 hover:bg-muted">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                                isSelected={selectedExpenses.has(e.uuid)}
                                onToggleSelection={() => handleToggleSelection(e.uuid)}
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
            <DeleteMultipleExpensesDialog
                isOpen={isBulkDeleteDialogOpen}
                onOpenChange={setIsBulkDeleteDialogOpen}
                expenseUuids={Array.from(selectedExpenses)}
                onSuccess={() => {
                    setSelectedExpenses(new Set());
                    fetchExpenses();
                }}
            />
        </div>
    );
}
