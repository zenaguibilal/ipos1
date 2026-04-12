'use client';

import { NewReturnForm } from '@/components/returns/NewReturnForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

/**
 * @fileOverview Page de création d'un nouveau bon de retour client.
 */
export default function NewReturnPage() {
    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1400px] mx-auto animate-in fade-in duration-1000">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="rounded-xl border-none shadow-sm bg-card h-10 w-10 active:scale-90 transition-all" asChild>
                    <Link href="/returns"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <PageHeader 
                    title="Régularisation / Nouveau Retour" 
                    description="Traitement des litiges marchandises et rééquilibrage des créances"
                />
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-xs font-bold uppercase tracking-widest">Initialisation du protocole...</p>
                </div>
            }>
                <NewReturnForm />
            </Suspense>
        </div>
    );
}
