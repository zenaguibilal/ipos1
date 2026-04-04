'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
    Database, 
    CheckCircle2, 
    X, 
    Package, 
    Users2, 
    Archive, 
    Coins, 
    AlertTriangle, 
    Search,
    Save,
    Trash2,
    Loader2,
    CheckSquare,
    Square,
    Eye
} from 'lucide-react';
import { backupService } from '@/services/backup.service';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface BackupPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: Record<string, any[]>;
}

type Category = 'products' | 'customers' | 'suppliers' | 'expenses' | 'sales' | 'inventory_logs' | 'payments' | 'bread_orders';

export function BackupPreviewDialog({ isOpen, onOpenChange, initialData }: BackupPreviewDialogProps) {
    const [data, setData] = useState<Record<string, any[]>>(initialData);
    const [activeCategory, setActiveCategory] = useState<Category>('products');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);

    // Selection States
    const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set(['products', 'customers', 'suppliers']));
    const [selectedColumns, setSelectedColumns] = useState<Record<string, Set<string>>>({});

    useEffect(() => {
        if (isOpen && initialData) {
            setData(initialData);
            const cols: Record<string, Set<string>> = {};
            Object.keys(initialData).forEach(table => {
                if (initialData[table].length > 0) {
                    // Pre-select all columns by default
                    cols[table] = new Set(Object.keys(initialData[table][0]).filter(k => k !== 'id'));
                }
            });
            setSelectedColumns(cols);
        }
    }, [initialData, isOpen]);

    const categories = [
        { id: 'products', label: 'Produits', icon: Package, count: data.products?.length || 0 },
        { id: 'customers', label: 'Clients', icon: Users2, count: data.customers?.length || 0 },
        { id: 'suppliers', label: 'Fournisseurs', icon: Archive, count: data.suppliers?.length || 0 },
        { id: 'expenses', label: 'Charges', icon: Coins, count: data.expenses?.length || 0 },
        { id: 'sales', label: 'Ventes', icon: Archive, count: data.sales?.length || 0 },
        { id: 'payments', label: 'Paiements', icon: Coins, count: data.payments?.length || 0 },
        { id: 'bread_orders', label: 'Pain', icon: Database, count: data.bread_orders?.length || 0 },
    ];

    const toggleTable = (tableId: string) => {
        const next = new Set(selectedTables);
        if (next.has(tableId)) next.delete(tableId);
        else next.add(tableId);
        setSelectedTables(next);
    };

    const toggleColumn = (tableId: string, column: string) => {
        const nextCols = new Set(selectedColumns[tableId] || []);
        if (nextCols.has(column)) nextCols.delete(column);
        else nextCols.add(column);
        setSelectedColumns(prev => ({ ...prev, [tableId]: nextCols }));
    };

    const handleUpdateField = useCallback((category: string, index: number, field: string, value: any) => {
        setData(prev => {
            const newData = { ...prev };
            const table = [...(newData[category] || [])];
            if (table[index]) {
                table[index] = { ...table[index], [field]: value };
                newData[category] = table;
            }
            return { ...newData };
        });
    }, []);

    const filteredData = useMemo(() => {
        const table = data[activeCategory] || [];
        if (!searchQuery.trim()) return table;
        const q = searchQuery.toLowerCase();
        return table.filter((item: any) => {
            const text = JSON.stringify(item).toLowerCase();
            return text.includes(q);
        });
    }, [data, activeCategory, searchQuery]);

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            // Filter data based on selections
            const finalManifest: Record<string, any[]> = {};
            selectedTables.forEach(table => {
                const tableData = data[table] || [];
                const tableCols = selectedColumns[table];
                if (!tableCols) return;

                finalManifest[table] = tableData.map(record => {
                    const filteredRecord: any = { uuid: record.uuid }; // UUID is always mandatory
                    tableCols.forEach(col => {
                        filteredRecord[col] = record[col];
                    });
                    return filteredRecord;
                });
            });

            await backupService.restoreBackup(finalManifest);
            toast.success("Système restauré souverainement.");
            onOpenChange(false);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error("Échec de la restauration", { description: error.message });
        } finally {
            setIsRestoring(false);
        }
    };

    const activeCols = Array.from(selectedColumns[activeCategory] || []);
    const availableCols = data[activeCategory]?.length > 0 ? Object.keys(data[activeCategory][0]).filter(k => k !== 'id' && k !== 'uuid') : [];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[3rem] bg-card">
                <DialogHeader className="bg-primary/5 p-8 border-b border-primary/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                                <Database className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tighter">Filtre & Déploiement Elite</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Sélectionnez les segments et colonnes stratégiques à réintégrer</DialogDescription>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest" disabled={isRestoring}>
                                Annuler
                            </Button>
                            <Button onClick={handleRestore} disabled={isRestoring || selectedTables.size === 0} className="flex-1 sm:flex-none h-12 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-3">
                                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Restaurer la Sélection
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    {/* Sidebar: Navigation with Table Selection */}
                    <div className="w-full lg:w-80 bg-muted/20 border-r border-white/5 p-6 space-y-2 shrink-0 overflow-y-auto custom-scrollbar">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-6 px-4">Sélecteur de Segments</p>
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2 group">
                                <Checkbox 
                                    checked={selectedTables.has(cat.id)} 
                                    onCheckedChange={() => toggleTable(cat.id)}
                                    className="h-5 w-5 border-primary data-[state=checked]:bg-primary rounded-lg"
                                />
                                <button
                                    onClick={() => setActiveCategory(cat.id as Category)}
                                    className={cn(
                                        "flex-grow flex items-center justify-between p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                                        activeCategory === cat.id 
                                            ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]" 
                                            : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <cat.icon className="h-4 w-4" />
                                        <span>{cat.label}</span>
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg font-mono",
                                        activeCategory === cat.id ? "bg-white/20" : "bg-black/20"
                                    )}>{cat.count}</span>
                                </button>
                            </div>
                        ))}

                        <div className="mt-10 p-6 bg-primary/5 rounded-[2rem] border border-dashed border-primary/20">
                            <div className="flex items-center gap-2 text-primary mb-3">
                                <Eye className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase">Configuration Colonnes</span>
                            </div>
                            <div className="space-y-3">
                                {availableCols.map(col => (
                                    <div key={col} className="flex items-center gap-3">
                                        <Checkbox 
                                            id={`col-${col}`}
                                            checked={selectedColumns[activeCategory]?.has(col)}
                                            onCheckedChange={() => toggleColumn(activeCategory, col)}
                                            className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary"
                                        />
                                        <label htmlFor={`col-${col}`} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 cursor-pointer">
                                            {col}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content: Global Editor */}
                    <div className="flex-grow flex flex-col min-w-0 bg-black/20">
                        <div className="p-6 border-b border-white/5 bg-card/20 flex gap-4">
                            <div className="relative flex-grow max-w-xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
                                <Input 
                                    placeholder="Recherche dynamique dans ce segment..."
                                    className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-grow">
                            <div className="p-8">
                                {!selectedTables.has(activeCategory) ? (
                                    <div className="h-full py-40 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                                        <Square className="h-16 w-16" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Segment désactivé pour la restauration</p>
                                    </div>
                                ) : (
                                    <div className="rounded-[2rem] border border-white/5 bg-black/40 overflow-hidden shadow-2xl">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="border-white/5">
                                                    {availableCols.map(col => (
                                                        <TableHead key={col} className={cn(
                                                            "font-black text-[9px] uppercase tracking-widest p-4 transition-opacity",
                                                            !selectedColumns[activeCategory]?.has(col) && "opacity-20"
                                                        )}>
                                                            {col}
                                                        </TableHead>
                                                    ))}
                                                    <TableHead className="w-12"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredData.map((item: any, idx: number) => (
                                                    <TableRow key={item.uuid || idx} className="border-white/5 group hover:bg-white/5 transition-all">
                                                        {availableCols.map(col => (
                                                            <TableCell key={col} className={cn(
                                                                "p-2 transition-opacity",
                                                                !selectedColumns[activeCategory]?.has(col) && "opacity-20 grayscale pointer-events-none"
                                                            )}>
                                                                <Input 
                                                                    value={item[col] ?? ''} 
                                                                    onChange={e => handleUpdateField(activeCategory, idx, col, e.target.value)} 
                                                                    className="h-9 bg-transparent border-none focus-visible:ring-primary font-medium text-xs shadow-none p-2 min-w-[100px]" 
                                                                />
                                                            </TableCell>
                                                        ))}
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleUpdateField(activeCategory, idx, '_removed', true)} className="text-destructive/20 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="bg-black/40 p-8 border-t border-white/5 flex justify-between items-center text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-30">
                    <span className="flex items-center gap-2 italic"><CheckCircle2 className="h-3 w-3" /> Manifeste Prêt : {selectedTables.size} segments sélectionnés</span>
                    <span>iPOS Luxury Elite Restore Engine v1.9.2</span>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
