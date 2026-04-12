import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirection des anciens chemins dynamiques vers le nouveau chemin statique 'detail'.
 * Cette approche évite les erreurs 'missing param' lors du build Next.js avec output: export.
 */

export function generateStaticParams() {
    return [{ uuid: 'detail' }];
}

export default function Page({ params }: { params: { uuid: string } }) {
    // Si l'utilisateur arrive sur /customers/UUID, on le redirige vers le SPA handler
    if (params.uuid !== 'detail') {
        redirect(`/customers/detail?uuid=${params.uuid}`);
    }
    
    return null;
}
