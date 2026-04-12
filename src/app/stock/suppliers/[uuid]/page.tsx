import { redirect } from 'next/navigation';

/**
 * @fileOverview Route dynamique neutralisée.
 * Le système utilise désormais /stock/suppliers/detail?uuid=... pour la compatibilité 'output: export'.
 */

export function generateStaticParams() {
    // On fournit un paramètre bidon pour satisfaire les exigences du build statique Next.js
    return [{ uuid: 'fallback' }];
}

export default function Page() {
    // Redirection de sécurité vers la gestion des stocks
    redirect('/stock');
    return null;
}
