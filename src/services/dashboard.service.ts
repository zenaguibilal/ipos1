'use client';

import type { DashboardData, TopCustomer, SalesByDay, RecentSale, RecentReturn } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay, endOfDay } from 'date-fns';
import { db } from '@/lib/db';
import { preciseMultiply, safeNumber } from '@/lib/utils';

/**
 * @fileOverview Service de pilotage analytique iPOS Zen.
 * Effectue des calculs financiers complexes avec déduction des retours et amortissement des coûts.
 */
class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        try {
            // Dates normalisées pour l'inclusion totale
            const startDate = startOfDay(from);
            const endDate = endOfDay(to);

            // Calcul de la période de comparaison (précédente)
            const duration = endDate.getTime() - startDate.getTime();
            const prevEndDate = new Date(startDate.getTime() - 1);
            const prevStartDate = new Date(prevEndDate.getTime() - duration);

            // Récupération globale des flux
            const [allSales, allExpenses, allReturns, allCustomers, allProducts] =
                await Promise.all([
                    db.sales.where('createdAt').between(prevStartDate, endDate, true, true).toArray(),
                    db.expenses.where('expenseDate').between(prevStartDate, endDate, true, true).toArray(),
                    db.product_returns.where('createdAt').between(prevStartDate, endDate, true, true).toArray(),
                    db.customers.toArray(),
                    db.products.toArray(),
                ]);

