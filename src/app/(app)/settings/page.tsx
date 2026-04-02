'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardFooter, 
    CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    ShieldAlert, 
    Database, 
    HardDrive, 
    Trash2, 
    Cpu, 
    Activity, 
    Server, 
    Smartphone, 
    Monitor, 
    Globe, 
    ShieldCheck, 
    Zap, 
    Shield, 
    Package, 
    Users2, 
    ShoppingCart, 
    X, 
    Info 
} from "lucide-react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";

export default function SettingsPage() {
    const [stats, setStats] = useState({
        products: 0,
        customers: 0,
        sales: 0,
        logs: 0
    });
    const [storage, setStorage] = useState<{ used: string, quota: string, percent: number } | null>(null);
    const [envInfo, setEnvInfo] = useState<{ os: string, browser: string } | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const fetchStats = async () => {
            try {
                const [p, c, s, l] = await Promise.all([
                    db.products.count(),
                    db.customers.count(),
                    db.sales.count(),
                    db.inventory_logs.count()
                ]);
                setStats({ products: p, customers: c, sales: s, logs: l });
            } catch (err) {
                console.error("Erreur stats:", err);
            }
        };
        fetchStats();

        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                const used = (estimate.usage || 0) / (1024 * 1024);
                const quota = (estimate.quota || 0) / (1024 * 1024);
                setStorage({
                    used: used.toFixed(2) + ' Mo',
                    quota: (quota / 1024).toFixed(1) + ' Go',
                    percent: Math.round(((estimate.usage || 0) / (estimate.quota || 1)) * 100)
                });
            });
        }

        const ua = window.navigator.userAgent;
        let os = "Système inconnu";
        if (ua.indexOf("Win") !== -1) os = "Windows";
        else if (ua.indexOf("Mac") !== -1) os = "macOS";
        else if (ua.indexOf("Linux") !== -1) os = "Linux";
        else if (ua.indexOf("Android") !== -1) os = "Android";
        else if (ua.indexOf("like Mac") !== -1) os = "iOS";

        let browser = "Navigateur inconnu";
        if (ua.indexOf("Chrome") !== -1) browser = "Chrome / Edge";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (ua.indexOf("Safari") !== -1) browser = "Safari";

        setEnvInfo({ os, browser });
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

    if (!isMounted) return null;

    return (
        <div className="p-6 sm:p-10 space-y-12 max-w-[1800px] mx-auto pb-32 animate-in fade-in duration-1000">
            <PageHeader 
                title="Configuration Souveraine"
                description="Maintenance technique, diagnostic système et gestion de la confidentialité locale."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    <Card className="luxury-card rounded-[2.5rem] border-white/5 bg-card/40 backdrop-blur-3xl overflow-hidden">
                        <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                                    <Database className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black tracking-tighter">Santé du Système Local</CardTitle>
                                    <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Analyse en temps réel du stockage IndexedDB</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {[
                                    { label: 'Produits', value: stats.products, icon: Package },
                                    { label: 'Clients', value: stats.customers, icon: Users2 },
                                    { label: 'Ventes', value: stats.sales, icon: ShoppingCart },
                                    { label: 'Audit', value: stats.logs, icon: Activity }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-6 rounded-[2rem] bg-black/20 border border-white/5 text-center transition-all hover:scale-105 group">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground/40 mb-3 group-hover:text-primary transition-colors">{item.label}</p>
                                        <p className="text-4xl font-black tracking-tighter">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {storage && (
                                <div className="p-10 rounded-[2.5rem] bg-muted/10 border border-white/5 space-y-8 relative overflow-hidden group">
                                    <div className="absolute -right-10 -bottom-10 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                                        <HardDrive className="h-48 w-48" />
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                                                <Activity className="h-3.5 w-3.5 animate-pulse" /> Empreinte Disque
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium italic">Occupation réelle dans le cache sécurisé.</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-primary">{storage.used}</span>
                                            <span className="text-xs text-muted-foreground mx-3 font-black opacity-20">/</span>
                                            <span className="text-sm text-muted-foreground font-black opacity-40">{storage.quota}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 relative z-10">
                                        <Progress value={storage.percent} className="h-2.5 bg-muted/20 [&>div]:bg-primary shadow-inner rounded-full" />
                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">
                                            <span>Utilisation: {storage.percent}%</span>
                                            <span>Capacité Maximale</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-4 p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-emerald-500">
                                <div className="p-3 rounded-2xl bg-emerald-500/10 shadow-inner">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Base de données opérationnelle</p>
                                    <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Architecture Zen : 100% Hors-ligne & Confidentialité Totale</p>
                                </div>
                                <Zap className="h-5 w-5 ml-auto opacity-20 animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
                        <DataManagementCard />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10 animate-in slide-in-from-right-4 duration-700 delay-300">
                    <Card className="luxury-card rounded-[2.5rem] border-white/5 bg-card/40 backdrop-blur-3xl overflow-hidden">
                        <CardHeader className="p-8 pb-4 border-b border-white/5 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <Server className="h-4 w-4 text-primary opacity-50" />
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Environnement Actif</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            {[
                                { icon: Monitor, label: 'Système', value: envInfo?.os },
                                { icon: Globe, label: 'Navigateur', value: envInfo?.browser },
                                { icon: Smartphone, label: 'Mode PWA', value: 'ACTIF', status: 'ACTIF' }
                            ].map((env, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <env.icon className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-tight opacity-40">{env.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-primary uppercase">{env.value || '...'}</span>
                                        {env.status && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="luxury-card rounded-[2.5rem] border-white/5 bg-card/40 backdrop-blur-3xl overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-3">
                                <Info className="h-4 w-4 text-primary opacity-50" />
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">À propos de iPOS Luxury</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-8">
                            <div className="flex items-center gap-5 p-6 bg-primary/5 rounded-[2rem] border border-primary/10 group">
                                <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                    <Cpu className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <p className="text-lg font-black tracking-tighter">iPOS Zen Evolution</p>
                                    <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.3em]">Version 1.9.2 - Elite Stable</p>
                                </div>
                            </div>
                            
                            <div className="space-y-5 text-[11px] font-medium text-muted-foreground/60 leading-relaxed italic px-2">
                                <p>iPOS est une application "Client-Side Only" de nouvelle génération. Vos données commerciales ne transitent par aucun serveur externe.</p>
                                <p>L'utilisation de la technologie IndexedDB garantit une confidentialité souveraine et une rapidité d'exécution maximale.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 pb-10 px-10">
                            <div className="w-full flex flex-col items-center gap-4">
                                <div className="w-full h-px bg-white/5" />
                                <div className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-[0.3em] opacity-20">
                                    <span className="flex items-center gap-2"><Shield className="h-3 w-3" /> Statut Sécurité</span>
                                    <span className="text-emerald-500">Chiffré Local</span>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>

                    <Card className="rounded-[2.5rem] border-destructive/20 bg-destructive/5 overflow-hidden group">
                        <CardHeader className="p-6 bg-destructive/10 border-b border-destructive/10">
                            <div className="flex items-center gap-3 text-destructive">
                                <ShieldAlert className="h-4 w-4 animate-pulse" />
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em]">Zone de Danger</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <p className="text-[10px] font-bold text-destructive/60 leading-relaxed text-center italic px-2 uppercase tracking-widest">
                                Les actions ci-dessous sont irréversibles et entraînent la perte totale de vos données locales non sauvegardées.
                            </p>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsResetConfirmOpen(true)}
                                className="w-full rounded-2xl h-16 border-destructive/30 bg-background/50 text-destructive hover:bg-destructive hover:text-white transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] gap-3 shadow-xl"
                            >
                                <Trash2 className="h-4 w-4" />
                                Réinitialiser l'Application
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmAlertDialog
                isOpen={isResetConfirmOpen}
                onOpenChange={setIsResetConfirmOpen}
                title="Effacer l'intégralité du système ?"
                description={
                    <div className="space-y-6">
                        <p className="font-medium text-foreground">Cette action va purger définitivement votre base de données locale :</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                'Catalogue Produits', 'Fichiers Clients', 
                                'Registre des Ventes', 'Journal d\'Audit', 
                                'Profil Établissement', 'Historique Stock'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-white/5">
                                    <X className="h-3 w-3 text-destructive opacity-40" />
                                    <span className="text-[10px] font-black uppercase tracking-tight opacity-60">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-5 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-4 mt-4">
                            <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-destructive uppercase tracking-tight leading-tight">Attention Critique</p>
                                <p className="text-[10px] text-destructive/70 leading-relaxed font-medium">Aucun retour en arrière n'est possible sans un fichier de sauvegarde (.json) externe.</p>
                            </div>
                        </div>
                    </div>
                }
                onConfirm={handleFullReset}
                confirmText="Oui, TOUT supprimer"
            />
        </div>
    );
}
