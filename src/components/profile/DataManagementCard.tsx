'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { backupService } from "@/services/backup.service";
import { Loader2, Download, Upload } from 'lucide-react';
import { ConfirmAlertDialog } from '../ui/ConfirmAlertDialog';

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
            toast.success("Sauvegarde téléchargée avec succès.");
        } catch (error: any) {
            toast.error("Erreur lors de la création de la sauvegarde.", { description: error.message });
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
        // Reset file input to allow selecting the same file again
        event.target.value = '';
    };

    const handleConfirmRestore = async () => {
        if (!pendingRestoreFile) return;
        setIsRestoring(true);

        const promise = backupService.restoreBackup(pendingRestoreFile);
        toast.promise(promise, {
            loading: 'Restauration en cours... Veuillez ne pas fermer cette page.',
            success: () => {
                setIsRestoring(false);
                setPendingRestoreFile(null);
                return 'Restauration terminée avec succès. L\'application va se recharger.';
            },
            error: (err) => {
                setIsRestoring(false);
                setPendingRestoreFile(null);
                return `Échec de la restauration: ${err.message}`;
            },
        });
        
        promise.then(() => {
            setTimeout(() => window.location.reload(), 2000);
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Données (Local)</CardTitle>
                    <CardDescription>
                        Créez une sauvegarde de vos données sous forme de fichier, ou restaurez à partir d'un fichier existant.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleCreateBackup} disabled={isCreating || isRestoring} className="w-full">
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                        {isCreating ? 'Création en cours...' : 'Télécharger une sauvegarde'}
                    </Button>
                    <Button asChild variant="outline" className="w-full" disabled={isCreating || isRestoring}>
                       <label htmlFor="restore-backup-input">
                            {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Restaurer depuis un fichier
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
                </CardContent>
                 <CardFooter className="text-xs text-muted-foreground">
                    Toutes les données sont gérées localement dans votre navigateur. Les sauvegardes sont des fichiers sur votre ordinateur.
                </CardFooter>
            </Card>

            <ConfirmAlertDialog
                isOpen={isRestoreConfirmOpen}
                onOpenChange={setIsRestoreConfirmOpen}
                title="Êtes-vous sûr de vouloir restaurer ?"
                description={`Cette action est irréversible et remplacera TOUTES vos données actuelles par le contenu du fichier "${pendingRestoreFile?.name}". Assurez-vous d'avoir sauvegardé vos données actuelles si nécessaire.`}
                onConfirm={handleConfirmRestore}
                confirmText="Oui, écraser et restaurer"
            />
        </>
    );
}
