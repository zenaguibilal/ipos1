'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Loader2, Building, MapPin, Phone, Mail, Wheat, Coins, FileText, CheckCircle2, RotateCcw, Hash, Cloud, Key, Clock } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { SupabaseSqlDialog } from './SupabaseSqlDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function CompanyProfileForm() {
    const { companyProfile, isCompanyProfileLoading } = useAppStore(state => ({
        companyProfile: state.companyProfile,
        isCompanyProfileLoading: state.isCompanyProfileLoading,
    }));
    const { updateCompanyProfile } = useAppStore(state => state.actions);
    const [formState, setFormState] = useState<Partial<CompanyProfile>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (companyProfile) {
            setFormState(companyProfile);
        }
    }, [companyProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        setIsSaving(true);
        try {
            await updateCompanyProfile({
                companyName: formState.companyName || undefined,
                address: formState.address || undefined,
                city: formState.city || undefined,
                zipCode: formState.zipCode || undefined,
                country: formState.country || undefined,
                phone: formState.phone || undefined,
                email: formState.email || undefined,
                website: formState.website || undefined,
                vatNumber: formState.vatNumber || undefined,
                rcNumber: formState.rcNumber || undefined,
                goldPricePerGram: formState.goldPricePerGram ? Number(formState.goldPricePerGram) : undefined,
                prix_pain: formState.prix_pain ? Number(formState.prix_pain) : undefined,
                supabase_url: formState.supabase_url || undefined,
                supabase_key: formState.supabase_key || undefined,
            });
            toast.success('Profil Elite mis à jour.');
        } catch (err) {
            toast.error("Échec de la mise à jour.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (companyProfile) {
            setFormState(companyProfile);
            toast.info("Modifications révoquées.");
        }
    };

    if (isCompanyProfileLoading) {
        return (
            <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-3 w-32 rounded-full bg-muted/20" />
                            <Skeleton className="h-9 w-full rounded-lg bg-muted/20" />
                        </div>
                    ))}
                </div>
            </CardContent>
        );
    }

    const SectionTitle = ({ title, icon: Icon, action }: { title: string, icon: any, action?: React.ReactNode }) => (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner border border-primary/10">
                    <Icon className="h-4 w-4" />
                </div>
                <h4 className="text-[10px] font-semibold uppercase text-muted-foreground opacity-60 italic">{title}</h4>
            </div>
            {action && action}
        </div>
    );

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="p-4 space-y-20">
                {/* Identité Section */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SectionTitle title="Souveraineté & Siège" icon={Building} />
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-4 group">
                            <Label htmlFor="companyName" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Nom commercial de l'établissement *</Label>
                            <div className="relative">
                                <Building className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20" />
                                <Input 
                                    id="companyName" 
                                    value={formState.companyName || ''} 
                                    onChange={handleInputChange} 
                                    className="pl-16 h-9 rounded-lg bg-black/20 border-none shadow-inner font-semibold text-xl" 
                                    placeholder="Ex: Mon Commerce de Luxe"
                                    required 
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        <div className="space-y-4 group">
                            <Label htmlFor="address" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Localisation administrative</Label>
                            <div className="relative">
                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20" />
                                <Input 
                                    id="address" 
                                    value={formState.address || ''} 
                                    onChange={handleInputChange} 
                                    className="pl-16 h-9 rounded-lg bg-black/20 border-none shadow-inner font-bold" 
                                    placeholder="Adresse complète..."
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-4">
                                <Label htmlFor="city" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Cité / Ville</Label>
                                <Input id="city" value={formState.city || ''} onChange={handleInputChange} className="h-9 rounded-lg bg-black/20 border-none shadow-inner px-6" placeholder="Ville..." disabled={isSaving}/>
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="zipCode" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Code Postal</Label>
                                <Input id="zipCode" value={formState.zipCode || ''} onChange={handleInputChange} className="h-9 rounded-lg bg-black/20 border-none shadow-inner px-6" placeholder="00000" disabled={isSaving}/>
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="country" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Pays</Label>
                                <Input id="country" value={formState.country || ''} onChange={handleInputChange} className="h-9 rounded-lg bg-black/20 border-none shadow-inner px-6" placeholder="Algérie" disabled={isSaving}/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cloud Sync Section */}
                <div className="space-y-4 pt-16 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-50">
                    <SectionTitle 
                        title="Connectivité Cloud (Supabase)" 
                        icon={Cloud} 
                        action={<SupabaseSqlDialog />}
                    />
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-6 bg-primary/5 rounded-lg border border-primary/10 mb-4">
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                Connectez votre propre instance Supabase pour activer la synchronisation multi-terminaux. Assurez-vous que vos tables correspondent au schéma iPOS en utilisant le bouton SQL ci-dessus.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="supabase_url" className="text-[10px] font-semibold uppercase ml-1 opacity-40">URL du projet Supabase</Label>
                            <div className="relative">
                                <Cloud className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20" />
                                <Input id="supabase_url" value={formState.supabase_url || ''} onChange={handleInputChange} className="pl-16 h-9 rounded-lg bg-black/20 border-none shadow-inner font-mono text-sm" placeholder="https://xxxx.supabase.co" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="supabase_key" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Clé API (Anon Key)</Label>
                            <div className="relative">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20" />
                                <Input id="supabase_key" type="password" value={formState.supabase_key || ''} onChange={handleInputChange} className="pl-16 h-9 rounded-lg bg-black/20 border-none shadow-inner font-mono text-sm" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." disabled={isSaving} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="space-y-4 pt-16 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <SectionTitle title="Connectivité & Réseaux" icon={Phone} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-4 group">
                            <Label htmlFor="phone" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Ligne Directe</Label>
                            <div className="relative">
                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20" />
                                <Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} className="pl-16 h-9 rounded-lg bg-black/20 border-none shadow-inner font-mono font-semibold" placeholder="+213..." disabled={isSaving} />
                            </div>
                        </div>
                        <div className="space-y-4 group">
                            <Label htmlFor="email" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Courriel Professionnel</Label>
                            <div className="relative">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20" />
                                <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} className="pl-16 h-9 rounded-lg bg-black/20 border-none shadow-inner font-bold" placeholder="contact@etablissement.com" disabled={isSaving} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Finance Section */}
                <div className="space-y-4 pt-16 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <SectionTitle title="Calculs Métiers & Automates" icon={Coins} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/10 space-y-6 relative overflow-hidden group">
                            <Coins className="absolute -right-6 -bottom-6 h-40 w-40 rotate-12 opacity-[0.03]" />
                            <div className="flex items-center gap-4 text-amber-600 relative z-10">
                                <div className="p-3 rounded-2xl bg-amber-500/10 shadow-inner"><Coins className="h-6 w-6" /></div>
                                <Label htmlFor="goldPricePerGram" className="text-[10px] font-semibold uppercase ">Cours de l'Or (DA/g)</Label>
                            </div>
                            <div className="relative z-10">
                                <Input id="goldPricePerGram" type="number" step="0.01" value={formState.goldPricePerGram || ''} onChange={handleInputChange} className="h-20 rounded-lg bg-background border-none shadow-sm font-semibold text-xl text-amber-600 text-center px-8" disabled={isSaving} />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 font-semibold text-[10px] text-amber-600 opacity-30 uppercase">DA/g</span>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-6 relative overflow-hidden group">
                            <Wheat className="absolute -right-6 -bottom-6 h-40 w-40 -rotate-12 opacity-[0.03]" />
                            <div className="flex items-center gap-4 text-primary relative z-10">
                                <div className="p-3 rounded-2xl bg-primary/10 shadow-inner"><Wheat className="h-6 w-6" /></div>
                                <Label htmlFor="prix_pain" className="text-[10px] font-semibold uppercase ">Tarif Unitaire Pain (DA/pcs)</Label>
                            </div>
                            <div className="relative z-10">
                                <Input id="prix_pain" type="number" step="0.1" value={formState.prix_pain || ''} onChange={handleInputChange} className="h-20 rounded-lg bg-background border-none shadow-sm font-semibold text-xl text-primary text-center px-8" disabled={isSaving} />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 font-semibold text-[10px] text-primary opacity-30 uppercase">DA/pcs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Légal Section */}
                <div className="space-y-4 pt-16 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <SectionTitle title="Registre Légal & Fiscal" icon={FileText} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <Label htmlFor="vatNumber" className="text-[10px] font-semibold uppercase ml-1 opacity-40">NIF / TVA</Label>
                            <div className="relative">
                                <FileText className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20" />
                                <Input id="vatNumber" value={formState.vatNumber || ''} onChange={handleInputChange} className="pl-16 h-9 rounded-lg bg-black/20 border-none shadow-inner font-mono px-6 uppercase" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="rcNumber" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Registre de Commerce (RC)</Label>
                            <div className="relative">
                                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20" />
                                <Input id="rcNumber" value={formState.rcNumber || ''} onChange={handleInputChange} className="pl-16 h-9 rounded-lg bg-black/20 border-none shadow-inner font-mono px-6 uppercase" disabled={isSaving} />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="p-4 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Dernier enregistrement : {formState.updatedAt ? format(new Date(formState.updatedAt), 'd MMM yyyy, HH:mm', { locale: fr }) : 'Initial'}</p>
                    </div>
                    {companyProfile?.last_sync_at && (
                        <div className="flex items-center gap-3">
                            <div className="p-1 rounded-md bg-primary/10">
                                <Cloud className="h-2.5 w-2.5 text-primary" />
                            </div>
                            <p className="text-[10px] font-semibold text-primary/60 uppercase tracking-tighter">Synchronisation Cloud : {format(new Date(companyProfile.last_sync_at), 'd MMM yyyy, HH:mm', { locale: fr })}</p>
                        </div>
                    )}
                </div>
                <div className="flex gap-6 w-full sm:w-auto">
                    <Button type="button" variant="ghost" onClick={handleReset} className="h-9 px-4 rounded-2xl font-semibold text-[10px] uppercase gap-3" disabled={isSaving}>
                        <RotateCcw className="h-4 w-4 opacity-40" /> Annuler
                    </Button>
                    <Button type="submit" className="flex-1 sm:flex-none h-9 px-14 rounded-2xl font-semibold text-[10px] uppercase shadow-sm shadow-sm gap-4" disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin"/> : <CheckCircle2 className="h-5 w-5" />}
                        Valider le Profil Elite
                    </Button>
                </div>
            </CardFooter>
        </form>
    );
}