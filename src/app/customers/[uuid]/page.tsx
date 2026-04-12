import { redirect } from 'next/navigation';

/**
 * @fileOverview Route dynamique neutralisée.
 * Le système utilise désormais /customers/detail?uuid=... pour la compatibilité 'output: export'.
 */

export function generateStaticParams() {
    // On fournit un paramètre bidon pour satisfaire les exigences du build statique Next.js
    // Cela évite l'erreur "missing param" lors du build ou du développement.
    return [{ uuid: 'fallback' }];
}

export default function Page() {
    // Redirection immédiate vers la liste principale pour tout accès direct résiduel
    redirect('/customers');
    return null;
}
