'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductImportAnalysis } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus } from '@/lib/utils';
import { inventoryService } from './inventory.service';
import Papa from 'papaparse';
import { supplierService } from './supplier.service';
import type Dexie from 'dexie';

class ProductService {

    async getProducts(options?: { sortBy?: string }): Promise<Product[]> {
        let collection = db.products.toCollection();
        if (options?.sortBy) {
            const [field, order] = options.sortBy.split('_');
            collection = collection.sortBy(field);
            if (order === 'desc') {
                collection = collection.reverse();
            }
        }
        return collection.toArray();
    }
    
    async getProductsByUuids(uuids: string[]): Promise<Product[]> {
        if (uuids.length === 0) return [];
        return db.products.where('uuid').anyOf(uuids).toArray();
    }

    async filterProducts(filters: {
        query?: string;
        category?: string;
        supplierUuid?: string;
        stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
        sortBy?: string;
    }): Promise<Product[]> {
        let collection: Dexie.Collection<Product, number>;
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // 1. Use the most specific indexed query available as the starting point.
        //    Priority: Date-based Status > Status > Category > Supplier.
        if (filters.stockStatus === 'expired') {
            collection = db.products.where('dateExpiration').below(now);
        } else if (filters.stockStatus === 'expiring_soon') {
            collection = db.products.where('dateExpiration').between(now, thirtyDaysFromNow, true, true);
        } else if (filters.stockStatus && ['in_stock', 'low_stock', 'out_of_stock'].includes(filters.stockStatus)) {
            collection = db.products.where('stockStatus').equals(filters.stockStatus);
        } else if (filters.category && filters.category !== 'all') {
            collection = db.products.where('category').equals(filters.category);
        } else if (filters.supplierUuid && filters.supplierUuid !== 'all') {
            collection = db.products.where('supplierUuid').equals(filters.supplierUuid);
        } else {
            collection = db.products.toCollection();
        }

        let products = await collection.toArray();
        
        // 2. Apply remaining filters in-memory on the smaller, pre-filtered dataset.
        if (filters.category && filters.category !== 'all') {
            products = products.filter(p => p.category === filters.category);
        }
        if (filters.supplierUuid && filters.supplierUuid !== 'all') {
            products = products.filter(p => p.supplierUuid === filters.supplierUuid);
        }
        if (filters.stockStatus && ['in_stock', 'low_stock', 'out_of_stock'].includes(filters.stockStatus)) {
            products = products.filter(p => p.stockStatus === filters.stockStatus);
        }
        if (filters.stockStatus === 'expired') {
             products = products.filter(p => p.dateExpiration ? new Date(p.dateExpiration) < now : false);
        } else if (filters.stockStatus === 'expiring_soon') {
            products = products.filter(p => p.dateExpiration ? (new Date(p.dateExpiration) >= now && new Date(p.dateExpiration) <= thirtyDaysFromNow) : false);
        }

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.barcodes && p.barcodes.some(b => b.includes(lowerQuery)))
            );
        }

        // 3. Sort the final results.
        if (filters.sortBy) {
            const [field, order] = filters.sortBy.split('_');
            const isAsc = order === 'asc';
            
            products.sort((a: any, b: any) => {
                const valA = a[field];
                const valB = b[field];

                const aExists = valA !== undefined && valA !== null;
                const bExists = valB !== undefined && valB !== null;

                if (!aExists && !bExists) return 0;
                if (!aExists) return 1; // Put nulls/undefined at the end
                if (!bExists) return -1;

                if (valA < valB) return isAsc ? -1 : 1;
                if (valA > valB) return isAsc ? 1 : -1;
                return 0;
            });
        } else {
            products.sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        }

        return products;
    }

    async getProductByUuid(uuid: string): Promise<Product | undefined> {
        return db.products.where('uuid').equals(uuid).first();
    }

    async getProductByBarcode(barcode: string): Promise<Product | undefined> {
        return db.products.where('barcodes').equals(barcode).first();
    }

    async getCategories(): Promise<string[]> {
        const products = await db.products.toArray();
        const categories = new Set(products.map(p => p.category).filter(Boolean) as string[]);
        return Array.from(categories);
    }

    async addProduct(productData: Omit<Product, 'uuid'> & { supplierName?: string }): Promise<Product> {
        let finalSupplierUuid = productData.supplierUuid;
        if (productData.supplierName) {
            const supplier = await supplierService.findOrCreateSupplier(productData.supplierName);
            finalSupplierUuid = supplier.uuid;
        }

        const dataForRepo = { ...productData };
        delete (dataForRepo as any).supplierName;

        const newProduct: Product = {
            ...(dataForRepo as Omit<Product, 'uuid'>),
            uuid: uuidv4(),
            supplierUuid: finalSupplierUuid,
            createdAt: new Date(),
            updatedAt: new Date(),
            stockStatus: calculateStockStatus(productData.quantity, productData.minStockLevel),
        };
        const id = await db.products.add(newProduct);
        newProduct.id = id;
        return newProduct;
    }

    async updateProduct(uuid: string, productData: Partial<Product> & { supplierName?: string }): Promise<Product> {
        const existingProduct = await this.getProductByUuid(uuid);
        if (!existingProduct || !existingProduct.id) {
            throw new Error("Produit non trouvé.");
        }

        let finalSupplierUuid = productData.supplierUuid;
        if (productData.hasOwnProperty('supplierName')) {
            if (productData.supplierName) {
                 const supplier = await supplierService.findOrCreateSupplier(productData.supplierName, productData.supplierUuid);
                 finalSupplierUuid = supplier.uuid;
            } else {
                 finalSupplierUuid = undefined;
            }
        }
       

        const dataToUpdate: Partial<Product> = { ...productData };
        delete (dataToUpdate as any).supplierName;
        dataToUpdate.supplierUuid = finalSupplierUuid;
        dataToUpdate.updatedAt = new Date();

        const newQuantity = productData.quantity ?? existingProduct.quantity;
        const newMinStock = productData.minStockLevel ?? existingProduct.minStockLevel;
        if (productData.quantity !== undefined || productData.minStockLevel !== undefined) {
            dataToUpdate.stockStatus = calculateStockStatus(newQuantity, newMinStock);
        }
        
        await db.products.update(existingProduct.id, dataToUpdate);
        return { ...existingProduct, ...dataToUpdate };
    }

    async deleteProduct(uuid: string): Promise<void> {
        const hasLogs = await inventoryService.hasLogs(uuid);
        if (hasLogs) {
            throw new Error("Suppression impossible: ce produit a un historique de transactions (ventes, stocks...).");
        }
        const product = await this.getProductByUuid(uuid);
        if (product?.id) {
            await db.products.delete(product.id);
        }
    }
    
    async bulkDelete(uuids: string[]): Promise<void> {
        for (const uuid of uuids) {
            const hasLogs = await inventoryService.hasLogs(uuid);
            if (hasLogs) {
                const product = await db.products.where('uuid').equals(uuid).first();
                throw new Error(`Suppression impossible: Le produit "${product?.name || 'inconnu'}" a un historique de transactions.`);
            }
        }
        const productsToDelete = await db.products.where('uuid').anyOf(uuids).toArray();
        const idsToDelete = productsToDelete.map(p => p.id!);
        await db.products.bulkDelete(idsToDelete);
    }

    async analyzeImport(file: File): Promise<ProductImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const analysis = await this._analyzeImportData(results.data);
                        resolve(analysis);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(new Error("Erreur de parsing CSV: " + error.message));
                }
            });
        });
    }

    private async _analyzeImportData(csvData: any[]): Promise<ProductImportAnalysis> {
        const existingProducts = await this.getProducts();
        const existingNames = new Map(existingProducts.map(p => [p.name.toLowerCase().trim(), p]));

        const analysis: ProductImportAnalysis = {
            productsToAdd: [],
            productsToUpdate: [],
            skippedRows: [],
            errorRows: [],
            totalRows: csvData.length,
        };

        for (const row of csvData) {
            const name = row.name || row.nom;
            const price = row.price || row.prix_vente;
            
            if (!name || !price) {
                analysis.errorRows.push({ ...row, error: "Nom ou prix manquant" });
                continue;
            }
            
            const existingProduct = existingNames.get(name.toLowerCase().trim());

            const productData = {
                name,
                category: row.category || row.categorie || 'Non classé',
                price: parseFloat(price),
                purchasePrice: row.purchasePrice || row.prix_achat ? parseFloat(row.purchasePrice || row.prix_achat) : 0,
                quantity: row.quantity || row.stock ? parseInt(row.quantity || row.stock) : 0,
                minStockLevel: row.minStockLevel || row.stock_minimum ? parseInt(row.minStockLevel || row.stock_minimum) : 10,
                barcodes: row.barcodes || row.codes_barres ? String(row.barcodes || row.codes_barres).split(',').map((b:string) => b.trim()).filter(Boolean) : [],
            };

            if (isNaN(productData.price)) {
                 analysis.errorRows.push({ ...row, error: "Prix de vente invalide" });
                continue;
            }

            if (existingProduct) {
                analysis.productsToUpdate.push({ ...productData, uuid: existingProduct.uuid });
            } else {
                analysis.productsToAdd.push(productData);
            }
        }
        return analysis;
    }

    async executeImport(confirmedData: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        const now = new Date();

        const toAdd = confirmedData.toAdd.map(p => ({
            ...p,
            uuid: uuidv4(),
            createdAt: now,
            updatedAt: now,
            stockStatus: calculateStockStatus(p.quantity, p.minStockLevel),
        }));

         const toUpdate = confirmedData.toUpdate.map(p => ({
            ...p,
            updatedAt: now,
            stockStatus: calculateStockStatus(p.quantity, p.minStockLevel),
        }));
        
        await db.transaction('rw', db.products, async () => {
            if (toAdd.length > 0) await db.products.bulkAdd(toAdd);
            if (toUpdate.length > 0) await db.products.bulkPut(toUpdate);
        });
    }
}

export const productService = new ProductService();
