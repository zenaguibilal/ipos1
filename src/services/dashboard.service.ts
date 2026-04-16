'use client';

import type { DashboardData, TopCustomer, SalesByDay, RecentSale, RecentReturn } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { db } from '@/lib/db';
import { preciseMultiply, safeNumber } from '@/lib/utils';

/**
 * @fileOverview Service نخبوي لحساب بيانات لوحة التحكم بدقة محاسبية.
 * يقوم بتحليل التدفقات المالية، الأرباح، والمخزون مع معالجة دقيقة للمرتجعات والمصاريف.
 */
class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        try {
            // حساب الفترة السابقة للمقارنة
            const duration = to.getTime() - from.getTime();
            const prevTo = new Date(from.getTime() - 1);
            const prevFrom = new Date(prevTo.getTime() - duration);

            // جلب البيانات للفترتين (الحالية والسابقة) للمقارنة
            // ملاحظة: نستخدم كائنات التاريخ مباشرة لأن Dexie يخزنها كـ Date
            const [allSales, allExpenses, allReturns, customers, allProducts] =
                await Promise.all([
                    db.sales
                        .where('createdAt')
                        .between(prevFrom, to, true, true)
                        .toArray(),
                    db.expenses
                        .where('expenseDate')
                        .between(prevFrom, to, true, true)
                        .toArray(),
                    db.product_returns
                        .where('createdAt')
                        .between(prevFrom, to, true, true)
                        .toArray(),
                    db.customers.toArray(),
                    db.products.toArray(),
                ]);

            const productPurchaseMap = new Map(allProducts.map(p => [p.uuid, safeNumber(p.purchasePrice)]));
            const customerMap = new Map(customers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]));

            // عدادات الفترة الحالية
            let currentRevenue = 0;
            let currentCOGS = 0;
            let currentReturns = 0;
            let currentReturnCOGS = 0;
            let currentExpenses = 0;
            let currentSaleCount = 0;

            // عدادات الفترة السابقة
            let prevRevenue = 0;
            let prevCOGS = 0;
            let prevReturns = 0;
            let prevReturnCOGS = 0;
            let prevExpenses = 0;
            let prevSaleCount = 0;

            const productSales = new Map<string, { quantitySold: number; revenueGenerated: number }>();
            const customerSpending = new Map<string, number>();
            const salesByDayMap = new Map<string, { total: number; profit: number }>();

            // تهيئة خريطة الأيام للرسم البياني
            eachDayOfInterval({ start: from, end: to }).forEach(day => {
                salesByDayMap.set(format(day, 'yyyy-MM-dd'), { total: 0, profit: 0 });
            });

            // 1. تحليل المبيعات
            allSales.forEach(sale => {
                const saleDate = new Date(sale.createdAt!);
                const isCurrent = saleDate >= from;
                let saleCOGS = 0;

                sale.items.forEach(item => {
                    const qty = safeNumber(item.quantity);
                    const pPrice = safeNumber(item.purchasePrice) || productPurchaseMap.get(item.productUuid || '') || 0;
                    saleCOGS += preciseMultiply(pPrice, qty);

                    if (isCurrent && item.productUuid) {
                        const stats = productSales.get(item.productUuid) || { quantitySold: 0, revenueGenerated: 0 };
                        stats.quantitySold += qty;
                        stats.revenueGenerated += preciseMultiply(safeNumber(item.price), qty);
                        productSales.set(item.productUuid, stats);
                    }
                });

                if (isCurrent) {
                    currentRevenue += safeNumber(sale.total);
                    currentCOGS += saleCOGS;
                    currentSaleCount++;
                    
                    const dayKey = format(startOfDay(saleDate), 'yyyy-MM-dd');
                    const daily = salesByDayMap.get(dayKey);
                    if (daily) {
                        daily.total += safeNumber(sale.total);
                        daily.profit += (safeNumber(sale.total) - saleCOGS);
                    }

                    if (sale.customerUuid) {
                        customerSpending.set(sale.customerUuid, (customerSpending.get(sale.customerUuid) || 0) + safeNumber(sale.total));
                    }
                } else {
                    prevRevenue += safeNumber(sale.total);
                    prevCOGS += saleCOGS;
                    prevSaleCount++;
                }
            });

            // 2. تحليل المرتجعات (خصمها من الإيرادات والأرباح)
            allReturns.forEach(ret => {
                const retDate = new Date(ret.createdAt!);
                const isCurrent = retDate >= from;
                let returnCOGS = 0;

                ret.items.forEach(item => {
                    // فقط إذا عادت السلعة للمخزون، نعيد احتساب تكلفتها لصالح المحل
                    if (item.wasRestocked) {
                        const pPrice = safeNumber(item.purchasePrice) || productPurchaseMap.get(item.productUuid || '') || 0;
                        returnCOGS += preciseMultiply(pPrice, item.quantity);
                    }
                });

                if (isCurrent) {
                    currentReturns += safeNumber(ret.totalReturnValue);
                    currentReturnCOGS += returnCOGS;
                    
                    const dayKey = format(startOfDay(retDate), 'yyyy-MM-dd');
                    const daily = salesByDayMap.get(dayKey);
                    if (daily) {
                        daily.total -= safeNumber(ret.totalReturnValue);
                        daily.profit -= (safeNumber(ret.totalReturnValue) - returnCOGS);
                    }
                } else {
                    prevReturns += safeNumber(ret.totalReturnValue);
                    prevReturnCOGS += returnCOGS;
                }
            });

            // 3. تحليل المصاريف
            allExpenses.forEach(exp => {
                const expDate = new Date(exp.expenseDate);
                if (expDate >= from) {
                    currentExpenses += safeNumber(exp.amount);
                } else {
                    prevExpenses += safeNumber(exp.amount);
                }
            });

            // 4. الحسابات النهائية الصافية
            const netRevenue = currentRevenue - currentReturns;
            const netProfit = netRevenue - (currentCOGS - currentReturnCOGS) - currentExpenses;

            const prevNetRevenue = prevRevenue - prevReturns;
            const prevNetProfit = prevNetRevenue - (prevCOGS - prevReturnCOGS) - prevExpenses;

            const calculateChange = (curr: number, prev: number) => {
                if (prev === 0) return curr > 0 ? 100 : 0;
                return ((curr - prev) / Math.abs(prev)) * 100;
            };

            return {
                stats: {
                    totalRevenue: netRevenue,
                    totalExpenses: currentExpenses,
                    netProfit: netProfit,
                    saleCount: currentSaleCount,
                    totalOutstandingDebt: customers.reduce((sum, c) => sum + safeNumber(c.outstandingBalance), 0),
                    totalInventoryValue: allProducts.reduce((sum, p) => sum + preciseMultiply(safeNumber(p.quantity), safeNumber(p.purchasePrice)), 0),
                    averageBasket: currentSaleCount > 0 ? netRevenue / currentSaleCount : 0,
                    profitMargin: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
                    totalRevenueChange: calculateChange(netRevenue, prevNetRevenue),
                    netProfitChange: calculateChange(netProfit, prevNetProfit),
                    totalExpensesChange: calculateChange(currentExpenses, prevExpenses),
                    saleCountChange: calculateChange(currentSaleCount, prevSaleCount),
                },
                salesByDay: Array.from(salesByDayMap.entries()).map(([date, v]) => ({ date, ...v })),
                recentSales: allSales
                    .filter(s => new Date(s.createdAt!) >= from)
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
