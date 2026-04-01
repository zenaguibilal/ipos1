'use client';

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataManagementCard } from "@/components/profile/DataManagementCard";

export default function ProfilePage() {

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader 
                title="Profil & Paramètres"
                description="Gérez les informations de votre entreprise et vos données."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Informations sur l'entreprise</CardTitle>
                    <CardDescription>
                        Ces informations seront utilisées sur les reçus et autres documents.
                    </CardDescription>
                </CardHeader>
                <CompanyProfileForm />
            </Card>

            <DataManagementCard />
        </div>
    );
}
