'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Loader2, Building, MapPin, Phone, Mail, Globe, Wheat, Coins, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

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
            });
            toast.success('Profil mis à jour avec succès.');
        } catch (err) {
            toast.error("Échec de la mise à jour du profil.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (companyProfile) {
            setFormState(companyProfile);
            toast.info("Modifications annulées.");
        }
    };

    if (isCompanyProfileLoading) {
        return (
            <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-3 w-32 rounded-full" />
                            <Skeleton className="h-14 w-full rounded-2xl" />
                        </div>
                    ))}
                </div>
            </CardContent>
        );
    }

    const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner">
                <Icon className="h-4 w-4" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">{title}</h4>
        </div>
    );

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="p-10 space-y-16">
                {/* Section: Identité & Adresse */}
                <div className="space-y-8">
                    <SectionTitle title="Identité & Siège" icon={Building} />
                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                            <Label htmlFor="companyName" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Nom commercial de l'établissement *</Label>
                            <div className="relative">
                                <Building className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-30" />
                                <Input 
                                    id="companyName" 
                                    value={formState.companyName || ''} 
                                    onChange={handleInputChange} 
                                    className="pl-14 h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-black text-xl focus-visible:ring-primary/20" 
                                    required 
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Adresse du siège</Label>
                            <div className="relative">
                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-30" />
                                <Input 
                                    id="address" 
                                    value={formState.address || ''} 
                                    onChange={handleInputChange} 
                                    className="pl-14 h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-bold focus-visible:ring-primary/20" 
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="city" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Ville</Label>
                                <Input id="city" value={formState.city || ''} onChange={handleInputChange} className="h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-bold focus-visible:ring-primary/20" disabled={isSaving}/>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="zipCode" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Code Postal</Label>
                                <Input id="zipCode" value={formState.zipCode || ''} onChange={handleInputChange} className="h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" disabled={isSaving}/>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="country" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Pays</Label>
                                <Input id="country" value={formState.country || ''} onChange={handleInputChange} className="h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-bold focus-visible:ring-primary/20" disabled={isSaving}/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Contact */}
                <div className="space-y-8 pt-12 border-t border-border/50">
                    <SectionTitle title="Contact & Réseaux" icon={Phone} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Téléphone</Label>
                            <div className="relative">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-30" />
                                <Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} className="pl-14 h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">E-mail Professionnel</Label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-30" />
                                <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} className="pl-14 h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-bold focus-visible:ring-primary/20" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="sm:col-span-2 space-y-3">
                            <Label htmlFor="website" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Site Web ou Catalogue</Label>
                            <div className="relative">
                                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-30" />
                                <Input id="website" value={formState.website || ''} onChange={handleInputChange} className="pl-14 h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-bold focus-visible:ring-primary/20" disabled={isSaving} placeholder="www.votrecommerce.com" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Paramètres Spécifiques */}
                <div className="space-y-8 pt-12 border-t border-border/50">
                    <SectionTitle title="Paramètres Métier" icon={Coins} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="p-8 bg-amber-500/5 rounded-[2.5rem] border border-amber-500/10 space-y-5 group hover:bg-amber-500/10 transition-all duration-500">
                            <div className="flex items-center gap-3 text-amber-600">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 shadow-sm">
                                    <Coins className="h-5 w-5" />
                                </div>
                                <Label htmlFor="goldPricePerGram" className="text-[10px] font-black uppercase tracking-[0.2em]">Cours de l'or (DA/g)</Label>
                            </div>
                            <div className="relative">
                                <Input 
                                    id="goldPricePerGram" 
                                    type="number"
                                    step="0.01"
                                    value={formState.goldPricePerGram || ''} 
                                    onChange={handleInputChange} 
                                    className="h-16 rounded-2xl bg-background border-none shadow-sm font-black text-3xl text-amber-600 focus-visible:ring-amber-500/20 px-8"
                                    disabled={isSaving} 
                                    placeholder="0.00" 
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-xs opacity-20 uppercase tracking-widest">DA/G</span>
                            </div>
                        </div>
                        <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-5 group hover:bg-primary/10 transition-all duration-500">
                            <div className="flex items-center gap-3 text-primary">
                                <div className="p-2.5 rounded-xl bg-primary/10 shadow-sm">
                                    <Wheat className="h-5 w-5" />
                                </div>
                                <Label htmlFor="prix_pain" className="text-[10px] font-black uppercase tracking-[0.2em]">Prix du Pain (DA/pcs)</Label>
                            </div>
                            <div className="relative">
                                <Input 
                                    id="prix_pain" 
                                    type="number"
                                    step="0.1"
                                    value={formState.prix_pain || ''} 
                                    onChange={handleInputChange} 
                                    className="h-16 rounded-2xl bg-background border-none shadow-sm font-black text-3xl text-primary focus-visible:ring-primary/20 px-8"
                                    disabled={isSaving} 
                                    placeholder="0.0" 
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-xs opacity-20 uppercase tracking-widest">DA/PCS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Légal */}
                <div className="space-y-8 pt-12 border-t border-border/50">
                    <SectionTitle title="Informations Légales" icon={FileText} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label htmlFor="vatNumber" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">N° TVA / NIF</Label>
                            <Input id="vatNumber" value={formState.vatNumber || ''} onChange={handleInputChange} className="h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20 px-6" disabled={isSaving} placeholder="000000000000000" />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="rcNumber" className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">N° Registre Commerce (RC)</Label>
                            <Input id="rcNumber" value={formState.rcNumber || ''} onChange={handleInputChange} className="h-16 rounded-[1.25rem] bg-muted/30 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20 px-6" disabled={isSaving} placeholder="00/00-0000000X00" />
                        </div>
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="p-10 bg-muted/10 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40 italic">
                        Dernière mise à jour du profil
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground/60">
                        {formState.updatedAt ? new Date(formState.updatedAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }) : 'Identité initiale'}
                    </p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <Button type="button" variant="ghost" onClick={handleReset} className="h-16 px-8 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 hover:bg-background" disabled={isSaving}>
                        <RotateCcw className="h-4 w-4" /> Annuler
                    </Button>
                    <Button type="submit" className="flex-1 sm:flex-none h-16 px-12 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3" disabled={isSaving || isCompanyProfileLoading}>
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin"/> : <CheckCircle2 className="h-5 w-5" />}
                        {isSaving ? 'Mise à jour...' : 'Enregistrer le Profil'}
                    </Button>
                </div>
            </CardFooter>
        </form>
    );
}
