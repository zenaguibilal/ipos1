
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseService } from '@/services/expense.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, 
    FileUp, 
    Search, 
    RefreshCw, 
    Wallet, 
    FilterX, 
    PieChart,
    CalendarDays,
    BarChart3,
    Trash2,
    X,
    Printer,
    SortAsc,
    Sparkles,
    TrendingDown,
    Filter,
    LayoutGrid,
    List
} from 'lucide-react';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
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
import { useAppStore } from '@/stores/appStore';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Papa from 'papaparse';

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

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="luxury-card h-full bg-card/40 backdrop-blur-2xl border-white/5 rounded-[2rem] group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground group-hover:text-primary transition-all duration-500">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-3xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1">{value}</div>
            {subtitle && <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
    </Card>
);

export default function ExpensesPage() {
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.expensesViewMode,
        setViewMode: state.actions.setExpensesViewMode,
    }));

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

    const handleToggleSelectAll = () => {
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
                    <title>Rapport de Dépenses - iPOS Luxury</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
                        header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: -0.05em; }
                        .meta { text-align: right; font-size: 12px; color: #666; }
                        .summary-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                        .stat-card { border: 1px solid #eee; padding: 15px; border-radius: 12px; text-align: center; }
                        .stat-card h4 { margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.1em; }
                        .stat-card p { margin: 0; font-size: 18px; font-weight: 900; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                        th, td { border-bottom: 1px solid #eee; padding: 12px 8px; text-align: left; }
                        th { background-color: #f9f9f9; font-weight: 900; text-transform: uppercase; color: #666; }
                        .amount { text-align: right; font-family: monospace; font-size: 12px; font-weight: 700; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <header>
                        <div>
                            <h1>${profile?.companyName || 'Mon Commerce Luxury'}</h1>
                            <p>${profile?.address || ''} | ${profile?.phone || ''}</p>
                        </div>
                        <div class="meta">
                            <p>RAPPORT DE DÉPENSES ELITE</p>
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
        <div className="p-6 sm:p-10 space-y-10 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader
                title="Registre des Charges"
                description="Pilotage souverain des flux sortants et de la trésorerie"
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" onClick={handlePrintSummary} className="flex-1 sm:flex-none h-12 rounded-2xl font-black text-xs uppercase tracking-widest border-primary/20 hover:bg-primary/5 transition-all">
                        <Printer className="mr-2 h-4 w-4 text-primary" /> Rapport
                    </Button>
                    <Button variant="outline" onClick={handleExportCsv} className="flex-1 sm:flex-none h-12 rounded-2xl font-black text-xs uppercase tracking-widest border-primary/20 hover:bg-primary/5 transition-all">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button 
                        onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}
                        className="flex-1 sm:flex-none h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Décaissements" 
                    value={formatCurrency(stats.total)} 
                    icon={Wallet} 
                    colorClass="bg-destructive/10 text-destructive"
                    subtitle={`${stats.count} opérations validées`}
                />
                <StatCard 
                    title="Charge Journalière" 
                    value={formatCurrency(stats.dailyAverage)} 
                    icon={TrendingDown} 
                    colorClass="bg-primary/10 text-primary"
                    subtitle="Moyenne sur la période"
                />
                <StatCard 
                    title="Poste Dominant" 
                    value={stats.topCategory} 
                    icon={PieChart} 
                    colorClass="bg-amber-500/10 text-amber-500"
                    subtitle="Plus gros centre de coût"
                />
                <StatCard 
                    title="Fréquence Flux" 
                    value={(stats.count / (dateRange?.to && dateRange?.from ? Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1) : 1)).toFixed(1)} 
                    icon={CalendarDays} 
                    colorClass="bg-emerald-500/10 text-emerald-500"
                    subtitle="Opérations par jour"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-3 luxury-card bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tighter">Analyse par Poste</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Répartition budgétaire par catégorie</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 h-[350px]">
                        {isLoading ? (
                            <Skeleton className="h-full w-full rounded-[2rem] bg-card/40" />
                        ) : stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={stats.chartData} layout="vertical" margin={{ left: 40, right: 40, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        tick={{ fontSize: 10, fontWeight: '900', fill: 'hsl(var(--muted-foreground))' }}
                                        width={100}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 12 }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                                        formatter={(val: number) => [formatCurrency(val), 'Montant']}
                                    />
                                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={28}>
                                        {stats.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground/30 font-black uppercase tracking-widest text-[10px]">
                                <Sparkles className="mr-2 h-4 w-4" /> Aucun flux détecté
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/20 p-2 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
                <div className="relative group flex-grow max-w-xl px-4">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-500" />
                    <Input 
                        placeholder="Rechercher par description..."
                        className="pl-14 h-14 rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20 font-bold text-lg"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 px-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-12 rounded-xl border-white/5 bg-black/20 hover:bg-white/5 font-bold px-6">
                                <Filter className="mr-2 h-4 w-4 opacity-50" />
                                {selectedCategory === 'all' ? 'Toutes Catégories' : selectedCategory}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-2xl border-white/5 shadow-2xl min-w-[200px] max-h-80 overflow-y-auto">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrer par Poste</DropdownMenuLabel>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuCheckboxItem checked={selectedCategory === 'all'} onCheckedChange={() => setSelectedCategory('all')}>Toutes les catégories</DropdownMenuCheckboxItem>
                            {categories?.map(cat => (
                                <DropdownMenuCheckboxItem key={cat} checked={selectedCategory === cat} onCheckedChange={() => setSelectedCategory(cat)}>{cat}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-12 rounded-xl border-white/5 bg-black/20 hover:bg-white/5 font-bold px-6">
                                <SortAsc className="mr-2 h-4 w-4 opacity-50" />
                                {sortOptions[sortBy as keyof typeof sortOptions]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-2xl border-white/5 shadow-2xl min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trier par</DropdownMenuLabel>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key} className="text-xs font-bold">{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DateRangePicker date={dateRange} setDate={setDate} />

                    <div className="flex items-center gap-1 p-1 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                        <Button 
                            variant={viewMode === 'grid' ? 'secondary': 'ghost'} 
                            size="icon" 
                            className="rounded-xl h-10 w-10" 
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-5 w-5"/>
                        </Button>
                        <Button 
                            variant={viewMode === 'list' ? 'secondary': 'ghost'} 
                            size="icon" 
                            className="rounded-xl h-10 w-10" 
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-5 w-5"/>
                        </Button>
                    </div>

                    {isFiltered && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-12 w-12 rounded-2xl text-destructive hover:bg-destructive/10"
                            onClick={resetFilters}
                        >
                            <FilterX className="h-5 w-5" />
                        </Button>
                    )}

                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-12 w-12 rounded-2xl border-white/5 bg-card/40 hover:bg-primary/10 transition-all group"
                        onClick={fetchExpenses}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-5 w-5 text-primary transition-all duration-1000", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>
            
            {selectedExpenses.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-3xl border-2 border-primary/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-10">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                                {selectedExpenses.size}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sélection Elite</span>
                                <span className="text-xs font-black text-primary">{formatCurrency(selectedTotal)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={handleExportCsv} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter (.csv)
                            </Button>
                            <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(true)} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all">
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer Flux
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedExpenses(new Set())} className="rounded-full h-12 w-12 hover:bg-white/5 transition-all">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
               {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => <Skeleton key={`skel-exp-${i}`} className="h-56 w-full rounded-[2.5rem] bg-card/40 animate-pulse" />)}
                    </div>
               ) : expenses.length === 0 ? (
                    <EmptyState
                        icon={TrendingDown}
                        title="Silence de Caisse"
                        description={isFiltered ? "Ajustez vos filtres pour localiser les charges." : "Enregistrer votre première opération Elite."}
                    >
                        {isFiltered ? (
                            <Button variant="outline" onClick={resetFilters} className="rounded-2xl h-12 font-bold px-8 border-primary/20 hover:bg-primary/5">Réinitialiser</Button>
                        ) : (
                            <Button onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }} className="rounded-[1.5rem] h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3">
                                <Plus className="h-5 w-5" /> Enregistrer un Flux
                            </Button>
                        )}
                    </EmptyState>
               ) : (
                    viewMode === 'list' ? (
                        <ExpenseTable 
                            expenses={expenses}
                            onEdit={handleEditExpense}
                            onDelete={handleDeleteExpense}
                            selectedExpenses={selectedExpenses}
                            onToggleSelection={handleToggleSelection}
                            onToggleSelectAll={handleToggleSelectAll}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                    )
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
