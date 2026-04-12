'use client';

import type { DashboardData, TopCustomer } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { db } from '@/lib/db';

class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        try {
            const duration = to.getTime() - from.getTime();
            const prevTo   = new Date(from.getTime() - 1);
            const prevFrom = new Date(prevTo.getTime() - duration);

            // FIX #7 : between() compare les valeurs stockées en IndexedDB.
            // Si createdAt/expenseDate sont stockés en ISO string, passer des
            // objets Date échoue silencieusement. On normalise en ISO string.
            const [allSales, allExpenses, returns, customers, allProducts] =
                await Promise.all([
                    db.sales
                        .where('createdAt')
                        .between(
                            prevFrom.toISOString(),
                            to.toISOString(),
                            true,
                            true,
                        )
                        .toArray(),
                    db.expenses
                        .where('expenseDate')
                        .between(
                            prevFrom.toISOString(),
                            to.toISOString(),
                            true,
                            true,
                        )
                        .toArray(),
                    db.product_returns
                        .where('createdAt')
                        .between(
                            from.toISOString(),
                            to.toISOString(),
                            true,
                            true,
                        )
                        .toArray(),
                    db.customers.toArray(),
                    db.products.toArray(),
                ]);

            const productPurchaseMap = new Map(
                allProducts.map(p => [p.uuid, Number(p.purchasePrice)]),
            );
            const customerMap = new Map(
                customers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]),
            );

            let totalRevenue     = 0;
            let totalCOGS        = 0;
            let prevTotalRevenue = 0;
            let prevTotalCOGS    = 0;

            const productSales    = new Map<string, { quantitySold: number; revenueGenerated: number }>();
            const customerSpending = new Map<string, number>();
            const salesByDayMap   = new Map<string, { total: number; profit: number }>();

            eachDayOfInterval({ start: from, end: to }).forEach(day => {
                salesByDayMap.set(format(day, 'yyyy-MM-dd'), {
                    total: 0,
                    profit: 0,
                });
            });

            allSales.forEach(sale => {
                const isCurrent = new Date(sale.createdAt!) >= from;
                let saleCOGS = 0;

                sale.items.forEach(item => {
                    const qty = Number(item.quantity);
                    const purchasePrice =
                        Number(item.purchasePrice) ||
                        productPurchaseMap.get(item.productUuid || '') ||
                        0;
                    saleCOGS += purchasePrice * qty;

                    if (isCurrent && item.productUuid) {
                        const current = productSales.get(item.productUuid) || {
                            quantitySold: 0,
                            revenueGenerated: 0,
                        };
                        current.quantitySold   += qty;
                        current.revenueGenerated += Number(item.price) * qty;
                        productSales.set(item.productUuid, current);
                    }
                });

                if (isCurrent) {
                    totalRevenue += Number(sale.total);
                    totalCOGS   += saleCOGS;
                    const saleGrossProfit = Number(sale.total) - saleCOGS;

                    if (sale.customerUuid) {
                        customerSpending.set(
                            sale.customerUuid,
                            (customerSpending.get(sale.customerUuid) || 0) +
                                Number(sale.total),
                        );
                    }

                    const dayKey = format(
                        startOfDay(new Date(sale.createdAt!)),
                        'yyyy-MM-dd',
                    );
                    const daily = salesByDayMap.get(dayKey);
                    if (daily) {
                        daily.total  += Number(sale.total);
                        daily.profit += saleGrossProfit;
                    }
                } else {
                    prevTotalRevenue += Number(sale.total);
                    prevTotalCOGS   += saleCOGS;
                }
            });

            const totalExpenses = allExpenses
                .filter(e => new Date(e.expenseDate) >= from)
                .reduce((sum, e) => sum + Number(e.amount), 0);
            const prevTotalExpenses = allExpenses
                .filter(e => new Date(e.expenseDate) < from)
                .reduce((sum, e) => sum + Number(e.amount), 0);

            const netProfit     = totalRevenue - totalCOGS - totalExpenses;
            const prevNetProfit = prevTotalRevenue - prevTotalCOGS - prevTotalExpenses;

            const calculateChange = (curr: number, prev: number) =>
                prev === 0
                    ? curr > 0 ? 100 : 0
                    : ((curr - prev) / prev) * 100;

            const currentSales = allSales.filter(
                s => new Date(s.createdAt!) >= from,
            );
            const prevSales = allSales.filter(
                s => new Date(s.createdAt!) < from,
            );

            const topProducts = Array.from(productSales.entries())
                .sort((a, b) => b[1].revenueGenerated - a[1].revenueGenerated)
                .slice(0, 5)
                .map(([uuid, stats]) => {
                    const p = allProducts.find(prod => prod.uuid === uuid);
                    return {
                        productUuid:       uuid,
                        name:              p?.name || 'Inconnu',
                        quantitySold:      stats.quantitySold,
                        revenueGenerated:  stats.revenueGenerated,
                        category:          p?.category,
                    };
                });

            const topCustomers: TopCustomer[] = Array.from(
                customerSpending.entries(),
            )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([uuid, spent]) => ({
                    customerUuid: uuid,
                    name:         customerMap.get(uuid) || 'Client de passage',
                    totalSpent:   spent,
                }));

            return {
                stats: {
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    saleCount: currentSales.length,
                    totalOutstandingDebt: customers.reduce(
                        (sum, c) => sum + Number(c.outstandingBalance),
                        0,
                    ),
                    totalInventoryValue: allProducts.reduce(
                        (sum, p) =>
                            sum + Number(p.quantity) * Number(p.purchasePrice),
                        0,
                    ),
                    averageBasket:
                        totalRevenue / Math.max(1, currentSales.length),
                    profitMargin:
                        totalRevenue > 0
                            ? (netProfit / totalRevenue) * 100
                            : 0,
                    totalRevenueChange:  calculateChange(totalRevenue, prevTotalRevenue),
                    netProfitChange:     calculateChange(netProfit, prevNetProfit),
                    totalExpensesChange: calculateChange(totalExpenses, prevTotalExpenses),
                    saleCountChange:     calculateChange(currentSales.length, prevSales.length),
                },
                salesByDay: Array.from(salesByDayMap.entries()).map(
                    ([date, v]) => ({ date, ...v }),
                ),
                recentSales: currentSales
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt!).getTime() -
                            new Date(a.createdAt!).getTime(),
                    )
                    .slice(0, 5)
                    .map(s => ({
                        uuid:          s.uuid,
                        invoiceNumber: s.invoiceNumber,
                        total:         Number(s.total),
                        createdAt:     s.createdAt,
                        customerName:  s.customerUuid
                            ? customerMap.get(s.customerUuid) || 'Inconnu'
                            : 'Client de passage',
                    })),
                recentReturns: returns.slice(0, 5).map(r => ({
                    uuid:                  r.uuid,
                    originalInvoiceNumber: r.originalInvoiceNumber,
                    totalReturnValue:      Number(r.totalReturnValue),
                    createdAt:             r.createdAt,
                    customerName:          r.customerUuid
                        ? customerMap.get(r.customerUuid) || 'Inconnu'
                        : 'Client de passage',
                })),
                topProducts,
                topCustomers,
                lowStockProducts: allProducts
                    .filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel)
                    .sort((a, b) => a.quantity - b.quantity)
                    .slice(0, 5),
            };
        } catch (error) {
            console.error('Dashboard Service Error:', error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
