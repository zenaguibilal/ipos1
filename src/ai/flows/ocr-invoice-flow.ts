
/**
 * @fileOverview Fonctionnalité d'extraction de données par IA (OCR) désactivée.
 * Directive 'use server' supprimée car incompatible avec 'output: export'.
 */
export async function ocrInvoice(input: any): Promise<any> {
    throw new Error("La fonctionnalité d'intelligence artificielle n'est pas activée.");
}
