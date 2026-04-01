'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Banknote, Calendar, FileText, CheckCircle2, ArrowRight, Wallet } from 'lucide-react';
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
  const newBalance = Math.max(0, customer.outstandingBalance - paymentAmount);
  const isFullySettled = paymentAmount >= customer.outstandingBalance && customer.outstandingBalance > 0;

  const handlePayAll = () => {
    setAmount(String(customer.outstandingBalance));
  };

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) {
      toast.error('Veuillez entrer un montant supérieur à zéro.');
      return;
    }
    
    // Safety check: Prevent excessive payments if not intentional
    if (paymentAmount > customer.outstandingBalance + 0.01) {
        toast.warning('Le montant dépasse la dette actuelle. Le solde deviendra négatif (crédit).');
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

      toast.success(`Paiement de ${formatCurrency(paymentAmount)} enregistré pour ${customer.firstName}.`);
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
      <DialogContent className="sm:max-w-[500px] overflow-hidden border-none shadow-2xl">
        <DialogHeader className="space-y-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Wallet className="h-6 w-6" />
            </div>
            <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Enregistrer un règlement</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                    Client: <span className="font-bold text-foreground">{customer.firstName} {customer.lastName}</span>
                </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative overflow-hidden p-4 rounded-2xl border bg-card/50 backdrop-blur-sm">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Dette Actuelle</p>
                <p className="text-lg font-black text-destructive">{formatCurrency(customer.outstandingBalance)}</p>
                <div className="absolute -right-2 -bottom-2 opacity-5">
                    <Banknote className="h-16 w-16" />
                </div>
            </div>
            <div className={cn(
                "relative overflow-hidden p-4 rounded-2xl border transition-all duration-500",
                isFullySettled ? "bg-green-500/10 border-green-500/50" : "bg-card/50"
            )}>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Nouveau Solde</p>
                <div className="flex items-center gap-2">
                    <p className={cn("text-lg font-black transition-colors", isFullySettled ? "text-green-500" : "text-foreground")}>
                        {formatCurrency(newBalance)}
                    </p>
                    {isFullySettled && <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in" />}
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-5">
                    <CheckCircle2 className="h-16 w-16" />
                </div>
            </div>
          </div>

          {/* Main Input Section */}
          <div className="space-y-4 bg-muted/30 p-6 rounded-3xl border border-white/5">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <Label htmlFor="payment-amount" className="text-sm font-semibold ml-1">Montant Reçu (DA)</Label>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-primary font-bold hover:bg-primary/10 rounded-lg text-xs"
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
                    placeholder="0.0"
                    className="text-4xl h-20 text-center font-black pr-12 focus-visible:ring-primary border-none bg-background shadow-inner rounded-2xl"
                    autoFocus
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xl">
                    DA
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                        <Calendar className="h-3 w-3" />
                        Date du paiement
                    </Label>
                    <DatePicker date={paymentDate} setDate={setPaymentDate} />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                        <FileText className="h-3 w-3" />
                        Note ou référence
                    </Label>
                    <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Espèces, Chèque..."
                        className="h-10 rounded-xl bg-background border-none"
                    />
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1 rounded-xl h-12">
            Annuler
          </Button>
          <Button 
            onClick={handleAddPayment} 
            disabled={isLoading || paymentAmount <= 0}
            className="flex-1 rounded-xl h-12 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
            )}
            Confirmer le règlement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
