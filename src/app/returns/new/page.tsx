'use client';

import { NewReturnForm } from '@/components/returns/NewReturnForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

export default function NewReturnPage() {
    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1400px] mx-auto animate-in fade-in duration-1000">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="rounded-xl border-none shadow-sm bg-card h-10 w-10" asChild>
                    <Link href="/returns"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <PageHeader 
                    title="Régularisation / Nouveau Retour" 
                    description="Traitement Elite des litiges marchandises et rééquilibrage des créances"
                />
            </div>

            <Suspense fallback={<div className="p-20 text-center animate-pulse">Initialisation du protocole de retour...</div>}>
                <NewReturnForm />
            </Suspense>
        </div>
    );
}
