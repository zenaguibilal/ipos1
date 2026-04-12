'use client';

import SupplierDetailClient from './SupplierDetailClient';
import { Suspense } from 'react';

/**
 * @fileOverview Route statique pour les détails fournisseurs.
 * Utilise les paramètres de recherche (?uuid=...) pour la compatibilité 'output: export'.
 */

export default function Page() {
    return (
        <Suspense fallback={<div className="p-20 text-center animate-pulse">Chargement du profil fournisseur...</div>}>
            <SupplierDetailClient />
        </Suspense>
    );
}
