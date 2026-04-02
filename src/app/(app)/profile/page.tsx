'use client';

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ProfilePage() {
    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
            <PageHeader 
                title="Profil de l'Entreprise"
                description="Gérez les informations de votre établissement et vos tarifs de base."
            />

            <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-xl font-black tracking-tight">Informations Générales</CardTitle>
                    <CardDescription className="font-medium">
                        Ces détails apparaîtront sur vos factures, reçus et rapports officiels.
                    </CardDescription>
                </CardHeader>
                <CompanyProfileForm />
            </Card>
        </div>
    );
}
