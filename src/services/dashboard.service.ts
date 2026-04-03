'use client';

import type { DashboardData, TopCustomer } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { db } from '@/lib/db';

class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        try {
            // 1. Calculate duration for comparison
            const duration = to.getTime() - from.getTime();
            const prevTo = new Date(from.getTime() - 1);
            const prevFrom = new Date(prevTo.getTime() - duration);

            // 2. Parallel fetch for all core entities
            const [allSales, allExpenses, returns, customers, allProducts] = await Promise.all([
                db.sales.where('createdAt').between(prevFrom, to, true, true).toArray(),
                db.expenses.where('expenseDate').between(prevFrom, to, true, true).toArray(),
                db.product_returns.where('createdAt').between(from, to, true, true).toArray(),
                db.customers.toArray(),
                db.products.toArray(),
            ]);

            // 3. Pre-process product map for COGS calculation
            const productPurchaseMap = new Map(allProducts.map(p => [p.uuid, Number(p.purchasePrice)]));

            // 4. Split data efficiently
            const currentSales = [];
            const prevSales = [];
            for (const s of allSales) {
                if (new Date(s.createdAt!) >= from) currentSales.push(s);
                else prevSales.push(s);
            }

            const currentExpenses = [];
            const prevExpenses = [];
            for (const e of allExpenses) {
                if (new Date(e.expenseDate) >= from) currentExpenses.push(e);
                else prevExpenses.push(e);
            }

            // 5. Calculate Revenue & COGS in a single pass for current period
            let totalRevenue = 0;
            let totalCOGS = 0;
            const productSales = new Map<string, { quantitySold: number, revenueGenerated: number }>();
            const customerSpending = new Map<string, number>();
            const salesByDayMap = new Map<string, { total: number, profit: number }>();

            // Initialize daily map
            eachDayOfInterval({ start: from, end: to }).forEach(day => {
                salesByDayMap.set(format(day, 'yyyy-MM-dd'), { total: 0, profit: 0 });
            });

            currentSales.forEach(sale => {
                totalRevenue += Number(sale.total);
                let saleCOGS = 0;
                
                sale.items.forEach(item => {
                    const qty = Number(item.quantity);
                    const purchasePrice = Number(item.purchasePrice) || productPurchaseMap.get(item.productUuid || '') || 0;
                    saleCOGS += purchasePrice * qty;

                    if (item.productUuid) {
                        const current = productSales.get(item.productUuid) || { quantitySold: 0, revenueGenerated: 0 };
                        current.quantitySold += qty;
                        current.revenueGenerated += (Number(item.price) * qty);
                        productSales.set(item.productUuid, current);
                    }
                });

                totalCOGS += saleCOGS;
                const saleGrossProfit = Number(sale.total) - saleCOGS;

                if (sale.customerUuid) {
                    customerSpending.set(sale.customerUuid, (customerSpending.get(sale.customerUuid) || 0) + Number(sale.total));
                }

                const day = format(startOfDay(sale.createdAt!), 'yyyy-MM-dd');
                const daily = salesByDayMap.get(day);
                if (daily) {
                    daily.total += Number(sale.total);
                    daily.profit += saleGrossProfit;
                }
            });

            // 6. Stats for Current vs Prev
            const totalExpenses = currentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const netProfit = totalRevenue - totalCOGS - totalExpenses;
            const saleCount = currentSales.length;
            
            const prevTotalRevenue = prevSales.reduce((sum, s) => sum + Number(s.total), 0);
            const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const prevTotalCOGS = prevSales.reduce((sum, sale) => sum + sale.items.reduce((acc, item) => acc + (Number(item.purchasePrice) * Number(item.quantity)), 0), 0);
            const prevNetProfit = prevTotalRevenue - prevTotalCOGS - prevTotalExpenses;

            const calculateChange = (curr: number, prev: number) => (prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100);

            // 7. Rankings
            const topProducts = Array.from(productSales.entries())
                .sort((a, b) => b[1].revenueGenerated - a[1].revenueGenerated)
                .slice(0, 5)
                .map(([uuid, stats]) => {
                    const p = allProducts.find(prod => prod.uuid === uuid);
                    return { productUuid: uuid, name: p?.name || 'Inconnu', quantitySold: stats.quantitySold, revenueGenerated: stats.revenueGenerated, category: p?.category };
                });

            const customerMap = new Map(customers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]));
            const topCustomers: TopCustomer[] = Array.from(customerSpending.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([uuid, spent]) => ({ customerUuid: uuid, name: customerMap.get(uuid) || 'Client Inconnu', totalSpent: spent }));

            const lowStockProducts = allProducts
                .filter(p => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minStockLevel))
                .sort((a, b) => Number(a.quantity) - Number(b.quantity))
                .slice(0, 5);

            return {
                stats: {
                    totalRevenue, totalExpenses, netProfit, saleCount,
                    totalOutstandingDebt: customers.reduce((sum, c) => sum + Number(c.outstandingBalance), 0),
                    totalInventoryValue: allProducts.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.purchasePrice)), 0),
                    averageBasket: saleCount > 0 ? totalRevenue / saleCount : 0,
                    profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
                    totalRevenueChange: calculateChange(totalRevenue, prevTotalRevenue),
                    netProfitChange: calculateChange(netProfit, prevNetProfit),
                    totalExpensesChange: calculateChange(totalExpenses, prevTotalExpenses),
                    saleCountChange: calculateChange(saleCount, prevSales.length),
                },
                salesByDay: Array.from(salesByDayMap.entries()).map(([date, v]) => ({ date, ...v })),
                recentSales: currentSales.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).slice(0, 5).map(s => ({
                    uuid: s.uuid, invoiceNumber: s.invoiceNumber, total: Number(s.total), createdAt: s.createdAt,
                    customerName: s.customerUuid ? customerMap.get(s.customerUuid) || 'Inconnu' : 'Client de passage'
                })),
                recentReturns: returns.slice(0, 5).map(r => ({
                    uuid: r.uuid, originalInvoiceNumber: r.originalInvoiceNumber, totalReturnValue: Number(r.totalReturnValue), createdAt: r.createdAt,
                    customerName: r.customerUuid ? customerMap.get(r.customerUuid) || 'Inconnu' : 'Client de passage'
                })),
                topProducts, topCustomers, lowStockProducts,
            };
        } catch (error) {
            console.error("Dashboard error:", error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
