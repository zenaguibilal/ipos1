'use client';

import { toast } from 'sonner';
import { expenseService } from '@/services/expense.service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteMultipleExpensesDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    expenseUuids: string[];
    onSuccess: () => void;
}

export function DeleteMultipleExpensesDialog({ isOpen, onOpenChange, expenseUuids, onSuccess }: DeleteMultipleExpensesDialogProps) {

    const handleDelete = async () => {
        if (expenseUuids.length === 0) return;

        await expenseService.bulkDelete(expenseUuids);
        toast.success(`${expenseUuids.length} dépense(s) supprimée(s) avec succès.`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Êtes-vous absolument sûr ?'
            description={`Cette action est irréversible. ${expenseUuids.length} dépense(s) sélectionnée(s) seront définitivement supprimée(s).`}
            onConfirm={handleDelete}
            confirmText="Confirmer la suppression"
        />
    );
}
