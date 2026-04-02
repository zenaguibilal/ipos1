'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { Loader2, Banknote, Calendar, Tag, FileText } from 'lucide-react';
import { expenseService } from '@/services/expense.service';
import { DatePicker } from '../ui/date-picker';
import { Combobox } from '../ui/combobox';

const defaultCategories: ExpenseCategory[] = ['Loyer', 'Salaires', 'Fournisseurs', 'Services Publics', 'Marketing', 'Maintenance', 'Assurance', 'Transport', 'Autre'];

interface ExpenseDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    expense: Expense | null;
    onSuccess: () => void;
    existingCategories: string[];
}

const initialFormState: Omit<Expense, 'uuid' | 'createdAt' | 'updatedAt'> = {
    description: '',
    category: 'Autre',
    amount: 0,
    expenseDate: new Date(),
};

export default function ExpenseDialog({ isOpen, onOpenChange, expense, onSuccess, existingCategories }: ExpenseDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
        if (expense && isOpen) {
            setFormState({
                description: expense.description,
                category: expense.category,
                amount: expense.amount,
                expenseDate: new Date(expense.expenseDate),
            });
        } else if (!expense && isOpen) {
            setFormState({ ...initialFormState, expenseDate: new Date() });
        }
    }, [expense, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };
    
    const handleCategoryChange = (value: string) => {
        setFormState(prev => ({ ...prev, category: value as ExpenseCategory }));
    };

    const handleDateChange = (date?: Date) => {
        if (date) {
            setFormState(prev => ({ ...prev, expenseDate: date }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { description, amount } = formState;

        if (!description.trim() || amount <= 0) {
            setError("Veuillez remplir la description et un montant valide.");
            setIsLoading(false);
            return;
        }

        try {
            if (expense && expense.uuid) {
                await expenseService.updateExpense(expense.uuid, formState);
                toast.success(`Dépense mise à jour.`);
            } else {
                await expenseService.addExpense(formState);
                toast.success(`Dépense enregistrée avec succès.`);
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
            toast.error("Opération échouée.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const categoryOptions = Array.from(new Set([...defaultCategories, ...existingCategories]))
        .sort()
        .map(c => ({ value: c, label: c }));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight">
                                    {expense ? 'Modifier la Dépense' : 'Enregistrer une Charge'}
                                </DialogTitle>
                                <DialogDescription className="font-medium text-[10px] uppercase tracking-widest text-muted-foreground/60">
                                   Gestion des flux sortants de la caisse.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-xs font-bold border border-destructive/20 text-center">{error}</div>}
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                                    <FileText className="h-3 w-3" /> Description
                                </Label>
                                <Input 
                                    id="description" 
                                    value={formState.description} 
                                    onChange={handleInputChange} 
                                    className="h-12 rounded-xl bg-muted/30 border-none shadow-inner text-base font-bold" 
                                    placeholder="Ex: Facture d'électricité Janvier"
                                    required 
                                    autoFocus 
                                />
                            </div>

                            <div className="p-5 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
                                <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-destructive/70 ml-1">Montant décaissé (DA)</Label>
                                <div className="relative">
                                    <Input 
                                        id="amount" 
                                        type="number" 
                                        step="0.1" 
                                        value={formState.amount || ''} 
                                        onChange={handleInputChange} 
                                        className="h-14 rounded-xl bg-background border-none shadow-inner font-mono font-black text-2xl text-destructive text-center" 
                                        placeholder="0.0"
                                        required 
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-xs text-muted-foreground opacity-30 uppercase">DA</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                                        <Tag className="h-3 w-3" /> Catégorie
                                    </Label>
                                    <Combobox 
                                        options={categoryOptions}
                                        value={formState.category}
                                        onSelect={handleCategoryChange}
                                        placeholder="Choisir..."
                                        searchPlaceholder="Chercher..."
                                        notFoundMessage="Nouvelle catégorie..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Date
                                    </Label>
                                    <DatePicker date={formState.expenseDate} setDate={handleDateChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-card border-t flex gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold flex-1" disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading} className="rounded-xl h-12 font-black text-xs uppercase tracking-widest flex-1 shadow-lg shadow-primary/20">
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {expense ? 'Mettre à jour' : 'Valider la Charge'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
