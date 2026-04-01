'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Banknote, Calendar, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
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
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();
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
  const newBalance = Math.max(0, customer.outstandingBalance - paymentAmount);

  const handlePayAll = () => {
    setAmount(String(customer.outstandingBalance));
  };

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) {
      toast.error('Veuillez entrer un montant supérieur à zero.');
      return;
    }
    if (paymentAmount > customer.outstandingBalance + 0.01) {
        toast.error('Le montant du paiement ne peut pas dépasser le solde impayé.');
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

      toast.success(`Paiement de ${formatCurrency(paymentAmount)} enregistré avec succès.`);
      onPaymentSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement du paiement.", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
                <Banknote className="h-5 w-5 text-primary" />
            </div>
            Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
             Client: <span className="font-bold text-foreground">{customer.firstName} {customer.lastName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Dette Actuelle</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(customer.outstandingBalance)}</p>
            </div>
            <div className={cn(
                "p-3 rounded-xl border transition-colors",
                newBalance === 0 ? "bg-green-500/10 border-green-500/50" : "bg-muted/30"
            )}>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Nouveau Solde</p>
                <div className="flex items-center gap-2">
                    <p className={cn("text-xl font-bold", newBalance === 0 ? "text-green-500" : "text-foreground")}>
                        {formatCurrency(newBalance)}
                    </p>
                    {newBalance === 0 && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="payment-amount" className="text-base">Montant Reçu (DA)</Label>
                <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-primary font-bold"
                    onClick={handlePayAll}
                    type="button"
                >
                    Tout régler
                </Button>
              </div>
              <div className="relative">
                <Input 
                    id="payment-amount" 
                    type="number"
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="0.00"
                    className="text-3xl h-16 text-center font-bold pr-12 focus-visible:ring-primary border-2"
                    autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                    DA
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Date du paiement
                    </Label>
                    <DatePicker date={paymentDate} setDate={setPaymentDate} />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Notes (facultatif)
                    </Label>
                    <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Espèces, Chèque..."
                        className="h-10"
                    />
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
            Annuler
          </Button>
          <Button 
            onClick={handleAddPayment} 
            disabled={isLoading || paymentAmount <= 0}
            className="flex-1 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Confirmer le Paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
