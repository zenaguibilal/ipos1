'use client';

import type { DashboardData, TopCustomer, SalesByDay } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';
import { db } from '@/lib/db';
import { preciseMultiply, safeNumber } from '@/lib/utils';

/**
 * @fileOverview Service نخبوي لحساب بيانات لوحة التحكم.
 * يقوم بتحليل التدفقات المالية، الأرباح، والمخزون مع مراعاة المرتجعات والمصاريف.
 */
class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        try {
            const duration = to.getTime() - from.getTime();
            const prevTo   = new Date(from.getTime() - 1);
            const prevFrom = new Date(prevTo.getTime() - duration);

            // جلب البيانات للفترتين (الحالية والسابقة) للمقارنة
            const [allSales, allExpenses, allReturns, customers, allProducts] =
                await Promise.all([
                    db.sales
                        .where('createdAt')
                        .between(prevFrom.toISOString(), to.toISOString(), true, true)
                        .toArray(),
                    db.expenses
                        .where('expenseDate')
                        .between(prevFrom.toISOString(), to.toISOString(), true, true)
                        .toArray(),
                    db.product_returns
                        .where('createdAt')
                        .between(prevFrom.toISOString(), to.toISOString(), true, true)
                        .toArray(),
                    db.customers.toArray(),
                    db.products.toArray(),
                ]);

