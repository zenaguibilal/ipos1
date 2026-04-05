
'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Payment } from '@/lib/types';
import { db } from '@/lib/db';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';

class PaymentService {
    
    async addPayment(paymentData: { customerUuid: string, amount: number, paymentDate: Date, notes?: string }): Promise<void> {
        const { customerUuid, amount, paymentDate, notes } = paymentData;

        const customer = await db.customers.where('uuid').equals(customerUuid).first();
        if (!customer) {
            throw new Error("Client non trouvé.");
        }

        const newPayment: Payment = {
            uuid: uuidv4(),
            customerUuid,
            amount,
            paymentDate,
            notes,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        await db.payments.add(newPayment);

        // Recalculate customer balance and status
        await customerService.recalculateCustomerStatus(customerUuid);

        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();
    }

    async getPaymentsByCustomerUuid(customerUuid: string): Promise<Payment[]> {
        return db.payments.where('customerUuid').equals(customerUuid).sortBy('paymentDate');
    }
}

export const paymentService = new PaymentService();
