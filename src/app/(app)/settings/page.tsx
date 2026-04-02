'use client';

import { PageHeader } from "@/components/layout/PageHeader";
import { DataManagementCard } from "@/components/profile/DataManagementCard";

export default function SettingsPage() {
    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
            <PageHeader 
                title="Paramètres Système"
                description="Gérez vos données locales et la maintenance de l'application."
            />
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <DataManagementCard />
            </div>

            <div className="p-6 bg-muted/20 rounded-3xl border border-dashed border-border/50 text-center space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sécurité des données</p>
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-md mx-auto">
                    iPOS fonctionne en mode local. Vos données ne quittent jamais ce navigateur. 
                    Il est fortement recommandé de télécharger une sauvegarde régulièrement sur un support externe.
                </p>
            </div>
        </div>
    );
}
