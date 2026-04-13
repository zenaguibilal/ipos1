
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
    ShieldCheck, Landmark, Receipt, Percent
} from 'lucide-react';
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
                {/* IDENTITÉ & FORME JURIDIQUE */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SectionTitle title="Identité Institutionnelle" icon={Building} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 group">
                            <Label htmlFor="companyName" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Raison Sociale *</Label>
                            <Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-black text-lg" required disabled={isSaving}/>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="legal_form" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Forme Juridique</Label>
                            <Input id="legal_form" value={formState.legal_form || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-bold" placeholder="SARL, EURL, SNC..." disabled={isSaving}/>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="address" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Siège Social</Label>
                        <Input id="address" value={formState.address || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-bold px-6" placeholder="Adresse complète..." disabled={isSaving}/>
                    </div>
                </div>

                {/* IDENTIFIANTS FISCAUX ALGÉRIENS */}
                <div className="space-y-4 pt-16 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <SectionTitle title="Régime Fiscal & Identifiants" icon={Landmark} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-4">
                            <Label htmlFor="rc_number" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Reg. Commerce (RC)</Label>
                            <Input id="rc_number" value={formState.rc_number || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold" placeholder="00/00-0000000" disabled={isSaving}/>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="nif" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Ident. Fiscale (NIF)</Label>
                            <Input id="nif" value={formState.nif || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold" placeholder="15 chiffres" disabled={isSaving}/>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="ai_number" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Art. Imposition (AI)</Label>
                            <Input id="ai_number" value={formState.ai_number || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold" disabled={isSaving}/>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="nis_number" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Statistique (NIS)</Label>
                            <Input id="nis_number" value={formState.nis_number || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold" disabled={isSaving}/>
                        </div>
                    </div>
                </div>

                {/* CONFIGURATION TVA */}
                <div className="space-y-4 pt-16 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <SectionTitle title="Paramétrage TVA" icon={Percent} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <Label htmlFor="tva_rate" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Taux par défaut (%)</Label>
                            <Input id="tva_rate" type="number" value={formState.tva_rate || 19} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-black text-primary text-center" disabled={isSaving}/>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-semibold uppercase">Exonéré de TVA</Label>
                                <p className="text-[9px] text-muted-foreground italic">Cocher si franchise de TVA</p>
                            </div>
                            <Switch 
                                checked={formState.is_tva_exempt} 
                                onCheckedChange={v => setFormState(s => ({...s, is_tva_exempt: v}))}
                            />
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="tva_exempt_reason" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Base légale d'exonération</Label>
                            <Input id="tva_exempt_reason" value={formState.tva_exempt_reason || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner text-xs italic" placeholder="Art. X du Code des Taxes..." disabled={!formState.is_tva_exempt || isSaving}/>
                        </div>
                    </div>
                </div>

                {/* COMPTEUR DE FACTURES */}
                <div className="space-y-4 pt-16 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <SectionTitle title="Séquençage des Ventes" icon={Receipt} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Label htmlFor="invoice_prefix" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Préfixe (Année ou Code)</Label>
                            <Input id="invoice_prefix" value={formState.invoice_prefix || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold" placeholder="2025" disabled={isSaving}/>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="invoice_counter" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Prochain Numéro</Label>
                            <Input id="invoice_counter" type="number" value={formState.invoice_counter || 1} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold text-emerald-500" disabled={isSaving}/>
                        </div>
                    </div>
                </div>

                {/* CLOUD & BACKUP */}
                <div className="space-y-4 pt-16 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                    <SectionTitle 
                        title="Connectivité Cloud" 
                        icon={Cloud} 
                        action={<SupabaseSqlDialog />}
                    />
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-4">
                            <Label htmlFor="supabase_url" className="text-[10px] font-semibold uppercase ml-1 opacity-40">URL Supabase</Label>
                            <Input id="supabase_url" value={formState.supabase_url || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-mono text-xs" placeholder="https://xxxx.supabase.co" disabled={isSaving} />
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="supabase_key" className="text-[10px] font-semibold uppercase ml-1 opacity-40">Clé API</Label>
                            <Input id="supabase_key" type="password" value={formState.supabase_key || ''} onChange={handleInputChange} className="h-11 rounded-lg bg-black/20 border-none shadow-inner font-mono text-xs" disabled={isSaving} />
                        </div>
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="p-4 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">Système Certifié Elite</p>
                    </div>
                    {formState.updatedAt && (
                        <p className="text-[9px] font-medium text-muted-foreground/40 italic ml-4">
                            Dernier ajustement : {format(new Date(formState.updatedAt), 'd MMM yyyy, HH:mm', { locale: fr })}
                        </p>
                    )}
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <Button type="button" variant="ghost" onClick={handleReset} className="h-10 px-6 rounded-xl font-bold text-[10px] uppercase gap-2" disabled={isSaving}>
                        <RotateCcw className="h-4 w-4 opacity-40" /> Annuler
                    </Button>
                    <Button type="submit" className="flex-1 sm:flex-none h-10 px-12 rounded-xl font-black text-[10px] uppercase shadow-xl gap-3" disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4" />}
                        Valider la Configuration Elite
                    </Button>
                </div>
            </CardFooter>
        </form>
    );
}
