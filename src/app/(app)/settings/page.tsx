
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    ShieldAlert, 
    Database, 
    Info, 
    HardDrive, 
    RefreshCcw, 
    Trash2, 
    CheckCircle2,
    Cpu,
    Activity,
    Server,
    Smartphone,
    Monitor,
    Globe,
    ShieldCheck,
    Zap
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
    const [storage, setStorage] = useState<{ used: string, quota: string, percent: number } | null>(null);
    const [envInfo, setEnvInfo] = useState<{ os: string, browser: string } | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
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

        // Estimate storage usage
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

        // Detect environment info
        const ua = window.navigator.userAgent;
        let os = "Système inconnu";
        if (ua.indexOf("Win") !== -1) os = "Windows";
        if (ua.indexOf("Mac") !== -1) os = "macOS";
        if (ua.indexOf("Linux") !== -1) os = "Linux";
        if (ua.indexOf("Android") !== -1) os = "Android";
        if (ua.indexOf("like Mac") !== -1) os = "iOS";

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
        <div className="p-4 sm:p-6 space-y-8 max-w-[1400px] mx-auto pb-24">
            <PageHeader 
                title="Paramètres Système"
                description="Maintenance technique, diagnostic de base de données et gestion de la confidentialité locale."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Column: Diagnostics & Data */}
                <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                    
                    {/* Database Health Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight">Santé du Système Local</CardTitle>
                                    <CardDescription className="font-medium text-muted-foreground/70">
                                        Analyse en temps réel de votre stockage IndexedDB.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-5 rounded-3xl bg-muted/20 border border-border/50 text-center hover:bg-muted/30 transition-all hover:scale-105 group">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 group-hover:text-primary transition-colors">Produits</p>
                                    <p className="text-3xl font-black">{stats.products}</p>
                                </div>
                                <div className="p-5 rounded-3xl bg-muted/20 border border-border/50 text-center hover:bg-muted/30 transition-all hover:scale-105 group">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 group-hover:text-primary transition-colors">Clients</p>
                                    <p className="text-3xl font-black">{stats.customers}</p>
                                </div>
                                <div className="p-5 rounded-3xl bg-muted/20 border border-border/50 text-center hover:bg-muted/30 transition-all hover:scale-105 group">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 group-hover:text-primary transition-colors">Ventes</p>
                                    <p className="text-3xl font-black">{stats.sales}</p>
                                </div>
                                <div className="p-5 rounded-3xl bg-muted/20 border border-border/50 text-center hover:bg-muted/30 transition-all hover:scale-105 group">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 group-hover:text-primary transition-colors">Audit</p>
                                    <p className="text-3xl font-black">{stats.logs}</p>
                                </div>
                            </div>

                            {/* Storage Estimation */}
                            {storage && (
                                <div className="p-8 rounded-[2rem] bg-background/50 border border-border/50 space-y-6 relative overflow-hidden group">
                                    <div className="absolute -right-10 -bottom-10 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000">
                                        <HardDrive className="h-40 w-40" />
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                                <Activity className="h-3 w-3" /> Empreinte Disque
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium italic">Occupation réelle dans le cache du navigateur.</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-primary">{storage.used}</span>
                                            <span className="text-xs text-muted-foreground mx-2 font-bold">/</span>
                                            <span className="text-xs text-muted-foreground font-bold opacity-50">{storage.quota}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 relative z-10">
                                        <Progress value={storage.percent} className="h-2 bg-muted/30 [&>div]:bg-primary shadow-sm" />
                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                                            <span>Usage: {storage.percent}%</span>
                                            <span>Capacité Maximale Navigateur</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-600 transition-all hover:bg-emerald-500/10">
                                <div className="p-2 rounded-xl bg-emerald-500/10">
                                    <ShieldCheck className="h-5 w-5 shrink-0" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Base de données opérationnelle</p>
                                    <p className="text-[9px] font-bold opacity-70">Architecture Client-First : 100% Hors-ligne & Privé</p>
                                </div>
                                <Zap className="h-4 w-4 ml-auto opacity-20 animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Management Section */}
                    <DataManagementCard />
                </div>

                {/* Right Column: Info & Danger Zone */}
                <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
                    
                    {/* Environment Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="pb-4 border-b border-border/50 bg-muted/30">
                            <div className="flex items-center gap-3">
                                <Server className="h-4 w-4 text-primary opacity-50" />
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Environnement</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3">
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50 group">
                                <div className="flex items-center gap-3">
                                    <Monitor className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">Système</span>
                                </div>
                                <span className="text-[10px] font-black text-primary">{envInfo?.os || '...'}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50 group">
                                <div className="flex items-center gap-3">
                                    <Globe className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">Navigateur</span>
                                </div>
                                <span className="text-[10px] font-black text-primary">{envInfo?.browser || '...'}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50 group">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">Installation PWA</span>
                                </div>
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase">ACTIVE</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* About Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <Info className="h-4 w-4 text-primary opacity-50" />
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">À propos de iPOS</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4 p-5 bg-primary/5 rounded-[2rem] border border-primary/10 group">
                                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <Cpu className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-black tracking-tight">iPOS Zen Evolution</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Version 1.8.4 - stable</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 text-[11px] font-medium text-muted-foreground leading-relaxed italic px-2">
                                <p>iPOS est une application "Client-Side Only". Cela signifie que vos données commerciales ne transitent par aucun serveur externe.</p>
                                <p>L'utilisation de la technologie IndexedDB garantit une confidentialité totale et une rapidité d'exécution maximale, même sans connexion internet.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 pb-8 px-8">
                            <div className="w-full h-px bg-border/50 mb-6" />
                            <div className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                                <span>Statut Sécurité</span>
                                <span className="text-emerald-500">100% Chiffré Local</span>
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-destructive/5 border border-destructive/10 overflow-hidden group">
                        <CardHeader className="pb-4 bg-destructive/5 border-b border-destructive/10">
                            <div className="flex items-center gap-3 text-destructive">
                                <ShieldAlert className="h-4 w-4" />
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em]">Zone de Danger</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <p className="text-[10px] font-bold text-destructive/70 leading-relaxed px-1 text-center italic">
                                Les actions ci-dessous sont irréversibles et entraînent la perte totale de vos données locales non sauvegardées.
                            </p>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsResetConfirmOpen(true)}
                                className="w-full rounded-2xl h-14 border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all duration-500 font-black text-[10px] uppercase tracking-widest gap-3 shadow-sm hover:shadow-destructive/20"
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
                title="Supprimer TOUTES les données ?"
                description={
                    <div className="space-y-4">
                        <p className="font-medium">Cette action va effacer définitivement l'intégralité de votre base de données locale :</p>
                        <ul className="list-disc list-inside text-xs space-y-1 opacity-70 ml-2">
                            <li>Catalogue complet des produits</li>
                            <li>Fichiers clients et historiques de dettes</li>
                            <li>Toutes les ventes et réceptions de stock</li>
                            <li>Paramètres de profil et logs d'audit</li>
                        </ul>
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 mt-4">
                            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            <p className="text-xs font-black text-destructive uppercase tracking-tight leading-tight">Attention : Aucun retour en arrière n'est possible sans un fichier de sauvegarde manuel.</p>
                        </div>
                    </div>
                }
                onConfirm={handleFullReset}
                confirmText="Oui, TOUT effacer"
            />
        </div>
    );
}
