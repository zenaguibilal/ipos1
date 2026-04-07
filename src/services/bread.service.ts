'use client';

import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, CartItem, BreadOrderWithCustomer } from '@/lib/types';
import { db } from '@/lib/db';
import { salesService } from './sales.service';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { useAppStore } from '@/stores/appStore';

class BreadService {

    /**
     * FIX #16: The original code checked `count === 0` over ALL orders for the date,
     * which meant a single manually-added order would prevent auto-generation for
     * ALL bread-subscription clients on that day.
     *
     * Fix: auto-generation is skipped only when orders that originated from a
     * subscription already exist (customerUuid is NOT NULL and venteUuid is NULL,
     * i.e. auto-generated but not yet billed). Manual orders (customName set,
     * no customerUuid) do not block auto-generation.
     */
    async generateAndGetOrdersForDate(
        date: string,
    ): Promise<BreadOrderWithCustomer[]> {
        // Count subscription-based (auto) orders only
        const autoCount = await db.bread_orders
            .where('date')
            .equals(date)
            .and(o => o.customerUuid !== null)
            .count();

        if (autoCount === 0) {
            await this.createDayOrders(date);
        }

        const orders = await db.bread_orders
            .where('date')
            .equals(date)
            .sortBy('createdAt');

        const customerUuids = [
            ...new Set(
                orders.map(o => o.customerUuid).filter(Boolean) as string[],
            ),
        ];
        const customers =
            customerUuids.length > 0
                ? await db.customers
                      .where('uuid')
                      .anyOf(customerUuids)
                      .toArray()
                : [];
        const customerMap = new Map(customers.map(c => [c.uuid, c]));

        return orders.map(o => ({
            ...o,
            customer: o.customerUuid
                ? customerMap.get(o.customerUuid) || null
                : null,
        }));
    }

