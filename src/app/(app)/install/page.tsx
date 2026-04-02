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
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InstallPWAPage() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'other'>('other');

    useEffect(() => {
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

    return (
        <div className="p-4 sm:p-6 space-y-8 max-w-4xl mx-auto pb-24">
            <PageHeader 
                title="Installation de l'Application"
                description="Utilisez iPOS comme une application native pour une rapidité et un confort maximum."
            />

            {isInstalled ? (
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-emerald-500/5 border-emerald-500/20 overflow-hidden animate-in zoom-in-95 duration-500">
                    <CardContent className="p-12 text-center space-y-6">
                        <div className="h-24 w-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight text-emerald-600">Application Installée !</h2>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                                iPOS est désormais disponible sur votre écran d'accueil pour une utilisation 100% optimisée et hors-ligne.
                            </p>
                        </div>
                        <Button variant="outline" className="rounded-2xl h-12 px-8 font-bold border-emerald-500/20" onClick={() => window.location.href = '/'}>
                            Ouvrir le Tableau de Bord
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Main Installation Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    <Smartphone className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight">Version Mobile & Tablette</CardTitle>
                                    <CardDescription className="font-medium text-muted-foreground/70 italic">Pour Android et iOS (iPhone/iPad).</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            {platform === 'ios' ? (
                                <div className="space-y-6">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="h-4 w-4" /> Procédure Safari (iOS)
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                                            <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center font-black text-xs shadow-sm">1</div>
                                            <p className="text-sm font-medium pt-1">Appuyez sur le bouton <span className="text-primary font-bold flex inline-flex items-center gap-1 mx-1"><Share className="h-4 w-4"/> Partager</span> en bas de votre écran.</p>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                                            <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center font-black text-xs shadow-sm">2</div>
                                            <p className="text-sm font-medium pt-1">Faites défiler et choisissez <span className="text-primary font-bold flex inline-flex items-center gap-1 mx-1"><PlusSquare className="h-4 w-4"/> Sur l'écran d'accueil</span>.</p>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                                            <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center font-black text-xs shadow-sm">3</div>
                                            <p className="text-sm font-medium pt-1">Validez en appuyant sur <span className="text-primary font-bold mx-1">Ajouter</span> en haut à droite.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Download className="h-4 w-4" /> Installation Android
                                    </p>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                        Une bannière d'installation devrait apparaître. Sinon, utilisez le bouton ci-dessous ou le menu de Chrome (3 points) puis "Installer l'application".
                                    </p>
                                    <Button 
                                        onClick={handleInstallClick} 
                                        disabled={!deferredPrompt}
                                        className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 gap-3 group"
                                    >
                                        <Download className="h-6 w-6 group-hover:bounce" />
                                        Installer iPOS
                                    </Button>
                                    {!deferredPrompt && (
                                        <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-center">
                                            <p className="text-[10px] font-black uppercase text-amber-600/70 tracking-widest">Utilisez Chrome pour installer</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Desktop Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    <Monitor className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight">Version Ordinateur</CardTitle>
                                    <CardDescription className="font-medium text-muted-foreground/70 italic">Optimisé pour PC, Mac et Linux.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="p-6 bg-muted/20 rounded-[2rem] border border-dashed border-border/50 relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                                        <Download className="h-24 w-24" />
                                    </div>
                                    <p className="text-sm font-bold text-primary mb-3 uppercase tracking-tighter">Bouton de barre d'adresse</p>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        Sur Chrome ou Edge, cliquez sur l'icône <span className="inline-block p-1 bg-background rounded-md border border-border shadow-sm"><Download className="h-3 w-3" /></span> située à droite de votre barre d'adresse pour installer l'application.
                                    </p>
                                </div>
                                
                                <div className="space-y-4 pt-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 px-2">Pourquoi installer ?</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-emerald-600">
                                            <Zap className="h-4 w-4 shrink-0" />
                                            <span className="text-xs font-black uppercase tracking-tight">Vitesse de chargement X3</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 text-primary">
                                            <ShieldCheck className="h-4 w-4 shrink-0" />
                                            <span className="text-xs font-black uppercase tracking-tight">Accès Hors-ligne Total</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="p-8 bg-muted/20 rounded-[2.5rem] border border-border/50 flex flex-col md:flex-row items-center gap-8 animate-in fade-in duration-1000">
                <div className="h-20 w-20 rounded-[1.5rem] bg-background flex items-center justify-center shadow-inner border border-white/5 shrink-0">
                    <Globe className="h-10 w-10 text-primary opacity-20" />
                </div>
                <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-black tracking-tight">Une technologie au service de votre commerce</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        iPOS utilise les Progressive Web Apps (PWA) pour vous offrir le meilleur des deux mondes : la légèreté d'un site web et la puissance d'une application installée. Vos données restent locales, privées et toujours accessibles.
                    </p>
                </div>
            </div>
        </div>
    );
}
