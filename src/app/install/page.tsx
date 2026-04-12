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
    Zap, 
    ShieldCheck, 
    Trophy, 
    LayoutDashboard, 
    Sparkles 
} from "lucide-react";
import Link from 'next/link';

export default function InstallPWAPage() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'other'>('other');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setPlatform(isIOS ? 'ios' : 'other');

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
        <div className="p-6 sm:p-4 space-y-4 max-w-6xl mx-auto pb-24 animate-in fade-in duration-1000">
            <PageHeader 
                title="Installation Intelligente iPOS Zen"
                description="Installez l'application sur votre appareil pour un accès rapide et un fonctionnement hors ligne."
            />

            {isInstalled ? (
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-primary/20 rounded-lg blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                    <Card className="relative rounded-lg border-white/5 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden animate-in zoom-in-95 duration-700">
                        <CardContent className="p-8 text-center space-y-6">
                            <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse rounded-full"></div>
                                <div className="relative h-24 w-24 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                                    <Trophy className="h-10 w-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tighter text-emerald-500">Installation Réussie</h2>
                                <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                                    iPOS Zen fonctionne désormais comme un programme indépendant sur votre appareil. Profitez d'une vitesse supérieure et d'une confidentialité totale.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Button asChild variant="outline" className="rounded-xl h-11 px-8 font-bold border-white/5 bg-card/40 hover:bg-emerald-500/5 gap-3 uppercase text-xs tracking-wide">
                                    <Link href="/settings">Diagnostic Système</Link>
                                </Button>
                                <Button asChild className="rounded-xl h-11 px-8 font-bold bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 gap-3 uppercase text-xs tracking-wide">
                                    <Link href="/dashboard">Tableau de Bord <LayoutDashboard className="h-4 w-4" /></Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="rounded-2xl border-white/5 shadow-xl bg-card/40 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-primary/5 p-6 border-b border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold tracking-tight">Guide d'Activation Rapide</CardTitle>
                                        <CardDescription className="text-xs font-bold uppercase tracking-wide text-primary/50 mt-1">Libérez la puissance de traitement locale de votre appareil</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {platform === 'ios' ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-10 bg-primary rounded-full" />
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Protocole Safari (iPhone/iPad)</p>
                                        </div>
                                        <div className="grid gap-4">
                                            {[
                                                { step: 1, text: "Appuyez sur l'icône de partage", icon: <Share className="h-4 w-4"/>, highlight: "Partager" },
                                                { step: 2, text: "Choisissez 'Sur l'écran d'accueil'", icon: <PlusSquare className="h-4 w-4"/>, highlight: "Sur l'écran d'accueil" },
                                                { step: 3, text: "Appuyez sur 'Ajouter' pour confirmer", icon: null, highlight: "Ajouter" }
                                            ].map((s) => (
                                                <div key={s.step} className="flex items-start gap-6 p-5 bg-black/20 rounded-2xl border border-white/5 transition-all hover:bg-black/30 group">
                                                    <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center font-bold text-lg shadow-inner shrink-0 group-hover:text-primary transition-colors">{s.step}</div>
                                                    <div className="pt-1.5">
                                                        <p className="text-sm font-bold leading-snug">
                                                            {s.text} <span className="text-primary font-bold inline-flex items-center gap-2 mx-2 bg-primary/10 px-3 py-1 rounded-lg">{s.icon} {s.highlight}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-10 bg-primary rounded-full" />
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Installation Automatique (Chrome / Android / Edge)</p>
                                            </div>
                                            <p className="text-muted-foreground text-sm font-medium leading-relaxed px-1">
                                                L'installation permet à iPOS Zen de s'exécuter dans un processus système indépendant, garantissant des performances maximales et une confidentialité totale des données hors du navigateur.
                                            </p>
                                        </div>
                                        
                                        <div className="relative group">
                                            <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                                            <Button 
                                                onClick={handleInstallClick} 
                                                disabled={!deferredPrompt}
                                                className="relative w-full h-24 rounded-2xl font-black text-xl shadow-2xl gap-5 transition-all active:scale-[0.98] border border-white/10"
                                            >
                                                <Download className="h-8 w-8 animate-bounce" />
                                                Installer iPOS Zen Maintenant
                                            </Button>
                                        </div>

                                        {!deferredPrompt && (
                                            <div className="p-5 bg-amber-500/5 rounded-2xl border border-dashed border-amber-500/20 text-center">
                                                <p className="text-xs font-bold uppercase text-amber-600/70 leading-relaxed">
                                                    Si le bouton est inactif, l'installation est disponible dans le menu <span className="inline-block p-1 bg-background rounded-lg mx-2 shadow-inner border border-white/5">⋮</span> du navigateur.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex items-center gap-5 p-6 bg-muted/20 rounded-2xl border border-white/5 group hover:bg-muted/30 transition-all duration-700">
                            <div className="h-16 w-16 rounded-2xl bg-background flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <Monitor className="h-8 w-8 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold uppercase tracking-tight">Sur Ordinateur (PC/Mac)</h4>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1">
                                    Pour obtenir la meilleure expérience de caisse, appuyez sur l'icône d'écran <span className="inline-block p-1 bg-background rounded-lg border border-white/10 shadow-lg mx-1"><Download className="h-3 w-3 text-primary" /></span> à droite de la barre d'adresse.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-6 bg-card/40 backdrop-blur-sm rounded-2xl shadow-xl border border-white/5 space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-center border-b border-white/5 pb-4 opacity-40 tracking-[0.2em]">Avantages du Mode Zen</h3>
                            
                            <div className="space-y-6">
                                {[
                                    { icon: Zap, color: "text-primary", title: "Vitesse Éclair", desc: "Ouverture instantanée de l'application sans attente réseau." },
                                    { icon: ShieldCheck, color: "text-emerald-500", title: "Focus Absolu", desc: "Élimination des distractions pour un espace de travail propre." },
                                    { icon: Download, color: "text-amber-500", title: "Souveraineté des Données", desc: "L'application fonctionne comme un système natif complet." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform bg-white/5", item.color)}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold uppercase tracking-wide">{item.title}</h4>
                                            <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 text-center space-y-4 relative overflow-hidden group">
                            <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-primary/5 group-hover:opacity-20 transition-opacity" />
                            <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Sécurité Locale 100%</p>
                            <p className="text-xs font-bold text-muted-foreground leading-relaxed italic relative z-10">
                                "Vos données commerciales ne quittent jamais votre appareil. La confidentialité est le cœur d'iPOS Zen."
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
