import CustomerDetailClient from './CustomerDetailClient';

/**
 * @fileOverview Shell serveur pour la page détail client.
 * Nécessaire pour 'output: export' car generateStaticParams ne peut pas coexister avec 'use client'.
 */

export function generateStaticParams() {
    return [{ uuid: 'detail' }];
}

export default function Page() {
    return <CustomerDetailClient />;
}
