'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
    ChevronRight,
    Save,
    Trash2
} from 'lucide-react';
import { backupService } from '@/services/backup.service';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BackupPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: Record<string, any[]>;
}

type Category = 'products' | 'customers' | 'suppliers' | 'expenses' | 'others';

export function BackupPreviewDialog({ isOpen, onOpenChange, initialData }: BackupPreviewDialogProps) {
    const [data, setData] = useState<Record<string, any[]>>(initialData);
    const [activeCategory, setActiveCategory] = useState<Category>('products');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);

    const categories = [
        { id: 'products', label: 'Produits', icon: Package, count: data.products?.length || 0 },
        { id: 'customers', label: 'Clients', icon: Users2, count: data.customers?.length || 0 },
        { id: 'suppliers', label: 'Fournisseurs', icon: Archive, count: data.suppliers?.length || 0 },
        { id: 'expenses', label: 'Charges', icon: Coins, count: data.expenses?.length || 0 },
        { id: 'others', label: 'Historique', icon: Database, count: (data.sales?.length || 0) + (data.inventory_logs?.length || 0) },
    ];

    const handleUpdateField = useCallback((category: string, index: number, field: string, value: any) => {
        setData(prev => {
            const newData = { ...prev };
            const table = [...newData[category]];
            table[index] = { ...table[index], [field]: value };
            newData[category] = table;
            return newData;
        });
    }, []);

    const handleRemoveRow = useCallback((category: string, index: number) => {
        setData(prev => {
            const newData = { ...prev };
            newData[category] = newData[category].filter((_, i) => i !== index);
            return newData;
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
            await backupService.restoreBackup(data);
            toast.success("Système restauré avec succès.");
            onOpenChange(false);
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            toast.error("Échec de la restauration", { description: error.message });
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[3rem] bg-card">
                <DialogHeader className="bg-primary/5 p-8 border-b border-primary/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                                <Database className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tighter">Aperçu du Manifeste Souverain</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Vérifiez et éditez les données avant injection</DialogDescription>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest" disabled={isRestoring}>
                                Annuler
                            </Button>
                            <Button onClick={handleRestore} disabled={isRestoring} className="flex-1 sm:flex-none h-12 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-3">
                                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Restaurer le Système
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    {/* Sidebar: Categories */}
                    <div className="w-full lg:w-72 bg-muted/20 border-r border-white/5 p-6 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-6 px-4">Sections de l'Archive</p>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id as Category)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 group",
                                    activeCategory === cat.id 
                                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105" 
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
                        ))}

                        <div className="mt-10 p-6 bg-amber-500/5 rounded-[2rem] border border-dashed border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-600 mb-3">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase">Attention</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground font-medium leading-relaxed">
                                Les modifications effectuées ici ne sont pas permanentes tant que la restauration n'est pas validée.
                            </p>
                        </div>
                    </div>

                    {/* Content: Editor */}
                    <div className="flex-grow flex flex-col min-w-0 bg-black/20">
                        <div className="p-6 border-b border-white/5 bg-card/20 flex gap-4">
                            <div className="relative flex-grow max-w-xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
                                <Input 
                                    placeholder="Rechercher dans cette section..."
                                    className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-grow">
                            <div className="p-8">
                                {activeCategory === 'products' && (
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-white/5">
                                                <TableHead className="font-black text-[10px] uppercase">Désignation</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase">Rayon</TableHead>
                                                <TableHead className="text-right font-black text-[10px] uppercase">P.U Vente</TableHead>
                                                <TableHead className="text-right font-black text-[10px] uppercase">P.U Achat</TableHead>
                                                <TableHead className="text-center font-black text-[10px] uppercase">Stock</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.map((p: any, idx: number) => (
                                                <TableRow key={p.uuid || idx} className="border-white/5 group hover:bg-white/5 transition-all">
                                                    <TableCell className="p-4">
                                                        <Input 
                                                            value={p.name} 
                                                            onChange={e => handleUpdateField('products', idx, 'name', e.target.value)}
                                                            className="h-10 bg-transparent border-none focus-visible:ring-primary font-bold shadow-none p-0"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            value={p.category || ''} 
                                                            onChange={e => handleUpdateField('products', idx, 'category', e.target.value)}
                                                            className="h-10 bg-transparent border-none text-muted-foreground text-xs shadow-none p-0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Input 
                                                            type="number"
                                                            value={p.price} 
                                                            onChange={e => handleUpdateField('products', idx, 'price', Number(e.target.value))}
                                                            className="h-10 bg-transparent border-none text-right font-black text-primary p-0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Input 
                                                            type="number"
                                                            value={p.purchasePrice} 
                                                            onChange={e => handleUpdateField('products', idx, 'purchasePrice', Number(e.target.value))}
                                                            className="h-10 bg-transparent border-none text-right text-muted-foreground p-0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input 
                                                            type="number"
                                                            value={p.quantity} 
                                                            onChange={e => handleUpdateField('products', idx, 'quantity', Number(e.target.value))}
                                                            className="h-10 bg-transparent border-none text-center font-bold p-0"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRow('products', idx)} className="text-destructive/20 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}

                                {activeCategory === 'customers' && (
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-white/5">
                                                <TableHead className="font-black text-[10px] uppercase">Prénom</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase">Nom</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase">Mobile</TableHead>
                                                <TableHead className="text-right font-black text-[10px] uppercase">Solde Du</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.map((c: any, idx: number) => (
                                                <TableRow key={c.uuid || idx} className="border-white/5 group hover:bg-white/5">
                                                    <TableCell>
                                                        <Input 
                                                            value={c.firstName} 
                                                            onChange={e => handleUpdateField('customers', idx, 'firstName', e.target.value)}
                                                            className="h-10 bg-transparent border-none font-bold shadow-none p-0"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            value={c.lastName} 
                                                            onChange={e => handleUpdateField('customers', idx, 'lastName', e.target.value)}
                                                            className="h-10 bg-transparent border-none font-bold shadow-none p-0"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            value={c.phone || ''} 
                                                            onChange={e => handleUpdateField('customers', idx, 'phone', e.target.value)}
                                                            className="h-10 bg-transparent border-none text-muted-foreground p-0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-destructive">
                                                        {formatCurrency(c.outstandingBalance || 0)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRow('customers', idx)} className="text-destructive/20 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}

                                {activeCategory !== 'products' && activeCategory !== 'customers' && (
                                    <div className="space-y-4">
                                        <div className="p-10 rounded-[2.5rem] bg-muted/10 border border-dashed border-white/5 text-center flex flex-col items-center gap-4 opacity-40">
                                            <Archive className="h-12 w-12" />
                                            <div>
                                                <p className="text-sm font-bold">Inspection Historique</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest mt-1">Ces données sont consultables mais protégées contre l'édition directe pour garantir l'intégrité comptable.</p>
                                            </div>
                                        </div>
                                        {filteredData.slice(0, 50).map((item: any, i: number) => (
                                            <div key={i} className="p-4 rounded-2xl bg-black/20 border border-white/5 font-mono text-[10px] text-muted-foreground/60 break-all">
                                                {JSON.stringify(item)}
                                            </div>
                                        ))}
                                        {filteredData.length > 50 && (
                                            <p className="text-center text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] py-4">... {filteredData.length - 50} entrées additionnelles ...</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="bg-black/40 p-8 border-t border-white/5 flex justify-between items-center text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-30">
                    <span>Certifié local-first</span>
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Intégrité Vérifiée</span>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
