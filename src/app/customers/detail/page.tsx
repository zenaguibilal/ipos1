'use client';

import CustomerDetailClient from './CustomerDetailClient';
import { Suspense } from 'react';

/**
 * @fileOverview Route statique pour les détails clients.
 * Utilise les paramètres de recherche (?uuid=...) pour la compatibilité 'output: export'.
 */

export default function Page() {
    return (
        <Suspense fallback={<div className="p-20 text-center animate-pulse">Chargement du profil client...</div>}>
            <CustomerDetailClient />
        </Suspense>
    );
}
