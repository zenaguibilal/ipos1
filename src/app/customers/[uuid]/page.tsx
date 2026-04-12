import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralisation de la route dynamique pour la compatibilité 'output: export'.
 * Toutes les navigations doivent désormais utiliser /customers/detail?uuid=...
 */

export function generateStaticParams() {
    return [];
}

export default function Page() {
    // Par sécurité, on redirige vers la liste si cette route est accédée directement
    redirect('/customers');
    return null;
}
