'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/stores/appStore";
import { Building, MapPin, Phone, Globe, ShieldCheck, ChevronRight, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { companyProfile, isCompanyProfileLoading } = useAppStore(state => ({
        companyProfile: state.companyProfile,
        isCompanyProfileLoading: state.isCompanyProfileLoading,
    }));

    return (
        <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto pb-24">
            <PageHeader 
                title="Profil de l'Établissement"
                description="Définissez l'identité visuelle et légale de votre commerce pour vos documents officiels."
            />

            {/* Quick Preview Card - Premium "Business Card" Style */}
            <div className="relative group animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-primary/5 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <Card className="relative rounded-[2.5rem] border-none shadow-2xl bg-card overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                        <Share2 className="h-40 w-40 rotate-12" />
                    </div>
                    <CardContent className="p-10 relative z-10">
                        <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center">
                            <div className="h-28 w-28 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                <Building className="h-14 w-14" />
                            </div>
                            
                            <div className="flex-grow space-y-4">
                                {isCompanyProfileLoading ? (
                                    <div className="space-y-3">
                                        <Skeleton className="h-10 w-64 rounded-xl" />
                                        <Skeleton className="h-5 w-80 rounded-xl" />
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-4xl font-black tracking-tighter text-primary">
                                            {companyProfile?.companyName || 'Mon Établissement'}
                                        </h2>
                                        <div className="flex flex-wrap gap-4 text-xs font-black text-muted-foreground uppercase tracking-widest opacity-70">
                                            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                                {companyProfile?.city ? `${companyProfile.city}, ${companyProfile.country || ''}` : 'Localisation non définie'}
                                            </div>
                                            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                                                <Phone className="h-3.5 w-3.5 text-primary" />
                                                {companyProfile?.phone || 'Pas de téléphone'}
                                            </div>
                                            {companyProfile?.website && (
                                                <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                                                    <Globe className="h-3.5 w-3.5 text-primary" />
                                                    {companyProfile.website.replace(/^https?:\/\//, '')}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="hidden xl:block p-6 rounded-3xl bg-primary/5 border border-primary/10 text-center min-w-[180px] backdrop-blur-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 opacity-50">Statut Identité</p>
                                <div className="flex items-center justify-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-tighter bg-emerald-500/10 py-2 rounded-xl">
                                    <ShieldCheck className="h-4 w-4" /> Certifié & Actif
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <Card className="rounded-[3rem] border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 p-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <ChevronRight className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tight">Configuration Détaillée</CardTitle>
                                <CardDescription className="font-medium text-muted-foreground/70">
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