            const productPurchaseMap = new Map(allProducts.map(p => [p.uuid, safeNumber(p.purchasePrice)]));
            const customerMap = new Map(allCustomers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]));

            // Initialisation des accumulateurs
            let currRev = 0; let currCogs = 0; let currExp = 0; let currRetVal = 0; let currRetCogs = 0; let currCount = 0;
            let prevRev = 0; let prevCogs = 0; let prevExp = 0; let prevRetVal = 0; let prevRetCogs = 0; let prevCount = 0;

            const productStatsMap = new Map<string, { quantity: number; revenue: number }>();
            const customerSpendingMap = new Map<string, number>();
            const dailyMap = new Map<string, { total: number; profit: number }>();

            // Préparation du graphe
            eachDayOfInterval({ start: startDate, end: endDate }).forEach(day => {
                dailyMap.set(format(day, 'yyyy-MM-dd'), { total: 0, profit: 0 });
            });

            // 1. Analyse des Ventes
            allSales.forEach(sale => {
                const saleDate = new Date(sale.createdAt!);
                const isCurrent = saleDate >= startDate;
                let saleCOGS = 0;

                sale.items.forEach(item => {
                    const qty = safeNumber(item.quantity);
                    const cost = safeNumber(item.purchasePrice) || productPurchaseMap.get(item.productUuid || '') || 0;
                    const lineCOGS = preciseMultiply(cost, qty);
                    saleCOGS += lineCOGS;

                    if (isCurrent && item.productUuid) {
                        const ps = productStatsMap.get(item.productUuid) || { quantity: 0, revenue: 0 };
                        ps.quantity += qty;
                        ps.revenue += preciseMultiply(safeNumber(item.price), qty);
                        productStatsMap.set(item.productUuid, ps);
                    }
                });

                if (isCurrent) {
                    currRev += safeNumber(sale.total);
                    currCogs += saleCOGS;
                    currCount++;
                    const dayKey = format(saleDate, 'yyyy-MM-dd');
                    const d = dailyMap.get(dayKey);
                    if (d) {
                        d.total += safeNumber(sale.total);
                        d.profit += (safeNumber(sale.total) - saleCOGS);
                    }
                    if (sale.customerUuid) {
                        customerSpendingMap.set(sale.customerUuid, (customerSpendingMap.get(sale.customerUuid) || 0) + safeNumber(sale.total));
                    }
                } else {
                    prevRev += safeNumber(sale.total);
                    prevCogs += saleCOGS;
                    prevCount++;
                }
            });

            // 2. Analyse des Retours (Déduction du Chiffre d'Affaires et Ajustement COGS)
            allReturns.forEach(ret => {
                const retDate = new Date(ret.createdAt!);
                const isCurrent = retDate >= startDate;
                let retCOGS = 0;

                ret.items.forEach(item => {
                    if (item.wasRestocked) {
                        const cost = safeNumber(item.purchasePrice) || productPurchaseMap.get(item.productUuid || '') || 0;
                        retCOGS += preciseMultiply(cost, item.quantity);
                    }
                });

                if (isCurrent) {
                    currRetVal += safeNumber(ret.totalReturnValue);
                    currRetCogs += retCOGS;
                    const dayKey = format(retDate, 'yyyy-MM-dd');
                    const d = dailyMap.get(dayKey);
                    if (d) {
                        d.total -= safeNumber(ret.totalReturnValue);
                        d.profit -= (safeNumber(ret.totalReturnValue) - retCOGS);
                    }
                    if (ret.customerUuid) {
                        customerSpendingMap.set(ret.customerUuid, (customerSpendingMap.get(ret.customerUuid) || 0) - safeNumber(ret.totalReturnValue));
                    }
                } else {
                    prevRetVal += safeNumber(ret.totalReturnValue);
                    prevRetCogs += retCOGS;
                }
            });

            // 3. Analyse des Charges
            allExpenses.forEach(exp => {
                const val = safeNumber(exp.amount);
                if (new Date(exp.expenseDate) >= startDate) currExp += val;
                else prevExp += val;
            });

            // 4. Calculs Finaux (Net)
            const netRevenue = currRev - currRetVal;
            const prevNetRevenue = prevRev - prevRetVal;
            
            const netProfit = netRevenue - (currCogs - currRetCogs) - currExp;
            const prevNetProfit = prevNetRevenue - (prevCogs - prevRetCogs) - prevExp;

            const calcChange = (curr: number, prev: number) => {
                if (Math.abs(prev) < 0.1) return curr > 0.1 ? 100 : 0;
                return ((curr - prev) / Math.abs(prev)) * 100;
            };

            return {
                stats: {
                    totalRevenue: netRevenue,
                    totalExpenses: currExp,
                    netProfit: netProfit,
                    saleCount: currCount,
                    totalOutstandingDebt: allCustomers.reduce((sum, c) => sum + safeNumber(c.outstandingBalance), 0),
                    totalInventoryValue: allProducts.reduce((sum, p) => sum + preciseMultiply(safeNumber(p.quantity), safeNumber(p.purchasePrice)), 0),
                    averageBasket: currCount > 0 ? netRevenue / currCount : 0,
                    profitMargin: netRevenue > 0.1 ? (netProfit / netRevenue) * 100 : 0,
                    totalRevenueChange: calcChange(netRevenue, prevNetRevenue),
                    netProfitChange: calcChange(netProfit, prevNetProfit),
                    totalExpensesChange: calcChange(currExp, prevExp),
                    saleCountChange: calcChange(currCount, prevCount),
                },
                salesByDay: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
                recentSales: allSales
                    .filter(s => new Date(s.createdAt!) >= startDate)
                    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                    .slice(0, 5)
                    .map(s => ({
                        uuid: s.uuid,
                        invoiceNumber: s.invoiceNumber,
                        total: safeNumber(s.total),
                        createdAt: s.createdAt,
                        customerName: s.customerUuid ? (customerMap.get(s.customerUuid) || 'Client Elite') : 'Client de passage',
                    })),
                recentReturns: allReturns
                    .filter(r => new Date(r.createdAt!) >= startDate)
                    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                    .slice(0, 5)
                    .map(r => ({
                        uuid: r.uuid,
                        originalInvoiceNumber: r.originalInvoiceNumber,
                        totalReturnValue: safeNumber(r.totalReturnValue),
                        createdAt: r.createdAt,
                        customerName: r.customerUuid ? (customerMap.get(r.customerUuid) || 'Client Elite') : 'Client de passage',
                    })),
                topProducts: Array.from(productStatsMap.entries())
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .slice(0, 5)
                    .map(([uuid, stats]) => {
                        const p = allProducts.find(prod => prod.uuid === uuid);
                        return {
                            productUuid: uuid,
                            name: p?.name || 'Produit Archivé',
                            quantitySold: stats.quantity,
                            revenueGenerated: stats.revenue,
                            category: p?.category,
                        };
                    }),
                topCustomers: Array.from(customerSpendingMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([uuid, spent]) => ({
                        customerUuid: uuid,
                        name: customerMap.get(uuid) || 'Client de passage',
                        totalSpent: spent,
                    })),
                lowStockProducts: allProducts
                    .filter(p => safeNumber(p.quantity) <= safeNumber(p.minStockLevel))
                    .sort((a, b) => safeNumber(a.quantity) - safeNumber(b.quantity))
                    .slice(0, 5),
            };
        } catch (error) {
            console.error('Audit Analytics Error:', error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
