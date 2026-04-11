'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Calendar, FileText, CheckCircle2, Wallet, Info } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { DatePicker } from '../ui/date-picker';
import { paymentService } from '@/services/payment.service';

interface AddPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customer: Customer;
  onPaymentSuccess: () => void;
}

export function AddPaymentDialog({ isOpen, onOpenChange, customer, onPaymentSuccess }: AddPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPaymentDate(new Date());
      setNotes('');
    }
  }, [isOpen]);

  const paymentAmount = parseFloat(amount) || 0;
  const newBalance = customer.outstandingBalance - paymentAmount;
  const isFullySettled = paymentAmount >= customer.outstandingBalance && customer.outstandingBalance > 0;
  const isOverpaying = paymentAmount > customer.outstandingBalance;

  const handlePayAll = () => {
    setAmount(String(customer.outstandingBalance));
  };

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) {
      toast.error('Veuillez entrer un montant supérieur à zéro.');
      return;
    }
    
    if (!paymentDate) {
        toast.error('Veuillez sélectionner une date de paiement.');
        return;
    }
    
    setIsLoading(true);
    try {
      await paymentService.addPayment({
        customerUuid: customer.uuid,
        amount: paymentAmount,
        paymentDate: paymentDate,
        notes: notes || undefined,
      });

      toast.success(`Paiement de ${formatCurrency(paymentAmount)} enregistré.`);
      onPaymentSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement.", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden border-none shadow-sm p-0 gap-0 bg-card">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight">Règlement Client</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            {customer.firstName} {customer.lastName}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border bg-background/50 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Dette Actuelle</p>
                <p className="text-xl font-semibold text-destructive">{formatCurrency(customer.outstandingBalance)}</p>
            </div>
            <div className={cn(
                "p-4 rounded-2xl border transition-all duration-300",
                isFullySettled ? "bg-green-500/10 border-green-500/30" : "bg-background/50 shadow-sm"
            )}>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Nouveau Solde</p>
                <div className="flex items-center gap-2">
                    <p className={cn(
                        "text-xl font-semibold",
                        newBalance <= 0 ? "text-green-500" : "text-foreground"
                    )}>
                        {formatCurrency(Math.max(0, newBalance))}
                    </p>
                    {isFullySettled && <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in" />}
                </div>
            </div>
          </div>

          {/* Amount Input Section */}
          <div className="space-y-4 bg-muted/30 p-6 rounded-3xl border border-border/50">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="payment-amount" className="text-sm font-bold">Montant à encaisser</Label>
                <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-primary font-bold text-xs"
                    onClick={handlePayAll}
                    type="button"
                >
                    Régler la totalité
                </Button>
              </div>
              <div className="relative">
                <Input 
                    id="payment-amount" 
                    type="number"
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="0.00"
                    className="text-xl h-20 text-center font-semibold pr-14 focus-visible:ring-primary border-2 border-transparent focus-visible:border-primary/20 bg-background rounded-2xl shadow-sm transition-all"
                    autoFocus
                    onKeyDown={(e) => { if(e.key === 'Enter') handleAddPayment() }}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg">
                    DA
                </div>
              </div>
              {isOverpaying && (
                  <div className="flex items-center gap-2 text-[11px] font-medium text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      <Info className="h-3 w-3" />
                      <span>Le montant dépasse la dette. Le surplus sera crédité au client.</span>
                  </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground ml-1">
                        <Calendar className="h-3 w-3" />
                        Date
                    </Label>
                    <DatePicker date={paymentDate} setDate={setPaymentDate} />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground ml-1">
                        <FileText className="h-3 w-3" />
                        Référence / Note
                    </Label>
                    <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Espèces, Chèque..."
                        className="h-10 rounded-xl bg-background border-none shadow-sm"
                        onKeyDown={(e) => { if(e.key === 'Enter') handleAddPayment() }}
                    />
                </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card border-t flex gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1 rounded-2xl h-12 font-bold">
            Annuler
          </Button>
          <Button 
            onClick={handleAddPayment} 
            disabled={isLoading || paymentAmount <= 0}
            className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-sm transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
            Confirmer [Enter]
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
