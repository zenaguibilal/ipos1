'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { backupService } from "@/services/backup.service";
import { Loader2, Download, Upload, HardDrive, Info, ShieldCheck } from 'lucide-react';
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
            toast.success("Sauvegarde générée avec succès.");
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
            loading: 'Extraction des données... Merci de patienter.',
            success: () => {
                setIsRestoring(false);
                setPendingRestoreFile(null);
                return 'Restauration terminée. Redémarrage du système...';
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
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <HardDrive className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight">Gestion des Sauvegardes</CardTitle>
                            <CardDescription className="font-medium text-muted-foreground/70">
                                Exporter ou importer l'intégralité de vos données locales.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 bg-muted/20 rounded-[2rem] border border-dashed border-border/50 space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                <Download className="h-3 w-3" /> Exportation
                            </div>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                Crée un fichier .json contenant tous vos produits, clients et ventes actuels.
                            </p>
                            <Button 
                                onClick={handleCreateBackup} 
                                disabled={isCreating || isRestoring} 
                                className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
                            >
                                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {isCreating ? 'Génération...' : 'Télécharger (.json)'}
                            </Button>
                        </div>

                        <div className="p-6 bg-muted/20 rounded-[2rem] border border-dashed border-border/50 space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                <Upload className="h-3 w-3" /> Importation
                            </div>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                Restaure vos données à partir d'un fichier de sauvegarde iPOS existant.
                            </p>
                            <Button asChild variant="outline" className="w-full rounded-2xl h-12 font-bold border-primary/20 bg-background hover:bg-primary/5" disabled={isCreating || isRestoring}>
                                <label htmlFor="restore-backup-input" className="cursor-pointer">
                                    {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Sélectionner un fichier
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

                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-tight text-primary">Protection de vos données</p>
                            <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                                Vos données ne quittent jamais ce navigateur. Les fichiers de sauvegarde sont générés localement et stockés uniquement sur votre propre support (ordinateur, clé USB).
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/10 p-6 border-t border-border/50 flex justify-center italic text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">
                    Dernière maintenance conseillée : Hebdomadaire
                </CardFooter>
            </Card>

            <ConfirmAlertDialog
                isOpen={isRestoreConfirmOpen}
                onOpenChange={setIsRestoreConfirmOpen}
                title="Remplacer les données actuelles ?"
                description={
                    <div className="space-y-4">
                        <p>Vous êtes sur le point de restaurer le fichier : <br/><b className="text-primary font-mono">{pendingRestoreFile?.name}</b></p>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-600">
                            <Info className="h-5 w-5 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold uppercase tracking-tight">Attention : Cette action écrasera TOUTES vos données locales actuelles de manière irréversible.</p>
                        </div>
                    </div>
                }
                onConfirm={handleConfirmRestore}
                confirmText="Oui, restaurer tout"
            />
        </>
    );
}