            const productPurchaseMap = new Map(allProducts.map(p => [p.uuid, safeNumber(p.purchasePrice)]));
            const customerMap = new Map(customers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]));

            // إحصائيات الفترة الحالية
            let totalRevenue = 0;
            let totalCOGS = 0;
            let totalReturnValue = 0;
            let totalReturnCOGS = 0;

            // إحصائيات الفترة السابقة (للمقارنة)
            let prevTotalRevenue = 0;
            let prevTotalCOGS = 0;
            let prevTotalReturnValue = 0;
            let prevTotalReturnCOGS = 0;

            const productSales = new Map<string, { quantitySold: number; revenueGenerated: number }>();
            const customerSpending = new Map<string, number>();
            const salesByDayMap = new Map<string, { total: number; profit: number }>();

            // تهيئة خريطة الأيام
            eachDayOfInterval({ start: from, end: to }).forEach(day => {
                salesByDayMap.set(format(day, 'yyyy-MM-dd'), { total: 0, profit: 0 });
            });

            // تحليل المبيعات
            allSales.forEach(sale => {
                const isCurrent = new Date(sale.createdAt!) >= from;
                let saleCOGS = 0;

                sale.items.forEach(item => {
                    const qty = safeNumber(item.quantity);
                    const pPrice = safeNumber(item.purchasePrice) || productPurchaseMap.get(item.productUuid || '') || 0;
                    saleCOGS += preciseMultiply(pPrice, qty);

                    if (isCurrent && item.productUuid) {
                        const current = productSales.get(item.productUuid) || { quantitySold: 0, revenueGenerated: 0 };
                        current.quantitySold += qty;
                        current.revenueGenerated += preciseMultiply(safeNumber(item.price), qty);
                        productSales.set(item.productUuid, current);
                    }
                });

                if (isCurrent) {
                    totalRevenue += safeNumber(sale.total);
                    totalCOGS += saleCOGS;
                    
                    const dayKey = format(startOfDay(new Date(sale.createdAt!)), 'yyyy-MM-dd');
                    const daily = salesByDayMap.get(dayKey);
                    if (daily) {
                        daily.total += safeNumber(sale.total);
                        daily.profit += (safeNumber(sale.total) - saleCOGS);
                    }

                    if (sale.customerUuid) {
                        customerSpending.set(sale.customerUuid, (customerSpending.get(sale.customerUuid) || 0) + safeNumber(sale.total));
                    }
                } else {
                    prevTotalRevenue += safeNumber(sale.total);
                    prevTotalCOGS += saleCOGS;
                }
            });

            // تحليل المرتجعات (تأثيرها على الأرباح)
            allReturns.forEach(ret => {
                const isCurrent = new Date(ret.createdAt!) >= from;
                let returnCOGS = 0;

                ret.items.forEach(item => {
                    if (item.wasRestocked) {
                        const pPrice = safeNumber(item.purchasePrice) || productPurchaseMap.get(item.productUuid || '') || 0;
                        returnCOGS += preciseMultiply(pPrice, item.quantity);
                    }
                });

                if (isCurrent) {
                    totalReturnValue += safeNumber(ret.totalReturnValue);
                    totalReturnCOGS += returnCOGS;
                    
                    const dayKey = format(startOfDay(new Date(ret.createdAt!)), 'yyyy-MM-dd');
                    const daily = salesByDayMap.get(dayKey);
                    if (daily) {
                        daily.total -= safeNumber(ret.totalReturnValue);
                        daily.profit -= (safeNumber(ret.totalReturnValue) - returnCOGS);
                    }
                } else {
                    prevTotalReturnValue += safeNumber(ret.totalReturnValue);
                    prevTotalReturnCOGS += returnCOGS;
                }
            });

            // حساب المصاريف
            const totalExpenses = allExpenses
                .filter(e => new Date(e.expenseDate) >= from)
                .reduce((sum, e) => sum + safeNumber(e.amount), 0);
            
            const prevTotalExpenses = allExpenses
                .filter(e => new Date(e.expenseDate) < from)
                .reduce((sum, e) => sum + safeNumber(e.amount), 0);

            // الحسابات النهائية الصافية
            const netRevenue = totalRevenue - totalReturnValue;
            const netCOGS = totalCOGS - totalReturnCOGS;
            const netProfit = netRevenue - netCOGS - totalExpenses;

            const prevNetRevenue = prevTotalRevenue - prevTotalReturnValue;
            const prevNetCOGS = prevTotalCOGS - prevTotalReturnCOGS;
            const prevNetProfit = prevTotalRevenue > 0 ? (prevNetRevenue - prevNetCOGS - prevTotalExpenses) : 0;

            const calculateChange = (curr: number, prev: number) => 
                prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / Math.abs(prev)) * 100;

            const currentSales = allSales.filter(s => new Date(s.createdAt!) >= from);

            return {
                stats: {
                    totalRevenue: netRevenue,
                    totalExpenses,
                    netProfit,
                    saleCount: currentSales.length,
                    totalOutstandingDebt: customers.reduce((sum, c) => sum + safeNumber(c.outstandingBalance), 0),
                    totalInventoryValue: allProducts.reduce((sum, p) => sum + preciseMultiply(safeNumber(p.quantity), safeNumber(p.purchasePrice)), 0),
                    averageBasket: currentSales.length > 0 ? netRevenue / currentSales.length : 0,
                    profitMargin: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
                    totalRevenueChange: calculateChange(netRevenue, prevNetRevenue),
                    netProfitChange: calculateChange(netProfit, prevNetProfit),
                    totalExpensesChange: calculateChange(totalExpenses, prevTotalExpenses),
                    saleCountChange: calculateChange(currentSales.length, allSales.length - currentSales.length),
                },
                salesByDay: Array.from(salesByDayMap.entries()).map(([date, v]) => ({ date, ...v })),
                recentSales: currentSales
                    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                    .slice(0, 5)
                    .map(s => ({
                        uuid: s.uuid,
                        invoiceNumber: s.invoiceNumber,
                        total: safeNumber(s.total),
                        createdAt: s.createdAt,
                        customerName: s.customerUuid ? (customerMap.get(s.customerUuid) || 'Inconnu') : 'Client de passage',
                    })),
                recentReturns: allReturns
                    .filter(r => new Date(r.createdAt!) >= from)
                    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                    .slice(0, 5)
                    .map(r => ({
                        uuid: r.uuid,
                        originalInvoiceNumber: r.originalInvoiceNumber,
                        totalReturnValue: safeNumber(r.totalReturnValue),
                        createdAt: r.createdAt,
                        customerName: r.customerUuid ? (customerMap.get(r.customerUuid) || 'Inconnu') : 'Client de passage',
                    })),
                topProducts: Array.from(productSales.entries())
                    .sort((a, b) => b[1].revenueGenerated - a[1].revenueGenerated)
                    .slice(0, 5)
                    .map(([uuid, stats]) => {
                        const p = allProducts.find(prod => prod.uuid === uuid);
                        return {
                            productUuid: uuid,
                            name: p?.name || 'Produit Inconnu',
                            quantitySold: stats.quantitySold,
                            revenueGenerated: stats.revenueGenerated,
                            category: p?.category,
                        };
                    }),
                topCustomers: Array.from(customerSpending.entries())
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
            console.error('Critical Dashboard Service Error:', error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
