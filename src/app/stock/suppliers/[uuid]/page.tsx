import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirection des anciens chemins dynamiques vers le nouveau chemin statique 'detail'.
 */

export function generateStaticParams() {
    return [{ uuid: 'detail' }];
}

export default function Page({ params }: { params: { uuid: string } }) {
    if (params.uuid !== 'detail') {
        redirect(`/stock/suppliers/detail?uuid=${params.uuid}`);
    }
    
    return null;
}
