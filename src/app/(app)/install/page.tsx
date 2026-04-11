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
                title="Expérience iPOS Zen"
                description="L'apogée du confort et de la réactivité pour votre gestion quotidienne."
            />

            {isInstalled ? (
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-primary/20 rounded-lg blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                    <Card className="relative rounded-lg border-white/5 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden animate-in zoom-in-95 duration-700">
                        <CardContent className="p-4 text-center space-y-4">
                            <div className="relative mx-auto w-32 h-32">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse rounded-full"></div>
                                <div className="relative h-32 w-32 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                                    <Trophy className="h-9 w-16" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold tracking-tighter text-emerald-500">Statut Zen Activé</h2>
                                <p className="text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed text-lg">
                                    iPOS Luxury est désormais une partie intégrante de votre système. Profitez d'une immersion totale et d'une fluidité souveraine.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
                                <Button asChild variant="outline" className="rounded-2xl h-9 px-4 font-semibold border-white/5 bg-card/40 hover:bg-emerald-500/5 gap-3 uppercase text-xs tracking-wide transition-all">
                                    <Link href="/settings">
                                        Diagnostic Système
                                    </Link>
                                </Button>
                                <Button asChild className="rounded-2xl h-9 px-4 font-semibold bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 gap-3 uppercase text-xs tracking-wide transition-all active:scale-95">
                                    <Link href="/dashboard">
                                        Ouvrir le Tableau de Bord <LayoutDashboard className="h-5 w-5" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-8 space-y-4">
                        <Card className="rounded-lg border-white/5 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-primary/5 p-4 border-b border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-sm">
                                        <Zap className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-semibold tracking-tighter">Guide d'Activation Zen</CardTitle>
                                        <CardDescription className="text-sm font-bold uppercase tracking-wide text-primary/50 mt-1">Libérez la puissance locale de votre application</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {platform === 'ios' ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-10 bg-primary rounded-full" />
                                            <p className="text-[10px] font-semibold text-primary uppercase ">Protocole Safari (iPhone/iPad)</p>
                                        </div>
                                        <div className="grid gap-6">
                                            <div className="flex items-start gap-6 p-4 bg-black/20 rounded-lg border border-white/5 transition-all hover:bg-black/30 group">
                                                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center font-semibold text-lg shadow-inner shrink-0 group-hover:text-primary transition-colors">1</div>
                                                <div className="pt-2">
                                                    <p className="text-lg font-bold leading-snug">Touchez l'icône <span className="text-primary font-semibold inline-flex items-center gap-2 mx-2 bg-primary/10 px-3 py-1 rounded-xl"><Share className="h-5 w-5"/> Partager</span> en bas de l'écran.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-6 p-4 bg-black/20 rounded-lg border border-white/5 transition-all hover:bg-black/30 group">
                                                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center font-semibold text-lg shadow-inner shrink-0 group-hover:text-primary transition-colors">2</div>
                                                <div className="pt-2">
                                                    <p className="text-lg font-bold leading-snug">Faites défiler et choisissez <span className="text-primary font-semibold inline-flex items-center gap-2 mx-2 bg-primary/10 px-3 py-1 rounded-xl"><PlusSquare className="h-5 w-5"/> Sur l'écran d'accueil</span>.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-6 p-4 bg-black/20 rounded-lg border border-white/5 transition-all hover:bg-black/30 group">
                                                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center font-semibold text-lg shadow-inner shrink-0 group-hover:text-primary transition-colors">3</div>
                                                <div className="pt-2">
                                                    <p className="text-lg font-bold leading-snug">Validez avec <span className="text-primary font-semibold mx-2">Ajouter</span> pour ancrer iPOS sur votre bureau.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-10 bg-primary rounded-full" />
                                                <p className="text-[10px] font-semibold text-primary uppercase ">Déploiement Automatique (Chrome / Edge / Android)</p>
                                            </div>
                                            <p className="text-muted-foreground font-medium leading-relaxed px-1">
                                                L'installation permet à iPOS Luxury de s'exécuter dans son propre processus système, garantissant des performances maximales et une confidentialité totale.
                                            </p>
                                        </div>
                                        
                                        <div className="relative group">
                                            <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                                            <Button 
                                                onClick={handleInstallClick} 
                                                disabled={!deferredPrompt}
                                                className="relative w-full h-24 rounded-lg font-semibold text-lg shadow-sm shadow-sm gap-5 transition-all active:scale-[0.98] border border-white/10"
                                            >
                                                <Download className="h-8 w-8 animate-bounce" />
                                                Activer le Mode iPOS Zen
                                            </Button>
                                        </div>

                                        {!deferredPrompt && (
                                            <div className="p-4 bg-amber-500/5 rounded-lg border border-dashed border-amber-500/20 text-center">
                                                <p className="text-[10px] font-semibold uppercase text-amber-600/70 leading-relaxed">
                                                    Si le bouton est inactif, l'installation est disponible dans le menu <span className="inline-block p-1 bg-background rounded-lg mx-2 shadow-inner border border-white/5">⋮</span> de votre navigateur.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg border border-white/5 group hover:bg-muted/30 transition-all duration-700">
                            <div className="h-20 w-20 rounded-lg bg-background flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <Monitor className="h-10 w-10 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold uppercase tracking-tight">Poste de Travail PC / Mac</h4>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed mt-2">
                                    Pour une expérience de caisse optimale, cliquez sur l'icône <span className="inline-block p-1.5 bg-background rounded-xl border border-white/10 shadow-lg mx-2"><Download className="h-4 w-4 text-primary" /></span> à droite de votre barre d'adresse.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-4">
                        <div className="p-4 bg-card/40 backdrop-blur-sm rounded-lg shadow-sm border border-white/5 space-y-4">
                            <h3 className="text-xs font-semibold uppercase text-center border-b border-white/5 pb-8 opacity-40 italic">Privilèges iPOS Zen</h3>
                            
                            <div className="space-y-4">
                                <div className="flex gap-6 group">
                                    <div className="h-9 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                        <Zap className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-wide">Rapidité Éclair</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium mt-2 leading-relaxed">Lancement instantané. Aucune latence réseau pour vos ventes.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 group">
                                    <div className="h-9 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-wide">Focus Absolu</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium mt-2 leading-relaxed">Supprime toute distraction pour un espace de travail pur.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 group">
                                    <div className="h-9 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                        <Zap className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-wide">Souveraineté</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium mt-2 leading-relaxed">Retrouvez iPOS sur votre écran d'accueil comme une App native.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 text-center space-y-4 relative overflow-hidden group">
                            <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-primary/5 group-hover:opacity-20 transition-opacity" />
                            <p className="text-[10px] font-semibold uppercase text-primary/60">Confidentialité Elite</p>
                            <p className="text-xs font-bold text-muted-foreground leading-relaxed italic relative z-10">
                                Installation 100% Locale : Vos données commerciales ne transitent par aucun serveur. Tout reste chez vous.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 bg-muted/20 rounded-lg border border-white/5 flex flex-col md:flex-row items-center gap-4 animate-in fade-in duration-1000 delay-300">
                <div className="h-28 w-28 rounded-lg bg-background flex items-center justify-center shadow-sm border border-white/5 shrink-0 group">
                    <Smartphone className="h-14 w-14 text-primary opacity-20 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
                <div className="space-y-4 text-center md:text-left">
                    <h3 className="text-lg font-semibold tracking-tighter">Technologie Progressive Web App</h3>
                    <p className="text-base text-muted-foreground font-medium leading-relaxed max-w-3xl">
                        iPOS Zen utilise les standards du Web moderne pour vous offrir la légèreté d'un site allié à la puissance d'un logiciel de bureau. Une fois installée, l'application fonctionne de manière autonome, optimisant chaque cycle CPU pour votre confort.
                    </p>
                </div>
            </div>
        </div>
    );
}
