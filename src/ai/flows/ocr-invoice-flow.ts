
'use server';
/**
 * @fileOverview محرك استخراج بيانات فواتير الموردين باستخدام الذكاء الاصطناعي (OCR).
 * 
 * - ocrInvoice - دالة لمعالجة صورة الفاتورة واستخراج العناصر.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OcrInvoiceInputSchema = z.object({
  photoDataUri: z.string().describe("صورة الفاتورة كـ Data URI بصيغة Base64. المتوقع: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type OcrInvoiceInput = z.infer<typeof OcrInvoiceInputSchema>;

const OcrLineItemSchema = z.object({
  name: z.string().describe("اسم المنتج المستخرج."),
  quantity: z.number().describe("الكمية."),
  purchasePrice: z.number().describe("سعر الشراء الوحدوي."),
});

const OcrInvoiceOutputSchema = z.object({
  items: z.array(OcrLineItemSchema).describe("قائمة المنتجات المستخرجة من الفاتورة."),
  supplierName: z.string().optional().describe("اسم المورد إذا وجد."),
  invoiceNumber: z.string().optional().describe("رقم الفاتورة إذا وجد."),
});
export type OcrInvoiceOutput = z.infer<typeof OcrInvoiceOutputSchema>;

const ocrInvoicePrompt = ai.definePrompt({
  name: 'ocrInvoicePrompt',
  input: { schema: OcrInvoiceInputSchema },
  output: { schema: OcrInvoiceOutputSchema },
  config: {
    model: 'googleai/gemini-1.5-flash',
  },
  prompt: `أنت مساعد خبير في تحليل فواتير الموردين باللغتين العربية والفرنسية.
حلل هذه الصورة واستخرج قائمة المنتجات (الاسم، الكمية، سعر الشراء).
إذا لم تجد سعر الشراء، ضع 0.
استخرج أيضاً اسم المورد ورقم الفاتورة إن وجدا.

الصورة: {{media url=photoDataUri}}`,
});

const ocrInvoiceFlow = ai.defineFlow(
  {
    name: 'ocrInvoiceFlow',
    inputSchema: OcrInvoiceInputSchema,
    outputSchema: OcrInvoiceOutputSchema,
  },
  async (input) => {
    const { output } = await ocrInvoicePrompt(input);
    return output!;
  }
);

/**
 * دالة استخراج بيانات الفاتورة عبر Gemini 1.5 Flash.
 */
export async function ocrInvoice(input: OcrInvoiceInput): Promise<OcrInvoiceOutput> {
  return ocrInvoiceFlow(input);
}
