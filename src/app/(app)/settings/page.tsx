'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ShieldAlert, 
    Database, 
    Info, 
    HardDrive, 
    RefreshCcw, 
    Trash2, 
    ChevronRight,
    CheckCircle2,
    Cpu
} from "lucide-react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [stats, setStats] = useState({
        products: 0,
        customers: 0,
        sales: 0,
        logs: 0
    });
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            const [p, c, s, l] = await Promise.all([
                db.products.count(),
                db.customers.count(),
                db.sales.count(),
                db.inventory_logs.count()
            ]);
            setStats({ products: p, customers: c, sales: s, logs: l });
        };
        fetchStats();
    }, []);

    const handleFullReset = async () => {
        try {
            await db.transaction('rw', db.tables, async () => {
                for (const table of db.tables) {
                    await table.clear();
                }
            });
            toast.success("Application réinitialisée avec succès.");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            toast.error("Erreur lors de la réinitialisation.");
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto pb-24">
            <PageHeader 
                title="Paramètres Système"
                description="Maintenance technique, diagnostic de base de données et gestion de la confidentialité."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Diagnostics & Data */}
                <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                    
                    {/* Database Health Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight">Santé de la Base de Données</CardTitle>
                                    <CardDescription className="font-medium text-muted-foreground/70">
                                        Vue d'ensemble de votre stockage local IndexedDB.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-3xl bg-muted/30 border border-border/50 text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Produits</p>
                                    <p className="text-2xl font-black">{stats.products}</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-muted/30 border border-border/50 text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Clients</p>
                                    <p className="text-2xl font-black">{stats.customers}</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-muted/30 border border-border/50 text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Ventes</p>
                                    <p className="text-2xl font-black">{stats.sales}</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-muted/30 border border-border/50 text-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Logs</p>
                                    <p className="text-2xl font-black">{stats.logs}</p>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5 shrink-0" />
                                <p className="text-xs font-bold uppercase tracking-tight">Système opérationnel : Toutes les tables sont synchronisées localement.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Management Section */}
                    <DataManagementCard />
                </div>

                {/* Right Column: Info & Danger Zone */}
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
                    
                    {/* About Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <Info className="h-4 w-4 text-primary opacity-50" />
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">À propos de iPOS</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-3xl border border-border/50">
                                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-inner">
                                    <Cpu className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-black tracking-tight">Version 1.2.0-Zen</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Build local stable</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 text-[11px] font-medium text-muted-foreground leading-relaxed italic px-2">
                                <p>iPOS est une application "Client-Side Only". Cela signifie que vos données ne transitent par aucun serveur externe.</p>
                                <p>L'utilisation de la technologie IndexedDB garantit une rapidité d'exécution maximale même sans connexion internet.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 pb-8 px-8">
                            <div className="w-full h-px bg-border/50 mb-6" />
                            <div className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest opacity-40">
                                <span>Confidentialité</span>
                                <span className="text-emerald-500">100% Privé</span>
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-destructive/5 border border-destructive/10 overflow-hidden group">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 text-destructive">
                                <ShieldAlert className="h-4 w-4" />
                                <CardTitle className="text-xs font-black uppercase tracking-widest">Zone de Danger</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-[10px] font-bold text-destructive/70 leading-relaxed px-1">
                                Les actions ci-dessous sont irréversibles. Utilisez-les avec une extrême prudence.
                            </p>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsResetConfirmOpen(true)}
                                className="w-full rounded-2xl h-14 border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all duration-300 font-black text-xs uppercase tracking-widest gap-3"
                            >
                                <Trash2 className="h-4 w-4" />
                                Réinitialiser l'App
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmAlertDialog
                isOpen={isResetConfirmOpen}
                onOpenChange={setIsResetConfirmOpen}
                title="Supprimer TOUTES les données ?"
                description={
                    <div className="space-y-4">
                        <p>Cette action va effacer définitivement l'intégralité de votre base de données locale (Produits, Clients, Ventes, Profil).</p>
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
                            <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
                            <p className="text-xs font-bold text-destructive uppercase tracking-tight">Aucun retour en arrière n'est possible sans un fichier de sauvegarde manuel.</p>
                        </div>
                    </div>
                }
                onConfirm={handleFullReset}
                confirmText="Oui, TOUT effacer"
            />
        </div>
    );
}
