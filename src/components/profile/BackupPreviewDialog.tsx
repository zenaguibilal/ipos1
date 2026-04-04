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
    Hash,
    Tag,
    Clock
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

    useEffect(() => {
        if (isOpen) {
            setData(initialData);
        }
    }, [initialData, isOpen]);

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
            const table = [...(newData[category] || [])];
            if (table[index]) {
                table[index] = { ...table[index], [field]: value };
                newData[category] = table;
            }
            return { ...newData };
        });
    }, []);

    const handleRemoveRow = useCallback((category: string, index: number) => {
        setData(prev => {
            const newData = { ...prev };
            if (newData[category]) {
                newData[category] = newData[category].filter((_, i) => i !== index);
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
            await backupService.restoreBackup(data);
            toast.success("Système restauré souverainement.");
            onOpenChange(false);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error("Échec de la restauration", { description: error.message });
        } finally {
            setIsRestoring(false);
        }
    };

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
                                <DialogTitle className="text-2xl font-black tracking-tighter">Manifeste Souverain</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Inspection et édition complète avant injection</DialogDescription>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest" disabled={isRestoring}>
                                Annuler
                            </Button>
                            <Button onClick={handleRestore} disabled={isRestoring} className="flex-1 sm:flex-none h-12 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-3">
                                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Déployer ce Manifeste
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    {/* Sidebar: Navigation */}
                    <div className="w-full lg:w-72 bg-muted/20 border-r border-white/5 p-6 space-y-2 shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-6 px-4">Segments de Données</p>
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
                                <span className="text-[10px] font-black uppercase">Sécurité Elite</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground font-medium leading-relaxed">
                                Les modifications sont temporaires jusqu'à la validation. L'historique (Ventes) est protégé en lecture seule.
                            </p>
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
                                {activeCategory === 'products' && (
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-white/5">
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Désignation</TableHead>
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Rayon</TableHead>
                                                <TableHead className="text-right font-black text-[9px] uppercase tracking-widest">P.U Achat</TableHead>
                                                <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-primary">P.U Vente</TableHead>
                                                <TableHead className="text-center font-black text-[9px] uppercase tracking-widest">Stock</TableHead>
                                                <TableHead className="text-center font-black text-[9px] uppercase tracking-widest">Alerte</TableHead>
                                                <TableHead className="text-center font-black text-[9px] uppercase tracking-widest">Unité</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.map((p: any, idx: number) => (
                                                <TableRow key={p.uuid || idx} className="border-white/5 group hover:bg-white/5 transition-all">
                                                    <TableCell className="p-2 min-w-[200px]">
                                                        <Input value={p.name} onChange={e => handleUpdateField('products', idx, 'name', e.target.value)} className="h-9 bg-transparent border-none focus-visible:ring-primary font-bold shadow-none p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2 min-w-[120px]">
                                                        <Input value={p.category || ''} onChange={e => handleUpdateField('products', idx, 'category', e.target.value)} className="h-9 bg-transparent border-none text-muted-foreground text-xs shadow-none p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input type="number" step="0.1" value={p.purchasePrice} onChange={e => handleUpdateField('products', idx, 'purchasePrice', Number(e.target.value))} className="h-9 bg-transparent border-none text-right font-mono text-xs p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input type="number" step="0.1" value={p.price} onChange={e => handleUpdateField('products', idx, 'price', Number(e.target.value))} className="h-9 bg-transparent border-none text-right font-black text-primary p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input type="number" value={p.quantity} onChange={e => handleUpdateField('products', idx, 'quantity', Number(e.target.value))} className="h-9 bg-transparent border-none text-center font-black p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input type="number" value={p.minStockLevel} onChange={e => handleUpdateField('products', idx, 'minStockLevel', Number(e.target.value))} className="h-9 bg-transparent border-none text-center text-amber-500 font-bold p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2 min-w-[80px]">
                                                        <Input value={p.unite || 'Pièce'} onChange={e => handleUpdateField('products', idx, 'unite', e.target.value)} className="h-9 bg-transparent border-none text-center text-[10px] font-black uppercase p-2" />
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
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Identité Client</TableHead>
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Téléphone</TableHead>
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Adresse</TableHead>
                                                <TableHead className="text-right font-black text-[9px] uppercase tracking-widest">Limite Crédit</TableHead>
                                                <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-destructive">Solde Du</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.map((c: any, idx: number) => (
                                                <TableRow key={c.uuid || idx} className="border-white/5 group hover:bg-white/5">
                                                    <TableCell className="p-2">
                                                        <div className="flex gap-1">
                                                            <Input value={c.firstName} onChange={e => handleUpdateField('customers', idx, 'firstName', e.target.value)} className="h-9 bg-transparent border-none font-bold shadow-none p-2 w-24" />
                                                            <Input value={c.lastName} onChange={e => handleUpdateField('customers', idx, 'lastName', e.target.value)} className="h-9 bg-transparent border-none font-bold shadow-none p-2 w-24" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input value={c.phone || ''} onChange={e => handleUpdateField('customers', idx, 'phone', e.target.value)} className="h-9 bg-transparent border-none text-muted-foreground p-2 font-mono text-xs" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input value={c.address || ''} onChange={e => handleUpdateField('customers', idx, 'address', e.target.value)} className="h-9 bg-transparent border-none text-muted-foreground p-2 text-xs" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input type="number" value={c.creditLimit || 0} onChange={e => handleUpdateField('customers', idx, 'creditLimit', Number(e.target.value))} className="h-9 bg-transparent border-none text-right font-bold text-amber-600 p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input type="number" value={c.outstandingBalance || 0} onChange={e => handleUpdateField('customers', idx, 'outstandingBalance', Number(e.target.value))} className="h-9 bg-transparent border-none text-right font-black text-destructive p-2" />
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

                                {activeCategory === 'suppliers' && (
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-white/5">
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Établissement</TableHead>
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Responsable</TableHead>
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Contact (Tél/Email)</TableHead>
                                                <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-destructive">Solde Du</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.map((s: any, idx: number) => (
                                                <TableRow key={s.uuid || idx} className="border-white/5 group hover:bg-white/5">
                                                    <TableCell className="p-2">
                                                        <Input value={s.name} onChange={e => handleUpdateField('suppliers', idx, 'name', e.target.value)} className="h-9 bg-transparent border-none font-black shadow-none p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input value={s.contactPerson || ''} onChange={e => handleUpdateField('suppliers', idx, 'contactPerson', e.target.value)} className="h-9 bg-transparent border-none text-muted-foreground p-2 font-bold" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <div className="flex flex-col gap-1">
                                                            <Input value={s.phone || ''} onChange={e => handleUpdateField('suppliers', idx, 'phone', e.target.value)} className="h-7 bg-transparent border-none text-muted-foreground p-2 font-mono text-[10px]" placeholder="Téléphone..." />
                                                            <Input value={s.email || ''} onChange={e => handleUpdateField('suppliers', idx, 'email', e.target.value)} className="h-7 bg-transparent border-none text-muted-foreground p-2 font-mono text-[10px]" placeholder="Email..." />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input type="number" value={s.balance || 0} onChange={e => handleUpdateField('suppliers', idx, 'balance', Number(e.target.value))} className="h-9 bg-transparent border-none text-right font-black text-destructive p-2" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRow('suppliers', idx)} className="text-destructive/20 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}

                                {activeCategory === 'expenses' && (
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-white/5">
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Date</TableHead>
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Désignation</TableHead>
                                                <TableHead className="font-black text-[9px] uppercase tracking-widest">Poste</TableHead>
                                                <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-destructive">Montant</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.map((e: any, idx: number) => (
                                                <TableRow key={e.uuid || idx} className="border-white/5 group hover:bg-white/5">
                                                    <TableCell className="p-2">
                                                        <Input type="date" value={e.expenseDate ? new Date(e.expenseDate).toISOString().split('T')[0] : ''} onChange={val => handleUpdateField('expenses', idx, 'expenseDate', new Date(val.target.value))} className="h-9 bg-transparent border-none text-muted-foreground p-2 font-mono text-[10px]" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input value={e.description} onChange={val => handleUpdateField('expenses', idx, 'description', val.target.value)} className="h-9 bg-transparent border-none font-bold shadow-none p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input value={e.category || ''} onChange={val => handleUpdateField('expenses', idx, 'category', val.target.value)} className="h-9 bg-transparent border-none text-xs text-muted-foreground p-2" />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input type="number" value={e.amount} onChange={val => handleUpdateField('expenses', idx, 'amount', Number(val.target.value))} className="h-9 bg-transparent border-none text-right font-black text-destructive p-2" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRow('expenses', idx)} className="text-destructive/20 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}

                                {activeCategory === 'others' && (
                                    <div className="space-y-6">
                                        <div className="p-10 rounded-[2.5rem] bg-muted/10 border border-dashed border-white/5 text-center flex flex-col items-center gap-4 opacity-40">
                                            <Archive className="h-12 w-12" />
                                            <div>
                                                <p className="text-sm font-bold">Flux de Transactions & Audit</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest mt-1">Ces données sont protégées en lecture seule pour garantir l'intégrité comptable du système lors du déploiement.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {filteredData.slice(0, 50).map((item: any, i: number) => (
                                                <div key={i} className="p-4 rounded-2xl bg-black/20 border border-white/5 font-mono text-[9px] text-muted-foreground/60 break-all group hover:bg-black/40 transition-all">
                                                    <div className="flex items-center gap-2 mb-2 text-primary opacity-40">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="uppercase tracking-widest">Flux JSON #{i+1}</span>
                                                    </div>
                                                    {JSON.stringify(item)}
                                                </div>
                                            ))}
                                        </div>
                                        {filteredData.length > 50 && (
                                            <p className="text-center text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] py-8 border-t border-white/5 mt-8">... +{filteredData.length - 50} flux additionnels dans ce segment ...</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="bg-black/40 p-8 border-t border-white/5 flex justify-between items-center text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-30">
                    <span className="flex items-center gap-2 italic"><CheckCircle2 className="h-3 w-3" /> Certifié Souverain</span>
                    <span>iPOS Luxury Elite Manifest Engine v1.9.2</span>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
