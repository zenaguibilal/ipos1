
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/stores/appStore";
import { Building, Mail, MapPin, Phone, Globe, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { companyProfile, isCompanyProfileLoading } = useAppStore(state => ({
        companyProfile: state.companyProfile,
        isCompanyProfileLoading: state.isCompanyProfileLoading,
    }));

    return (
        <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto pb-20">
            <PageHeader 
                title="Profil de l'Entreprise"
                description="Personnalisez l'identité de votre établissement pour les factures et rapports."
            />

            {/* Quick Preview Card - Premium "Business Card" Style */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <Card className="relative rounded-[2rem] border-none shadow-2xl bg-card overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                <Building className="h-12 w-12" />
                            </div>
                            
                            <div className="flex-grow space-y-2">
                                {isCompanyProfileLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-8 w-48" />
                                        <Skeleton className="h-4 w-64" />
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-black tracking-tighter text-primary">
                                            {companyProfile?.companyName || 'Mon Établissement'}
                                        </h2>
                                        <div className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 opacity-50" />
                                                {companyProfile?.city ? `${companyProfile.city}, ${companyProfile.country || ''}` : 'Localisation non définie'}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="h-3.5 w-3.5 opacity-50" />
                                                {companyProfile?.phone || 'Pas de téléphone'}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Globe className="h-3.5 w-3.5 opacity-50" />
                                                {companyProfile?.website || 'Pas de site web'}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="hidden lg:block p-4 rounded-2xl bg-muted/20 border border-border/50 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Statut Profil</p>
                                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                                    <ShieldCheck className="h-4 w-4" /> Vérifié & Actif
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <Card className="rounded-[2rem] border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            Détails de Configuration
                        </CardTitle>
                        <CardDescription className="font-medium">
                            Remplissez ces informations avec soin, elles figureront sur vos documents officiels.
                        </CardDescription>
                    </CardHeader>
                    <CompanyProfileForm />
                </Card>
            </div>
        </div>
    );
}
