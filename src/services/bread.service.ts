'use client';

import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, Customer, CartItem, BreadOrderWithCustomer } from '@/lib/types';
import { db } from '@/lib/db';
import { salesService } from './sales.service';
import { customerService } from './customer.service';
import { BREAD_WEEK_DAYS } from '@/lib/constants';

class BreadService {
    
    async generateAndGetOrdersForDate(date: string): Promise<BreadOrderWithCustomer[]> {
        const count = await db.bread_orders.where('date').equals(date).count();
        if (count === 0) {
            await this.createDayOrders(date);
        }
        
        const orders = await db.bread_orders.where('date').equals(date).sortBy('createdAt');
        const customerUuids = [...new Set(orders.map(o => o.customerUuid))];
        const customers = await db.customers.where('uuid').anyOf(customerUuids).toArray();
        const customerMap = new Map(customers.map(c => [c.uuid, c]));

        return orders.map(o => ({
            ...o,
            customer: customerMap.get(o.customerUuid) || { uuid: 'unknown', firstName: 'Client', lastName: 'Supprimé' }
        }));
    }
    
    private async createDayOrders(date: string): Promise<void> {
        const dayOfWeek = BREAD_WEEK_DAYS[new Date(date.replace(/-/g, '/')).getDay()];
        const activeBreadClients = await db.customers.where('isBreadClient').equals(1).toArray();
        
        const ordersToCreate: BreadOrder[] = [];
        
        for (const client of activeBreadClients) {
            if (client.bread_type_recurrence === 'aucun') continue;

            let quantity = 0;
            if (client.bread_type_recurrence === 'quotidien') {
                quantity = client.bread_quantite_defaut || 0;
            } else if (client.bread_type_recurrence === 'jours_specifiques' && client.bread_jours_semaine?.[dayOfWeek]?.actif) {
                quantity = client.bread_jours_semaine[dayOfWeek].quantite || 0;
            }

            if (quantity > 0) {
                 ordersToCreate.push({
                    uuid: uuidv4(),
                    customerUuid: client.uuid,
                    date: date,
                    quantite: quantity,
                    est_paye: false,
                    est_livre: false,
                    venteUuid: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        if (ordersToCreate.length > 0) {
            await db.bread_orders.bulkAdd(ordersToCreate);
        }
    }
    
    async addManualBreadOrder(customerUuid: string, date: string, quantity: number): Promise<BreadOrder> {
        const existingOrder = await db.bread_orders.where({ customerUuid, date }).first();
        if (existingOrder) {
            throw new Error("Une commande existe déjà pour ce client à cette date.");
        }

        const newOrder: BreadOrder = {
            uuid: uuidv4(),
            customerUuid,
            date,
            quantite: quantity,
            est_paye: false,
            est_livre: false,
            venteUuid: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        await db.bread_orders.add(newOrder);
        return newOrder;
    }

    async updateBreadOrderQuantity(uuid: string, quantity: number): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if(!order) return;

        const updateData: Partial<BreadOrder> = { quantite: quantity, updatedAt: new Date() };
        if (order.quantite_origine === undefined) {
            updateData.quantite_origine = order.quantite;
        }
        await db.bread_orders.update(order.id!, updateData);
    }
    
     async updateBreadOrderDeliveryStatus(uuid: string, delivered: boolean): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order) return;
        await db.bread_orders.update(order.id!, { est_livre: delivered, updatedAt: new Date() });
    }

    async convertBreadOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        await db.transaction('rw', db.bread_orders, db.sales, db.products, db.inventory_logs, db.customers, db.payments, db.product_returns, async () => {
            const orders = await db.bread_orders.where('uuid').anyOf(orderUuids).toArray();
            const customerUuids = [...new Set(orders.map(o => o.customerUuid))];
            
            for (const customerUuid of customerUuids) {
                const customerOrders = orders.filter(o => o.customerUuid === customerUuid);
                const totalQuantity = customerOrders.reduce((sum, o) => sum + o.quantite, 0);

                if (totalQuantity <= 0) continue;

                const breadCartItem: CartItem = {
                    uuid: 'BREAD_PRODUCT', // Special UUID for non-inventoried bread
                    name: 'Pain',
                    price: breadPrice,
                    purchasePrice: 0, 
                    quantity: Infinity,
                    cartQuantity: totalQuantity,
                    minStockLevel: 0,
                };

                // This will now use the new transactional createSale.
                const sale = await salesService.createSale({
                    items: [breadCartItem],
                    discountType: 'fixed',
                    discountValue: 0,
                    amountPaid: 0,
                    customerUuid: customerUuid,
                });

                // Update bread orders within the same transaction
                const orderIds = customerOrders.map(o => o.id!);
                await db.bread_orders.where('id').anyOf(orderIds).modify({ venteUuid: sale.uuid, est_paye: true });
            }
        });
    }
}

export const breadService = new BreadService();
