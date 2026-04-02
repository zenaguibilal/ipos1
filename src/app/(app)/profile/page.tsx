
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/stores/appStore";
import { Building, Mail, MapPin, Phone, Globe, ShieldCheck, ChevronRight } from "lucide-react";
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
            <div className="relative group animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/5 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <Card className="relative rounded-[2rem] border-none shadow-2xl bg-card overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                <Building className="h-12 w-12" />
                            </div>
                            
                            <div className="flex-grow space-y-3">
                                {isCompanyProfileLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-8 w-48 rounded-lg" />
                                        <Skeleton className="h-4 w-64 rounded-lg" />
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-black tracking-tighter text-primary">
                                            {companyProfile?.companyName || 'Mon Établissement'}
                                        </h2>
                                        <div className="flex flex-wrap gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                                            <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-lg">
                                                <MapPin className="h-3 w-3" />
                                                {companyProfile?.city ? `${companyProfile.city}, ${companyProfile.country || ''}` : 'Localisation non définie'}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-lg">
                                                <Phone className="h-3 w-3" />
                                                {companyProfile?.phone || 'Pas de téléphone'}
                                            </div>
                                            {companyProfile?.website && (
                                                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-lg">
                                                    <Globe className="h-3 w-3" />
                                                    {companyProfile.website.replace(/^https?:\/\//, '')}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="hidden lg:block p-5 rounded-2xl bg-primary/5 border border-primary/10 text-center min-w-[160px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Statut Profil</p>
                                <div className="flex items-center justify-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-tighter">
                                    <ShieldCheck className="h-4 w-4" /> Vérifié & Actif
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 p-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <ChevronRight className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Détails de Configuration</CardTitle>
                                <CardDescription className="font-medium">
                                    Ces informations figureront sur vos factures, reçus et rapports officiels.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CompanyProfileForm />
                </Card>
            </div>
        </div>
    );
}
