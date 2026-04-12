import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralisation de la route dynamique pour la compatibilité 'output: export'.
 * Cette route est obsolète. Utiliser /stock/suppliers/detail?uuid=...
 */

export function generateStaticParams() {
    // Retourne une liste vide pour empêcher la génération de pages dynamiques au build
    return [];
}

export default function Page() {
    // Redirection de sécurité vers la gestion des stocks
    redirect('/stock');
    return null;
}
