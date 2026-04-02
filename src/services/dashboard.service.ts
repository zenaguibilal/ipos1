'use client';

import type { DashboardData, Sale, Product, Customer, Expense, ProductReturn, TopCustomer } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { db } from '@/lib/db';

class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        try {
            // 1. Calculate previous period dates
            const duration = to.getTime() - from.getTime();
            const prevTo = new Date(from.getTime() - 1);
            const prevFrom = new Date(prevTo.getTime() - duration);

            // 2. Fetch all data needed in an extended range
            const [allSales, allExpenses, returns, customers, allProducts] = await Promise.all([
                db.sales.where('createdAt').between(prevFrom, to, true, true).toArray(),
                db.expenses.where('expenseDate').between(prevFrom, to, true, true).toArray(),
                db.product_returns.where('createdAt').between(from, to, true, true).toArray(),
                db.customers.toArray(),
                db.products.toArray(),
            ]);

            // 3. Split data into current and previous periods
            const currentSales = allSales.filter(s => new Date(s.createdAt!) >= from);
            const prevSales = allSales.filter(s => new Date(s.createdAt!) < from);

            const currentExpenses = allExpenses.filter(e => new Date(e.expenseDate) >= from);
            const prevExpenses = allExpenses.filter(e => new Date(e.expenseDate) < from);


            // 4. Calculate stats for CURRENT period
            const totalRevenue = currentSales.reduce((sum, sale) => sum + Number(sale.total), 0);
            const totalExpenses = currentExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
            const saleCount = currentSales.length;
            const totalCOGS = currentSales.reduce((sum, sale) => sum + sale.items.reduce((acc, item) => acc + (Number(item.purchasePrice) * Number(item.quantity)), 0), 0);
            const netProfit = totalRevenue - totalCOGS - totalExpenses;
            
            // 5. Calculate stats for PREVIOUS period
            const prevTotalRevenue = prevSales.reduce((sum, sale) => sum + Number(sale.total), 0);
            const prevTotalExpenses = prevExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
            const prevSaleCount = prevSales.length;
            const prevTotalCOGS = prevSales.reduce((sum, sale) => sum + sale.items.reduce((acc, item) => acc + (Number(item.purchasePrice) * Number(item.quantity)), 0), 0);
            const prevNetProfit = prevTotalRevenue - prevTotalCOGS - prevTotalExpenses;

            // 6. Calculate percentage changes
            const calculateChange = (current: number, previous: number): number | undefined => {
                if (previous === 0) {
                    return current > 0 ? Infinity : 0;
                }
                return ((current - previous) / previous) * 100;
            };
            
            const totalRevenueChange = calculateChange(totalRevenue, prevTotalRevenue);
            const netProfitChange = calculateChange(netProfit, prevNetProfit);
            const totalExpensesChange = calculateChange(totalExpenses, prevTotalExpenses);
            const saleCountChange = calculateChange(saleCount, prevSaleCount);

            const totalOutstandingDebt = customers.reduce((sum, c) => sum + Number(c.outstandingBalance), 0);
            const totalInventoryValue = allProducts.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.purchasePrice)), 0);


            // --- Process data for charts and lists (for current period only) ---

            const customerMap = new Map(customers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]));
            const defaultCustomerName = 'Client de passage';

            const salesByDayMap = new Map<string, { total: number, profit: number }>();
            const interval = eachDayOfInterval({ start: from, end: to });
            interval.forEach(day => {
                salesByDayMap.set(format(day, 'yyyy-MM-dd'), { total: 0, profit: 0 });
            });

            currentSales.forEach(sale => {
                const day = format(startOfDay(sale.createdAt!), 'yyyy-MM-dd');
                const saleCOGS = sale.items.reduce((acc, item) => acc + (Number(item.purchasePrice) * Number(item.quantity)), 0);
                const saleGrossProfit = Number(sale.total) - saleCOGS;

                if (salesByDayMap.has(day)) {
                    const current = salesByDayMap.get(day)!;
                    salesByDayMap.set(day, {
                        total: current.total + Number(sale.total),
                        profit: current.profit + saleGrossProfit,
                    });
                }
            });

            const salesByDay = Array.from(salesByDayMap.entries())
                .map(([date, values]) => ({ date, ...values }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const productSales = new Map<string, { quantitySold: number, revenueGenerated: number }>();
            currentSales.forEach(sale => {
                sale.items.forEach(item => {
                    if (!item.productUuid) return;
                    const current = productSales.get(item.productUuid) || { quantitySold: 0, revenueGenerated: 0 };
                    current.quantitySold += Number(item.quantity);
                    const itemSubtotal = Number(item.price) * Number(item.quantity);
                    const itemRevenue = Number(sale.subtotal) > 0 ? (itemSubtotal / Number(sale.subtotal)) * Number(sale.total) : itemSubtotal;
                    current.revenueGenerated += itemRevenue;
                    productSales.set(item.productUuid, current);
                });
            });

            const topProductsData = Array.from(productSales.entries())
                .sort((a, b) => b[1].revenueGenerated - a[1].revenueGenerated)
                .slice(0, 5);

            const topProducts = topProductsData.map(([uuid, stats]) => {
                const product = allProducts.find(p => p.uuid === uuid);
                return {
                    productUuid: uuid,
                    name: product?.name || 'Produit Inconnu',
                    quantitySold: stats.quantitySold,
                    revenueGenerated: stats.revenueGenerated,
                    category: product?.category,
                };
            });
            
            const customerSpending = new Map<string, number>();
            currentSales.forEach(sale => {
                if (!sale.customerUuid) return;
                const currentSpending = customerSpending.get(sale.customerUuid) || 0;
                customerSpending.set(sale.customerUuid, currentSpending + Number(sale.total));
            });

            const topCustomersData = Array.from(customerSpending.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            const topCustomers: TopCustomer[] = topCustomersData.map(([uuid, totalSpent]) => ({
                customerUuid: uuid,
                name: customerMap.get(uuid) || 'Client Inconnu',
                totalSpent,
            }));

            const lowStockProducts = allProducts
                .filter(p => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minStockLevel))
                .sort((a, b) => Number(a.quantity) - Number(b.quantity))
                .slice(0, 5);
                
            const recentSales = currentSales
                .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                .slice(0, 5)
                .map(sale => ({
                    uuid: sale.uuid,
                    invoiceNumber: sale.invoiceNumber,
                    total: Number(sale.total),
                    createdAt: sale.createdAt,
                    customerName: sale.customerUuid ? customerMap.get(sale.customerUuid) || 'Client Inconnu' : defaultCustomerName,
                }));

            const recentReturns = returns
                .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                .slice(0, 5)
                .map(pr => ({
                    uuid: pr.uuid,
                    originalInvoiceNumber: pr.originalInvoiceNumber,
                    totalReturnValue: Number(pr.totalReturnValue),
                    createdAt: pr.createdAt,
                    customerName: pr.customerUuid ? customerMap.get(pr.customerUuid) || 'Client Inconnu' : defaultCustomerName,
                }));
                
            return {
                stats: {
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    saleCount,
                    totalOutstandingDebt,
                    totalInventoryValue,
                    totalRevenueChange,
                    netProfitChange,
                    totalExpensesChange,
                    saleCountChange,
                },
                salesByDay,
                recentSales,
                recentReturns,
                topProducts,
                topCustomers,
                lowStockProducts,
            };
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
