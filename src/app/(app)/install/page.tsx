'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Smartphone, 
    Monitor, 
    Download, 
    Share, 
    PlusSquare, 
    CheckCircle2, 
    Zap, 
    ShieldCheck,
    Globe,
    ArrowRight,
    Trophy,
    Star,
    LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from 'next/link';

export default function InstallPWAPage() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'other'>('other');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Detect if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        // Detect Platform
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setPlatform(isIOS ? 'ios' : 'other');

        // Capture install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto pb-24">
            <PageHeader 
                title="Expérience iPOS Zen"
                description="Installez l'application pour profiter d'un confort de travail maximal, sans les contraintes d'un navigateur classique."
            />

            {isInstalled ? (
                <Card className="rounded-[3rem] border-none shadow-2xl bg-emerald-500/5 border-emerald-500/20 overflow-hidden animate-in zoom-in-95 duration-700">
                    <CardContent className="p-12 text-center space-y-8">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl animate-pulse rounded-full"></div>
                            <div className="relative h-24 w-24 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                                <Trophy className="h-12 w-12" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-4xl font-black tracking-tighter text-emerald-600">Félicitations !</h2>
                            <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                                iPOS Zen est désormais installé sur votre appareil. Vous bénéficiez d'une réactivité accrue et d'un accès direct depuis votre bureau.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button asChild variant="outline" className="rounded-2xl h-14 px-8 font-black border-emerald-500/20 hover:bg-emerald-500/5 gap-2">
                                <Link href="/settings">
                                    Diagnostic Système
                                </Link>
                            </Button>
                            <Button asChild className="rounded-2xl h-14 px-10 font-black bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 gap-2">
                                <Link href="/dashboard">
                                    Tableau de Bord <LayoutDashboard className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Instructions Card */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                            <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-black tracking-tight">Guide d'installation</CardTitle>
                                        <CardDescription className="font-medium text-muted-foreground/70 italic">Suivez ces étapes simples pour activer le mode Zen.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                {platform === 'ios' ? (
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Globe className="h-4 w-4" /> Instructions Safari (iPhone/iPad)
                                        </p>
                                        <div className="grid gap-4">
                                            <div className="flex items-start gap-5 p-6 bg-muted/20 rounded-3xl border border-border/50 transition-all hover:bg-muted/30">
                                                <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center font-black text-sm shadow-sm shrink-0">1</div>
                                                <p className="text-sm font-medium pt-2">Touchez l'icône <span className="text-primary font-black inline-flex items-center gap-1 mx-1 bg-primary/10 px-2 py-0.5 rounded-lg"><Share className="h-4 w-4"/> Partager</span> située en bas de votre écran Safari.</p>
                                            </div>
                                            <div className="flex items-start gap-5 p-6 bg-muted/20 rounded-3xl border border-border/50 transition-all hover:bg-muted/30">
                                                <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center font-black text-sm shadow-sm shrink-0">2</div>
                                                <p className="text-sm font-medium pt-2">Faites défiler vers le bas et sélectionnez <span className="text-primary font-black inline-flex items-center gap-1 mx-1 bg-primary/10 px-2 py-0.5 rounded-lg"><PlusSquare className="h-4 w-4"/> Sur l'écran d'accueil</span>.</p>
                                            </div>
                                            <div className="flex items-start gap-5 p-6 bg-muted/20 rounded-3xl border border-border/50 transition-all hover:bg-muted/30">
                                                <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center font-black text-sm shadow-sm shrink-0">3</div>
                                                <p className="text-sm font-medium pt-2">Validez en appuyant sur <span className="text-primary font-black mx-1">Ajouter</span> en haut à droite.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Download className="h-4 w-4" /> Installation Automatique
                                            </p>
                                            <p className="text-sm text-muted-foreground font-medium leading-relaxed px-1">
                                                Sur Android, Chrome ou Edge Desktop, vous pouvez installer l'application instantanément en utilisant le bouton ci-dessous.
                                            </p>
                                        </div>
                                        
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                            <Button 
                                                onClick={handleInstallClick} 
                                                disabled={!deferredPrompt}
                                                className="relative w-full h-20 rounded-2xl font-black text-xl shadow-2xl shadow-primary/20 gap-4 transition-all active:scale-95"
                                            >
                                                <Download className="h-7 w-7 animate-bounce" />
                                                Installer iPOS Zen
                                            </Button>
                                        </div>

                                        {!deferredPrompt && (
                                            <div className="p-6 bg-amber-500/5 rounded-[2rem] border border-dashed border-amber-500/20 text-center">
                                                <p className="text-[10px] font-black uppercase text-amber-600/70 tracking-widest leading-relaxed">
                                                    Si le bouton est inactif, l'installation est disponible dans le menu <span className="inline-block p-1 bg-background rounded mx-1 shadow-sm">⋮</span> de votre navigateur.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Desktop Shortcut Tip */}
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-muted/20 overflow-hidden border border-border/50">
                            <CardContent className="p-8 flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-background flex items-center justify-center shadow-inner group">
                                    <Monitor className="h-8 w-8 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-tight">Utilisateurs PC / Mac</h4>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1">
                                        Sur Chrome ou Edge, cliquez sur l'icône <span className="inline-block p-1 bg-background rounded-md border shadow-sm mx-1"><Download className="h-3 w-3 text-primary" /></span> à droite de votre barre d'adresse pour installer iPOS sur votre bureau.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Features Sidebar */}
                    <div className="space-y-6">
                        <div className="p-8 bg-card rounded-[2.5rem] shadow-sm border border-white/5 space-y-8">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-center border-b pb-6 opacity-50">Les avantages Zen</h3>
                            
                            <div className="space-y-8">
                                <div className="flex gap-4 group">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-tight">Rapidité Éclair</h4>
                                        <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed">Lancement instantané sans chargement de page navigateur.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 group">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-tight">Focus Total</h4>
                                        <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed">Supprime la barre d'adresse pour un espace de travail pur.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 group">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                        <Star className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-tight">Icone Dédiée</h4>
                                        <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed">Retrouvez iPOS sur votre écran d'accueil comme une vraie App.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 text-center space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Statut de Sécurité</p>
                            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                                Installation locale : Vos données restent 100% privées sur ce disque dur.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tech Footer */}
            <div className="p-10 bg-muted/20 rounded-[3rem] border border-border/50 flex flex-col md:flex-row items-center gap-10 animate-in fade-in duration-1000 delay-300">
                <div className="h-24 w-24 rounded-[2.5rem] bg-background flex items-center justify-center shadow-inner border border-white/5 shrink-0 group">
                    <Smartphone className="h-12 w-12 text-primary opacity-20 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
                <div className="space-y-3 text-center md:text-left">
                    <h3 className="text-xl font-black tracking-tight">Technologie Progressive Web App</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-2xl">
                        iPOS Zen utilise les technologies Web les plus avancées pour vous offrir la légèreté d'un site web alliée à la puissance d'un logiciel de bureau. Une fois installée, l'application est optimisée pour une fluidité sans compromis.
                    </p>
                </div>
            </div>
        </div>
    );
}