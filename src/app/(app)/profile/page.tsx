'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/stores/appStore";
import { Building, MapPin, Phone, Globe, ShieldCheck, ChevronRight, Share2, Sparkles, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { companyProfile, isCompanyProfileLoading } = useAppStore(state => ({
        companyProfile: state.companyProfile,
        isCompanyProfileLoading: state.isCompanyProfileLoading,
    }));

    return (
        <div className="p-6 sm:p-10 space-y-12 max-w-6xl mx-auto pb-32 animate-in fade-in duration-1000">
            <PageHeader 
                title="Identité Institutionnelle"
                description="Configuration souveraine de l'établissement pour documents officiels et gestion des offres"
            />

            {/* Elite Business Card Preview */}
            <div className="relative group animate-in slide-in-from-top-8 duration-1000">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/60 via-primary/5 to-transparent rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <Card className="relative rounded-[3rem] border-white/5 shadow-2xl bg-card/40 backdrop-blur-3xl overflow-hidden group-hover:border-primary/20 transition-all duration-700">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
                        <Share2 className="h-60 w-60 rotate-12" />
                    </div>
                    <CardContent className="p-12 relative z-10">
                        <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative h-32 w-32 rounded-[2.5rem] bg-black/40 flex items-center justify-center text-primary border border-white/5 shadow-2xl group-hover:scale-105 group-hover:rotate-3 transition-all duration-700">
                                    <Building className="h-16 w-16" />
                                </div>
                            </div>
                            
                            <div className="flex-grow space-y-6">
                                {isCompanyProfileLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-80 rounded-2xl bg-muted/20" />
                                        <Skeleton className="h-6 w-96 rounded-xl bg-muted/20" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Établissement Enregistré</p>
                                            <h2 className="text-5xl font-black tracking-tighter text-primary group-hover:scale-[1.01] transition-transform origin-left">
                                                {companyProfile?.companyName || 'Non Identifié'}
                                            </h2>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner group-hover:border-primary/10 transition-colors">
                                                <MapPin className="h-4 w-4 text-primary/60" />
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                                                    {companyProfile?.city ? `${companyProfile.city}, ${companyProfile.country || ''}` : 'Localisation Inconnue'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner group-hover:border-primary/10 transition-colors">
                                                <Phone className="h-4 w-4 text-primary/60" />
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                                                    {companyProfile?.phone || 'Ligne Non Définie'}
                                                </span>
                                            </div>
                                            {companyProfile?.website && (
                                                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner group-hover:border-primary/10 transition-colors">
                                                    <Globe className="h-4 w-4 text-primary/60" />
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                                                        {companyProfile.website.replace(/^https?:\/\//, '')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="hidden xl:flex flex-col items-center gap-4 p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 text-center min-w-[220px] backdrop-blur-xl relative overflow-hidden group/status">
                                <Sparkles className="absolute -right-4 -top-4 h-16 w-16 text-emerald-500/10 group-hover/status:opacity-30 transition-opacity" />
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600/60 mb-1 relative z-10">Certification iPOS</p>
                                <div className="flex items-center justify-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 px-4 py-3 rounded-2xl w-full border border-emerald-500/20 relative z-10">
                                    <ShieldCheck className="h-4 w-4" /> Actif & Protégé
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <Card className="rounded-[3.5rem] border border-white/5 shadow-2xl bg-card/40 backdrop-blur-3xl overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-12">
                        <div className="flex items-center gap-6">
                            <div className="p-4 rounded-[1.25rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/30">
                                <Star className="h-7 w-7" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black tracking-tighter">Configuration des Registres</CardTitle>
                                <CardDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
                                    Définissez les paramètres légaux et les prix de référence de votre boutique de luxe.
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
