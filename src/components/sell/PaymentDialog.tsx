'use client';

import {
    useState, useEffect, useMemo,
    memo, useCallback,
} from 'react';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Switch }   from '@/components/ui/switch';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import {
    calculateCartTotals, formatCurrency,
    cn, FINANCIAL_EPSILON,
} from '@/lib/utils';
import {
    Loader2, CheckCircle2, AlertCircle,
    Wallet, ShieldAlert, Calendar,
} from 'lucide-react';
import { PrintReceiptDialog } from '../sales/PrintReceiptDialog';
import type { Sale, Customer } from '@/lib/types';
import { DatePicker }       from '../ui/date-picker';
import { addDays, setDate as fnsSetDate, addMonths, isAfter, startOfDay } from 'date-fns';
import { customerService }  from '@/services/customer.service';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function PaymentDialogContent({
    isOpen,
    onOpenChange,
}: {
    isOpen:       boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [isMounted,       setIsMounted]       = useState(false);
    const cart                                  = useActiveCart();
    const { processSale }                       = useCartActions();

    const [amountPaidStr,   setAmountPaidStr]   = useState('0');
    const [dueDate,         setDueDate]         = useState<Date | undefined>();
    const [isLoading,       setIsLoading]       = useState(false);
    const [lastSale,        setLastSale]        = useState<Sale | null>(null);
    const [isReceiptOpen,   setIsReceiptOpen]   = useState(false);
    const [customer,        setCustomer]        = useState<Customer | null>(null);
    const [approveOverLimit, setApproveOverLimit] = useState(false);

    const { total } = useMemo(
        () => (cart ? calculateCartTotals(cart) : { total: 0 }),
        [cart],
    );

    const amountPaid   = parseFloat(amountPaidStr) || 0;
    const change       = Math.max(0, amountPaid - total);
    const isFullPay    = amountPaid >= total - FINANCIAL_EPSILON;
    const isCreditSale = !!(cart?.customerUuid && amountPaid < total - FINANCIAL_EPSILON);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (!isOpen || !isMounted || !cart) return;
        const totals = calculateCartTotals(cart);
        setAmountPaidStr(totals.total.toFixed(2));
        setIsLoading(false);
        setLastSale(null);
        setApproveOverLimit(false);

        if (cart.customerUuid) {
            customerService
                .getCustomerByUuid(cart.customerUuid)
                .then(c => {
                    setCustomer(c || null);
                    const now = new Date();
                    if (c?.settlementDay) {
                        let targetDate = fnsSetDate(new Date(now), c.settlementDay);
                        if (isAfter(startOfDay(now), startOfDay(targetDate))) {
                            targetDate = addMonths(targetDate, 1);
                        }
                        setDueDate(targetDate);
                    } else {
                        setDueDate(addDays(now, 30));
                    }
                });
        } else {
            setDueDate(undefined);
            setCustomer(null);
        }
    }, [isOpen, cart, isMounted]);

    const projectedBalance = useMemo(() => {
        if (!customer) return 0;
        return (customer.outstandingBalance || 0) + Math.max(0, total - amountPaid);
    }, [customer, total, amountPaid]);

    const isOverLimit = useMemo(() => {
        if (!customer?.creditLimit) return false;
        return projectedBalance > customer.creditLimit + FINANCIAL_EPSILON;
    }, [customer, projectedBalance]);

    const canFinalize =
        !isLoading &&
        amountPaid >= 0 &&
        (isFullPay || (!!cart?.customerUuid && (!isOverLimit || approveOverLimit)));

    const handleAmountChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            if (/^[0-9]*\.?[0-9]*$/.test(v) || v === '')
                setAmountPaidStr(v);
        },
        [],
    );

    const handleProcessSale = useCallback(async () => {
        if (amountPaid < 0 || isLoading || !canFinalize) return;
        setIsLoading(true);
        try {
            const sale = await processSale(amountPaid, dueDate);
            if (sale) {
                setLastSale(sale);
                onOpenChange(false);
                setIsReceiptOpen(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, [amountPaid, isLoading, dueDate, processSale, onOpenChange, canFinalize]);

    // Raccourcis clavier pour le dialogue
    useKeyboardShortcuts([
        {
            key: 'Enter',
            action: handleProcessSale,
            description: 'Valider l\'encaissement',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Annuler et fermer',
            ignoreInputFocus: true
        }
    ], 'Encaissement', isOpen);

    if (!cart || !isMounted) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Wallet className="h-4 w-4 text-primary" />
                            Finaliser la vente — {cart.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Saisissez le montant reçu du client.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="text-center py-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-0.5">
                            Total net à payer
                        </p>
                        <p className="text-3xl font-bold text-primary tabular-nums">
                            {formatCurrency(total)}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="amount-paid" className="text-xs font-medium">
                                Montant reçu (DA)
                            </Label>
                            <Input
                                id="amount-paid"
                                type="text"
                                inputMode="decimal"
                                className="text-lg font-bold text-center h-10"
                                value={amountPaidStr}
                                onChange={handleAmountChange}
                                autoFocus
                                onFocus={e => e.target.select()}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">
                                Monnaie rendue
                            </Label>
                            <div
                                className={cn(
                                    'h-10 flex items-center justify-center rounded-md border text-lg font-bold tabular-nums',
                                    change >= 0.01
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                                        : 'bg-muted border-border text-muted-foreground',
                                )}
                            >
                                {change >= 0.01 ? formatCurrency(change) : '—'}
                            </div>
                        </div>
                    </div>

                    {isCreditSale && (
                        <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-amber-700 dark:text-amber-400 text-xs">
                                    {formatCurrency(total - amountPaid)} seront enregistrés
                                    comme dette sur le compte client.
                                </p>
                            </div>

                            {isOverLimit && (
                                <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-md space-y-2">
                                    <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                                        <ShieldAlert className="h-3.5 w-3.5" />
                                        Plafond de crédit dépassé
                                        {customer?.creditLimit
                                            ? ` (${formatCurrency(customer.creditLimit)})`
                                            : ''}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            Autoriser l&apos;exception
                                        </span>
                                        <Switch
                                            checked={approveOverLimit}
                                            onCheckedChange={setApproveOverLimit}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" />
                                    Date d&apos;échéance {customer?.settlementDay ? `(Jour ${customer.settlementDay})` : ''}
                                </Label>
                                <DatePicker date={dueDate} setDate={setDueDate} />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleProcessSale}
                            disabled={!canFinalize}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                            )}
                            Confirmer [Enter]
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <PrintReceiptDialog
                isOpen={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                sale={lastSale}
                customerName={customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
            />
        </>
    );
}

export const PaymentDialog = memo(PaymentDialogContent);
PaymentDialog.displayName = 'PaymentDialog';
