
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Supplier } from '@/lib/types';
import { supplierService } from '@/services/supplier.service';
import { toast } from 'sonner';
import { Loader2, HandCoins, CheckCircle2, Wallet } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

export function SupplierPaymentDialog({ isOpen, onOpenChange, supplier, onSuccess }: { isOpen: boolean, onOpenChange: (open: boolean) => void, supplier: Supplier | null, onSuccess: () => void }) {
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
    const [method, setMethod] = useState<'cash' | 'check' | 'transfer'>('cash');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        const amountNum = parseFloat(amount);
        if (!supplier) return;
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error("Veuillez entrer un montant valide.");
            return;
        }
        if (!paymentDate) {
            toast.error("Veuillez sélectionner une date.");
            return;
        }

        setIsLoading(true);
        try {
            await supplierService.processSupplierPayment({
                supplierUuid: supplier.uuid,
                amount: amountNum,
                paymentDate,
                method,
                notes: notes || undefined,
            });
            toast.success("Paiement enregistré avec succès.");
            onSuccess();
            onOpenChange(false);
            setAmount('');
            setNotes('');
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (!supplier) return null;

    const remainingBalance = supplier.balance - (parseFloat(amount) || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl p-0 gap-0 overflow-hidden">
                <div className="bg-primary/5 p-6 border-b border-primary/10">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <HandCoins className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight">Règlement Fournisseur</DialogTitle>
                                <DialogDescription className="font-medium">{supplier.name}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl border bg-background/50 shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Dette Actuelle</p>
                            <p className="text-xl font-black text-destructive">{formatCurrency(supplier.balance)}</p>
                        </div>
                        <div className={cn(
                            "p-4 rounded-2xl border transition-all",
                            remainingBalance <= 0 ? "bg-green-500/10 border-green-500/30" : "bg-background/50 shadow-sm"
                        )}>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Solde Après</p>
                            <p className={cn("text-xl font-black", remainingBalance <= 0 ? "text-green-500" : "text-foreground")}>
                                {formatCurrency(Math.max(0, remainingBalance))}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 bg-muted/30 p-6 rounded-3xl border border-border/50">
                        <div className="space-y-2">
                            <Label htmlFor="pay-amt" className="text-[10px] font-black uppercase tracking-widest ml-1">Montant à verser</Label>
                            <div className="relative">
                                <Input
                                    id="pay-amt"
                                    type="number"
                                    placeholder="0.00"
                                    className="h-16 text-3xl font-black text-center rounded-2xl bg-background border-none shadow-inner"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    autoFocus
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black opacity-30">DA</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Mode</Label>
                                <Select value={method} onValueChange={(v:any) => setMethod(v)}>
                                    <SelectTrigger className="rounded-xl h-10 border-none shadow-sm bg-background"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Espèces</SelectItem>
                                        <SelectItem value="check">Chèque</SelectItem>
                                        <SelectItem value="transfer">Virement</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Date</Label>
                                <DatePicker date={paymentDate} setDate={setPaymentDate} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Notes / Réf</Label>
                            <Input 
                                placeholder="N° chèque, note..." 
                                className="rounded-xl border-none shadow-sm bg-background"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-card border-t flex gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold flex-1">Annuler</Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isLoading || !amount || parseFloat(amount) <= 0}
                        className="rounded-xl h-12 font-bold flex-1 shadow-lg shadow-primary/20 transition-all"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Enregistrer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
