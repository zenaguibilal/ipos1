
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Loader2, Building, MapPin, Phone, Mail, Globe, Wheat, Coins, FileText, CheckCircle2 } from 'lucide-react';
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
            toast.success('Profil de l\'entreprise mis à jour avec succès.');
        } catch (err) {
            toast.error("Échec de la mise à jour du profil.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isCompanyProfileLoading) {
        return (
            <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    ))}
                </div>
            </CardContent>
        );
    }

    const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
        <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h4>
        </div>
    );

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="p-8 space-y-10">
                {/* Section: Identité & Adresse */}
                <div className="space-y-6">
                    <SectionTitle title="Identité & Siège" icon={Building} />
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-xs font-bold ml-1">Nom de l'entreprise</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                <Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} className="pl-10 h-12 rounded-xl bg-muted/30 border-none shadow-inner font-bold" disabled={isSaving}/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-xs font-bold ml-1">Adresse Locale</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                <Input id="address" value={formState.address || ''} onChange={handleInputChange} className="pl-10 h-12 rounded-xl bg-muted/30 border-none shadow-inner" disabled={isSaving}/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-xs font-bold ml-1">Ville</Label>
                                <Input id="city" value={formState.city || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zipCode" className="text-xs font-bold ml-1">Code Postal</Label>
                                <Input id="zipCode" value={formState.zipCode || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-xs font-bold ml-1">Pays</Label>
                                <Input id="country" value={formState.country || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" disabled={isSaving}/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Contact */}
                <div className="space-y-6 pt-6 border-t border-border/50">
                    <SectionTitle title="Contact & Réseaux" icon={Phone} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold ml-1">Téléphone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                <Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} className="pl-10 h-12 rounded-xl bg-muted/30 border-none shadow-inner font-mono" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold ml-1">E-mail Professionnel</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} className="pl-10 h-12 rounded-xl bg-muted/30 border-none shadow-inner" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="website" className="text-xs font-bold ml-1">Site Web</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                <Input id="website" value={formState.website || ''} onChange={handleInputChange} className="pl-10 h-12 rounded-xl bg-muted/30 border-none shadow-inner" disabled={isSaving} placeholder="https://www.moncommerce.com" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Paramètres Spécifiques */}
                <div className="space-y-6 pt-6 border-t border-border/50">
                    <SectionTitle title="Paramètres Métier" icon={Coins} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 bg-amber-500/5 rounded-[1.5rem] border border-amber-500/10 space-y-3">
                            <div className="flex items-center gap-2 text-amber-600">
                                <Coins className="h-4 w-4" />
                                <Label htmlFor="goldPricePerGram" className="text-xs font-black uppercase tracking-tight">Cours de l'or (DA/g)</Label>
                            </div>
                            <Input 
                                id="goldPricePerGram" 
                                type="number"
                                step="0.01"
                                value={formState.goldPricePerGram || ''} 
                                onChange={handleInputChange} 
                                className="h-12 rounded-xl bg-background border-none shadow-sm font-black text-xl text-amber-600"
                                disabled={isSaving} 
                                placeholder="0.00" 
                            />
                        </div>
                        <div className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10 space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <Wheat className="h-4 w-4" />
                                <Label htmlFor="prix_pain" className="text-xs font-black uppercase tracking-tight">Prix du Pain (DA/pcs)</Label>
                            </div>
                            <Input 
                                id="prix_pain" 
                                type="number"
                                step="0.1"
                                value={formState.prix_pain || ''} 
                                onChange={handleInputChange} 
                                className="h-12 rounded-xl bg-background border-none shadow-sm font-black text-xl text-primary"
                                disabled={isSaving} 
                                placeholder="0.0" 
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Légal */}
                <div className="space-y-6 pt-6 border-t border-border/50">
                    <SectionTitle title="Informations Légales" icon={FileText} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="vatNumber" className="text-xs font-bold ml-1">N° TVA / NIF</Label>
                            <Input id="vatNumber" value={formState.vatNumber || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-muted/30 border-none shadow-inner font-mono" disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rcNumber" className="text-xs font-bold ml-1">N° Registre Commerce (RC)</Label>
                            <Input id="rcNumber" value={formState.rcNumber || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-muted/30 border-none shadow-inner font-mono" disabled={isSaving} />
                        </div>
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="p-8 bg-muted/5 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] text-muted-foreground font-medium italic">
                    Dernière mise à jour : {formState.updatedAt ? new Date(formState.updatedAt).toLocaleString() : 'Jamais'}
                </p>
                <Button type="submit" className="w-full sm:w-auto h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95" disabled={isSaving || isCompanyProfileLoading}>
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
            </CardFooter>
        </form>
    );
}
