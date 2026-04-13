'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { 
    Loader2, Building, MapPin, Phone, Mail, Wheat, Coins, 
    FileText, CheckCircle2, RotateCcw, Hash, Cloud, Key, 
    ShieldCheck, Landmark, Receipt, Percent, Globe
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formulaire de configuration du profil établissement iPOS Zen.
 * Intègre les champs fiscaux algériens obligatoires pour la facturation A4.
 */
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
        const { id, value, type } = e.target;
        setFormState(prev => ({ 
            ...prev, 
            [id]: type === 'number' ? Number(value) : value 
        }));
    };

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateCompanyProfile(formState);
            toast.success('Profil institutionnel mis à jour avec succès.');
        } catch (err) {
            toast.error("Échec de la mise à jour du profil.");
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
            <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-3 w-32 rounded-full bg-muted/20" />
                            <Skeleton className="h-11 w-full rounded-xl bg-muted/20" />
                        </div>
                    ))}
                </div>
            </CardContent>
        );
    }

    const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner border border-primary/10">
                <Icon className="h-4 w-4" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground opacity-60">{title}</h4>
        </div>
    );

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="p-6 space-y-16">
                
                {/* 1. IDENTITÉ & STRUCTURE */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SectionTitle title="Identité & Forme Juridique" icon={Building} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-[10px] font-bold uppercase ml-1 opacity-40">Raison Sociale *</Label>
                            <Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-black text-lg focus-visible:ring-primary/20" required disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="legal_form" className="text-[10px] font-bold uppercase ml-1 opacity-40">Forme Juridique</Label>
                            <Input id="legal_form" value={formState.legal_form || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold focus-visible:ring-primary/20" placeholder="Ex: SARL, EURL, EI, Auto-entrepreneur..." disabled={isSaving}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="address" className="text-[10px] font-bold uppercase ml-1 opacity-40">Siège Social</Label>
                            <Input id="address" value={formState.address || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold focus-visible:ring-primary/20" placeholder="Adresse complète..." disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-[10px] font-bold uppercase ml-1 opacity-40">Ville / Wilaya</Label>
                            <Input id="city" value={formState.city || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold focus-visible:ring-primary/20" disabled={isSaving}/>
                        </div>
                    </div>
                </div>

                {/* 2. IDENTIFIANTS FISCAUX ALGÉRIENS */}
                <div className="space-y-6 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <SectionTitle title="Régime Fiscal & Identifiants" icon={Landmark} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="rc_number" className="text-[10px] font-bold uppercase ml-1 opacity-40">Reg. Commerce (RC)</Label>
                            <Input id="rc_number" value={formState.rc_number || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" placeholder="WW/BB-NNNNNNN" disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nif" className="text-[10px] font-bold uppercase ml-1 opacity-40">Ident. Fiscale (NIF)</Label>
                            <Input id="nif" value={formState.nif || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" placeholder="15 chiffres" disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai_number" className="text-[10px] font-bold uppercase ml-1 opacity-40">Art. Imposition (AI)</Label>
                            <Input id="ai_number" value={formState.ai_number || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nis_number" className="text-[10px] font-bold uppercase ml-1 opacity-40">Statistique (NIS)</Label>
                            <Input id="nis_number" value={formState.nis_number || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" disabled={isSaving}/>
                        </div>
                    </div>
                </div>

                {/* 3. PARAMÉTRAGE TVA & PRIX SPÉCIAUX */}
                <div className="space-y-6 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <SectionTitle title="Fiscalité TVA & Références" icon={Percent} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="tva_rate" className="text-[10px] font-bold uppercase ml-1 opacity-40">Taux TVA par défaut (%)</Label>
                            <Input id="tva_rate" type="number" value={formState.tva_rate || 19} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-black text-primary text-center focus-visible:ring-primary/20" disabled={isSaving}/>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between group hover:bg-primary/10 transition-all">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase">Exonéré de TVA</Label>
                                <p className="text-[9px] text-muted-foreground italic">Franchise de taxe active</p>
                            </div>
                            <Switch 
                                checked={formState.is_tva_exempt} 
                                onCheckedChange={v => setFormState(s => ({...s, is_tva_exempt: v}))}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="goldPricePerGram" className="text-[10px] font-bold uppercase ml-1 opacity-40">Prix de l'Or (Ref. Zakat)</Label>
                            <div className="relative">
                                <Input id="goldPricePerGram" type="number" value={formState.goldPricePerGram || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-black text-center focus-visible:ring-primary/20" disabled={isSaving}/>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-20">DA/g</span>
                            </div>
                        </div>
                    </div>
                    {formState.is_tva_exempt && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-500">
                            <Label htmlFor="tva_exempt_reason" className="text-[10px] font-bold uppercase ml-1 opacity-40 text-primary">Mention légale d'exonération</Label>
                            <Input id="tva_exempt_reason" value={formState.tva_exempt_reason || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-primary/5 border border-primary/20 shadow-inner text-xs italic font-medium" placeholder="Ex: Art. 13 du code des taxes sur le CA..." disabled={isSaving}/>
                        </div>
                    )}
                </div>

                {/* 4. SÉQUENÇAGE & CONTACT */}
                <div className="space-y-6 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <SectionTitle title="Facturation & Contacts" icon={Receipt} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-2xl border border-white/5 shadow-inner">
                            <div className="space-y-2">
                                <Label htmlFor="invoice_prefix" className="text-[10px] font-bold uppercase ml-1 opacity-40">Préfixe Facture</Label>
                                <Input id="invoice_prefix" value={formState.invoice_prefix || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold" placeholder="2025" disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoice_counter" className="text-[10px] font-bold uppercase ml-1 opacity-40">Prochain N°</Label>
                                <Input id="invoice_counter" type="number" value={formState.invoice_counter || 1} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold text-emerald-500" disabled={isSaving}/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-bold uppercase ml-1 opacity-40">Téléphone</Label>
                                <Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-bold" disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-bold uppercase ml-1 opacity-40">E-mail</Label>
                                <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-bold" disabled={isSaving}/>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="p-6 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Architecture Elite Certifiée</p>
                    </div>
                    {formState.updatedAt && (
                        <p className="text-[9px] font-bold text-muted-foreground/30 italic ml-4">
                            Dernière synchronisation locale : {format(new Date(formState.updatedAt), 'd MMMM yyyy, HH:mm', { locale: fr })}
                        </p>
                    )}
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <Button type="button" variant="ghost" onClick={handleReset} className="h-11 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 hover:bg-white/5" disabled={isSaving}>
                        <RotateCcw className="h-4 w-4 opacity-40" /> Annuler
                    </Button>
                    <Button type="submit" className="flex-1 sm:flex-none h-11 px-14 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 gap-3" disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4" />}
                        Sauvegarder Configuration
                    </Button>
                </div>
            </CardFooter>
        </form>
    );
}
