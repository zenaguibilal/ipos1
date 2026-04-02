'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { backupService } from "@/services/backup.service";
import { Loader2, Download, Upload, HardDrive, Info, ShieldCheck, Sparkles, Database } from 'lucide-react';
import { ConfirmAlertDialog } from '../ui/ConfirmAlertDialog';
import { cn } from '@/lib/utils';

export function DataManagementCard() {
    const [isCreating, setIsCreating] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);

    const handleCreateBackup = async () => {
        setIsCreating(true);
        try {
            const file = await backupService.createBackup();
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Archives Elite générées avec succès.");
        } catch (error: any) {
            toast.error("Échec de la sauvegarde.", { description: error.message });
        } finally {
            setIsCreating(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setPendingRestoreFile(file);
            setIsRestoreConfirmOpen(true);
        }
        event.target.value = '';
    };

    const handleConfirmRestore = async () => {
        if (!pendingRestoreFile) return;
        setIsRestoring(true);

        const promise = backupService.restoreBackup(pendingRestoreFile);
        toast.promise(promise, {
            loading: 'Extraction des données souveraines... Merci de patienter.',
            success: () => {
                setIsRestoring(false);
                setPendingRestoreFile(null);
                return 'Restauration Elite terminée. Redémarrage du système...';
            },
            error: (err) => {
                setIsRestoring(false);
                setPendingRestoreFile(null);
                return `Erreur critique: ${err.message}`;
            },
        });
        
        promise.then(() => {
            setTimeout(() => window.location.reload(), 2000);
        });
    };

    return (
        <>
            <Card className="luxury-card rounded-[2.5rem] border-white/5 bg-card/40 backdrop-blur-3xl overflow-hidden shadow-2xl">
                <CardHeader className="bg-primary/5 border-b border-white/5 p-8 pb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                            <Database className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tighter">Archives & Flux Souverains</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Exportation et Restauration des Données Locales</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="p-8 bg-muted/20 rounded-[2.5rem] border border-dashed border-white/10 space-y-6 relative overflow-hidden group hover:bg-muted/30 transition-all duration-500">
                            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <Download className="h-32 w-32 rotate-12" />
                            </div>
                            <div className="flex items-center gap-3 text-primary relative z-10">
                                <div className="p-2.5 rounded-xl bg-primary/10 shadow-inner">
                                    <Download className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Coffre-Fort Numérique</span>
                            </div>
                            <p className="text-xs text-muted-foreground/60 font-medium leading-relaxed relative z-10">
                                Génère un manifeste .json sécurisé contenant l'intégralité de vos actifs commerciaux pour un stockage externe.
                            </p>
                            <Button 
                                onClick={handleCreateBackup} 
                                disabled={isCreating || isRestoring} 
                                className="w-full rounded-2xl h-14 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
                            >
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                                {isCreating ? 'Compression...' : 'Télécharger Archives (.json)'}
                            </Button>
                        </div>

                        <div className="p-8 bg-muted/20 rounded-[2.5rem] border border-dashed border-white/10 space-y-6 relative overflow-hidden group hover:bg-muted/30 transition-all duration-500">
                            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <Upload className="h-32 w-32 -rotate-12" />
                            </div>
                            <div className="flex items-center gap-3 text-primary relative z-10">
                                <div className="p-2.5 rounded-xl bg-primary/10 shadow-inner">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Restauration Système</span>
                            </div>
                            <p className="text-xs text-muted-foreground/60 font-medium leading-relaxed relative z-10">
                                Réinitialise le système et déploie les données à partir d'un manifeste iPOS existant. Écrase le cache actuel.
                            </p>
                            <Button asChild variant="outline" className="w-full rounded-2xl h-14 font-black text-[10px] uppercase tracking-[0.2em] border-white/5 bg-black/20 hover:bg-white/5 transition-all relative z-10" disabled={isCreating || isRestoring}>
                                <label htmlFor="restore-backup-input" className="cursor-pointer flex items-center justify-center gap-3">
                                    {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
                                    {isRestoring ? 'Expansion...' : 'Sélectionner Archives'}
                                    <input
                                        type="file"
                                        id="restore-backup-input"
                                        className="sr-only"
                                        accept=".json"
                                        onChange={handleFileSelect}
                                        disabled={isRestoring}
                                    />
                                </label>
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-start gap-5 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-[0.02]">
                            <ShieldCheck className="h-24 w-24" />
                        </div>
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div className="space-y-2 relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Protocole de Confidentialité Elite</p>
                            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed max-w-3xl">
                                iPOS Luxury opère sous un modèle de "Zéro-Connaissance". Vos données ne quittent jamais ce terminal. Les archives sont générées et traitées localement, vous garantissant une souveraineté totale sur vos informations stratégiques.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-black/40 p-8 border-t border-white/5 flex justify-between items-center italic text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-30">
                    <span>Certifié local-first</span>
                    <span>Cycle de maintenance suggéré: 7 jours</span>
                </CardFooter>
            </Card>

            <ConfirmAlertDialog
                isOpen={isRestoreConfirmOpen}
                onOpenChange={setIsRestoreConfirmOpen}
                title="Substitution des données souveraines ?"
                description={
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Archive identifiée</p>
                            <p className="text-sm font-mono font-black text-primary truncate px-2">{pendingRestoreFile?.name}</p>
                        </div>
                        <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4 text-amber-600">
                            <Info className="h-6 w-6 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-tight">Attention Critique</p>
                                <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase tracking-tighter">Cette opération écrasera l'intégralité du cache actuel de manière irréversible.</p>
                            </div>
                        </div>
                    </div>
                }
                onConfirm={handleConfirmRestore}
                confirmText="Oui, restaurer le système"
            />
        </>
    );
}
