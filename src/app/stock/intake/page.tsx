'use client';

import { NewIntakeForm } from '@/components/stock/NewIntakeForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewIntakePage() {
    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1400px] mx-auto animate-in fade-in duration-1000">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="rounded-xl border-none shadow-sm bg-card h-10 w-10" asChild>
                    <Link href="/stock"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <PageHeader 
                    title="Nouveau Manifeste de Réception" 
                    description="Enregistrement souverain des flux entrants et mise à jour des coûts de revient"
                />
            </div>

            <NewIntakeForm />
        </div>
    );
}