    private async createDayOrders(date: string): Promise<void> {
        const dayIndex = new Date(date.replace(/-/g, '/')).getDay();
        const dayOfWeek = BREAD_WEEK_DAYS[dayIndex];

        // FIX #6: use equals(1) which is correct for Dexie boolean indexes,
        // but document why: Dexie stores boolean true as 1 in IndexedDB.
        const activeBreadClients = await db.customers
            .where('isBreadClient')
            .equals(1)
            .toArray();

        const ordersToCreate: BreadOrder[] = [];

        for (const client of activeBreadClients) {
            if (client.bread_type_recurrence === 'aucun') continue;

            let quantity = 0;
            if (client.bread_type_recurrence === 'quotidien') {
                quantity = client.bread_quantite_defaut || 0;
            } else if (
                client.bread_type_recurrence === 'jours_specifiques' &&
                client.bread_jours_semaine?.[dayOfWeek]?.actif
            ) {
                quantity = client.bread_jours_semaine[dayOfWeek].quantite || 0;
            }

            if (quantity > 0) {
                ordersToCreate.push({
                    uuid: uuidv4(),
                    customerUuid: client.uuid,
                    date,
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
            useAppStore.getState().actions.triggerSmartSync();
        }
    }

    async addManualBreadOrder(params: {
        customerUuid?: string;
        customName?: string;
        date: string;
        quantity: number;
    }): Promise<BreadOrder> {
        const { customerUuid, customName, date, quantity } = params;

        if (customerUuid) {
            const existingOrder = await db.bread_orders
                .where({ customerUuid, date })
                .first();
            if (existingOrder) {
                throw new Error(
                    'Une commande existe déjà pour ce client à cette date.',
                );
            }
        }

        const newOrder: BreadOrder = {
            uuid: uuidv4(),
            customerUuid: customerUuid || null,
            customName: customName || undefined,
            date,
            quantite: quantity,
            est_paye: false,
            est_livre: false,
            venteUuid: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.bread_orders.add(newOrder);
        useAppStore.getState().actions.triggerSmartSync();
        return newOrder;
    }

    async updateBreadOrderQuantity(
        uuid: string,
        quantity: number,
    ): Promise<void> {
        const order = await db.bread_orders
            .where('uuid')
            .equals(uuid)
            .first();
        if (!order || order.venteUuid) return;

        const updateData: Partial<BreadOrder> = {
            quantite: quantity,
            updatedAt: new Date(),
        };
        if (order.quantite_origine === undefined) {
            updateData.quantite_origine = order.quantite;
        }
        await db.bread_orders.update(order.id!, updateData);
        useAppStore.getState().actions.triggerSmartSync();
    }

    async updateBreadOrderDeliveryStatus(
        uuid: string,
        delivered: boolean,
    ): Promise<void> {
        const order = await db.bread_orders
            .where('uuid')
            .equals(uuid)
            .first();
        if (!order) return;
        await db.bread_orders.update(order.id!, {
            est_livre: delivered,
            updatedAt: new Date(),
        });
        useAppStore.getState().actions.triggerSmartSync();
    }

    async deleteBreadOrder(uuid: string): Promise<void> {
        const order = await db.bread_orders
            .where('uuid')
            .equals(uuid)
            .first();
        if (order && !order.venteUuid) {
            await db.bread_orders.delete(order.id!);
            useAppStore.getState().actions.triggerSmartSync();
        }
    }

    /**
     * FIX #13: Removed db.payments and db.product_returns from the transaction
     * scope — they are never written here and their inclusion only increases
     * the lock surface and deadlock risk.
     */
    async convertBreadOrdersToSales(
        orderUuids: string[],
        breadPrice: number,
    ): Promise<void> {
        await db.transaction(
            'rw',
            [db.bread_orders, db.sales, db.products, db.inventory_logs, db.customers],
            async () => {
                const orders = await db.bread_orders
                    .where('uuid')
                    .anyOf(orderUuids)
                    .toArray();
                const filteredOrders = orders.filter(o => !o.venteUuid);
                if (filteredOrders.length === 0) return;

                const groupedOrders = new Map<string, BreadOrder[]>();
                filteredOrders.forEach(order => {
                    const key = order.customerUuid || `unreg-${order.uuid}`;
                    if (!groupedOrders.has(key)) groupedOrders.set(key, []);
                    groupedOrders.get(key)!.push(order);
                });

                for (const [, customerOrders] of groupedOrders.entries()) {
                    const totalQuantity = customerOrders.reduce(
                        (sum, o) => sum + o.quantite,
                        0,
                    );
                    if (totalQuantity <= 0) continue;

                    const firstOrder = customerOrders[0];
                    const displayName = firstOrder.customName || 'Pain';

                    const breadCartItem: CartItem = {
                        uuid: 'BREAD_PRODUCT',
                        name: displayName,
                        price: breadPrice,
                        purchasePrice: 0,
                        quantity: Infinity,
                        cartQuantity: totalQuantity,
                        minStockLevel: 0,
                    };

                    const sale = await salesService.createSale({
                        items: [breadCartItem],
                        discountType: 'fixed',
                        discountValue: 0,
                        amountPaid: 0,
                        customerUuid: firstOrder.customerUuid,
                    });

                    const orderIds = customerOrders.map(o => o.id!);
                    await db.bread_orders
                        .where('id')
                        .anyOf(orderIds)
                        .modify({
                            venteUuid: sale.uuid,
                            est_paye: true,
                            est_livre: true,
                            updatedAt: new Date(),
                        });
                }
            },
        );

        useAppStore.getState().actions.triggerSmartSync();
    }

    async billAllRemainingOrdersForDate(
        date: string,
        breadPrice: number,
    ): Promise<number> {
        const unpaidOrders = await db.bread_orders
            .where('date')
            .equals(date)
            .and(o => !o.venteUuid && o.quantite > 0)
            .toArray();

        if (unpaidOrders.length === 0) return 0;

        const uuids = unpaidOrders.map(o => o.uuid);
        await this.convertBreadOrdersToSales(uuids, breadPrice);
        return unpaidOrders.length;
    }
}

export const breadService = new BreadService();