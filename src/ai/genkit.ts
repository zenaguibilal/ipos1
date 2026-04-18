
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview إعداد محرك Genkit الأساسي.
 * يتم استخدام هذا الكائن في كافة تدفقات الذكاء الاصطناعي (Flows).
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
