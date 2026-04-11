'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { Loader2, Wheat, Settings, Calendar, Package, CheckCircle2, X } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BREAD_WEEK_DAY_LABELS_FULL } from '@/lib/constants';
import { cn } from '@/lib/utils';

const initialFormState: Partial<Customer> = {
    isBreadClient: true,
    bread_type_recurrence: 'quotidien',
    bread_quantite_defaut: 10,
    bread_jours_semaine: {
        lundi:    { actif: true, quantite: 10 },
        mardi:    { actif: true, quantite: 10 },
        mercredi: { actif: true, quantite: 10 },
        jeudi:    { actif: true, quantite: 10 },
        vendredi: { actif: false, quantite: 0 },
        samedi:   { actif: true, quantite: 10 },
        dimanche: { actif: true, quantite: 10 }
    }
};

interface BreadClientFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
    onSuccess: () => void;
}

export function BreadClientForm({ isOpen, onOpenChange, customer, onSuccess }: BreadClientFormProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (customer && isOpen) {
            setFormState({
                isBreadClient: customer.isBreadClient ?? true,
                bread_type_recurrence: customer.bread_type_recurrence || 'aucun',
                bread_quantite_defaut: customer.bread_quantite_defaut || 10,
                bread_jours_semaine: customer.bread_jours_semaine || initialFormState.bread_jours_semaine!
            });
        } else if (isOpen) {
            setFormState(initialFormState);
        }
    }, [customer, isOpen]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer?.uuid) return;

        setIsLoading(true);
        try {
            const dataToSave: Partial<Customer> = {
                isBreadClient: formState.isBreadClient,
                bread_type_recurrence: formState.bread_type_recurrence,
            };

            if (formState.bread_type_recurrence === 'quotidien') {
                dataToSave.bread_quantite_defaut = formState.bread_quantite_defaut;
            } else if (formState.bread_type_recurrence === 'jours_specifiques') {
                dataToSave.bread_jours_semaine = formState.bread_jours_semaine;
            }

            await customerService.updateCustomer(customer.uuid, dataToSave);
            toast.success(`Abonnement Elite mis à jour pour ${customer.firstName}.`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Échec de la mise à jour.");
        } finally {
            setIsLoading(false);
        }
    }, [formState, customer, onOpenChange, onSuccess]);
    
    const handleDayToggle = (day: keyof typeof BREAD_WEEK_DAY_LABELS_FULL) => {
        setFormState(prev => ({
            ...prev,
            bread_jours_semaine: {
                ...prev.bread_jours_semaine!,
                [day]: { ...prev.bread_jours_semaine![day], actif: !prev.bread_jours_semaine![day].actif }
            }
        }));
    };

    const handleDayQuantityChange = (day: keyof typeof BREAD_WEEK_DAY_LABELS_FULL, value: string) => {
         const quantite = parseInt(value, 10) || 0;
         setFormState(prev => ({
            ...prev,
            bread_jours_semaine: {
                ...prev.bread_jours_semaine!,
                [day]: { ...prev.bread_jours_semaine![day], quantite }
            }
        }));
    };

    if (!customer) return null;

    const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shadow-inner">
                <Icon className="h-3 w-3" />
            </div>
            <h4 className="text-[10px] font-semibold uppercase text-muted-foreground opacity-60">{title}</h4>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-lg border-none shadow-sm p-0 overflow-hidden bg-card">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-primary/5 p-4 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                                <Wheat className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold tracking-tight">Paramétrage VIP Pain</DialogTitle>
                                <DialogDescription className="font-medium">Gestion souveraine des commandes récurrentes pour {customer.firstName} {customer.lastName}.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {/* Section: Statut & Type */}
                        <div>
                            <SectionTitle title="Abonnement & Fréquence" icon={Settings} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/20 rounded-lg border border-white/5 shadow-inner">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 ml-1">Statut du Programme</Label>
                                    <div className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all duration-500",
                                        formState.isBreadClient ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/20 border-white/5 opacity-40"
                                    )}>
                                        <span className={cn("text-xs font-semibold uppercase", formState.isBreadClient ? "text-emerald-500" : "text-muted-foreground")}>
                                            {formState.isBreadClient ? 'ACTIF' : 'INACTIF'}
                                        </span>
                                        <Switch 
                                            checked={formState.isBreadClient} 
                                            onCheckedChange={(checked) => setFormState(s => ({ ...s, isBreadClient: checked }))} 
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 ml-1">Récurence Elite</Label>
                                    <Select value={formState.bread_type_recurrence} onValueChange={(value) => setFormState(s => ({ ...s, bread_type_recurrence: value as any }))}>
                                        <SelectTrigger className="h-12 rounded-xl bg-background border-none shadow-sm font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl shadow-sm border-white/5">
                                            <SelectItem value="quotidien" className="font-bold">Quotidien (Stable)</SelectItem>
                                            <SelectItem value="jours_specifiques" className="font-bold">Calendrier (Variable)</SelectItem>
                                            <SelectItem value="aucun" className="font-bold">Manuel (À la demande)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Section: Quantités */}
                        {formState.bread_type_recurrence === 'quotidien' && (
                            <div className="animate-in slide-in-from-top-4 duration-500">
                                <SectionTitle title="Configuration Unitaire" icon={Package} />
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-4 text-center">
                                    <Label className="text-[10px] font-semibold uppercase text-primary">Quantité Fixe par Jour</Label>
                                    <div className="relative max-w-[200px] mx-auto">
                                        <Input 
                                            type="number" 
                                            value={formState.bread_quantite_defaut} 
                                            onChange={(e) => setFormState(s => ({ ...s, bread_quantite_defaut: parseInt(e.target.value) || 0 }))} 
                                            className="h-20 rounded-2xl bg-background border-none shadow-xl font-semibold text-xl text-primary text-center focus-visible:ring-primary/20"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-primary opacity-30 uppercase">PCS</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formState.bread_type_recurrence === 'jours_specifiques' && (
                            <div className="animate-in slide-in-from-top-4 duration-500">
                                <SectionTitle title="Calendrier Hebdomadaire" icon={Calendar} />
                                <div className="grid gap-3 p-2 bg-muted/10 rounded-lg border border-white/5">
                                    {Object.entries(BREAD_WEEK_DAY_LABELS_FULL).map(([key, label]) => {
                                        const dayData = formState.bread_jours_semaine![key];
                                        return (
                                            <div key={key} className={cn(
                                                "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                                                dayData.actif ? "bg-card/60 border-white/5 shadow-sm" : "opacity-30 border-transparent grayscale"
                                            )}>
                                                <Switch 
                                                    checked={dayData.actif} 
                                                    onCheckedChange={() => handleDayToggle(key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL)} 
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                                <Label className="flex-grow font-semibold text-[10px] uppercase tracking-wide">{label}</Label>
                                                <div className="relative w-32">
                                                    <Input 
                                                        type="number" 
                                                        className="h-10 text-center font-semibold rounded-xl bg-black/20 border-none shadow-inner" 
                                                        value={dayData.quantite}
                                                        onChange={e => handleDayQuantityChange(key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL, e.target.value)}
                                                        disabled={!dayData.actif}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-semibold opacity-20 uppercase">PCS</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 bg-card border-t border-white/5 flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-9 rounded-2xl font-semibold text-xs uppercase tracking-wide px-8" disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading} className="flex-1 h-9 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl shadow-sm transition-all active:scale-95 gap-3">
                             {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                            Enregistrer les paramètres Elite
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
