'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Coins, 
    TrendingUp, 
    Landmark, 
    Building, 
    Scale, 
    RefreshCw, 
    AlertCircle, 
    CheckCircle2, 
    Info,
    Sparkles,
    Archive
} from 'lucide-react';
import { zakatService } from '@/services/zakat.service';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ZakatPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [useSalePrice, setUseSalePrice] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await zakatService.getZakatData();
            setData(result);
        } catch (error) {
            toast.error("Échec du calcul de la Zakat.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const calculation = useMemo(() => {
        if (!data) return { base: 0, zakat: 0, isEligible: false };
        
        const inventory = useSalePrice ? data.inventoryValueSale : data.inventoryValueCost;
        const base = (inventory + data.customerDebts) - data.supplierDebts;
        const isEligible = base >= data.nisabThreshold;
        const zakat = isEligible ? base * 0.025 : 0;

        return { base, zakat, isEligible };
    }, [data, useSalePrice]);

    if (isLoading && !data) {
        return (
            <div className="p-6 sm:p-10 space-y-10 max-w-[1400px] mx-auto animate-pulse">
                <Skeleton className="h-12 w-64 rounded-xl bg-card/40" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[2rem] bg-card/40" />)}
                </div>
                <Skeleton className="h-[400px] w-full rounded-[3rem] bg-card/40" />
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-10 space-y-10 max-w-[1400px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Calculateur de Zakat" 
                description="Évaluation spirituelle et financière de vos actifs commerciaux"
            >
                <Button 
                    variant="outline" 
                    onClick={fetchData} 
                    className="rounded-2xl h-12 border-primary/20 bg-card hover:bg-primary/5 transition-all group"
                >
                    <RefreshCw className={cn("h-4 w-4 text-primary mr-2", isLoading && "animate-spin")} />
                    Actualiser les flux
                </Button>
            </PageHeader>

            {/* Top Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="luxury-card bg-card/40 backdrop-blur-xl border-white/5 rounded-[2rem]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Archive className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Valeur Marchandise</p>
                            <p className="text-xl font-black">{formatCurrency(useSalePrice ? data.inventoryValueSale : data.inventoryValueCost)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card bg-card/40 backdrop-blur-xl border-white/5 rounded-[2rem]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Créances Clients</p>
                            <p className="text-xl font-black text-emerald-500">{formatCurrency(data.customerDebts)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card bg-card/40 backdrop-blur-xl border-white/5 rounded-[2rem]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
                            <Building className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Dettes Fournisseurs</p>
                            <p className="text-xl font-black text-destructive">-{formatCurrency(data.supplierDebts)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card bg-card/40 backdrop-blur-xl border-white/5 rounded-[2rem]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                            <Scale className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Nissab (85g Or)</p>
                            <p className="text-xl font-black text-amber-500">{formatCurrency(data.nisabThreshold)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Main Calculation Card */}
                <div className="lg:col-span-8">
                    <Card className="rounded-[3rem] border-white/5 bg-card/40 backdrop-blur-3xl overflow-hidden shadow-2xl h-full">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                                    <Coins className="h-8 w-8" />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-black tracking-tighter">Bilan de la Zakat</CardTitle>
                                    <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Assiette imposable & Quotité</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                            <div className="p-10 rounded-[2.5rem] bg-black/40 border border-white/5 text-center space-y-6 relative overflow-hidden group">
                                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000">
                                    <Landmark className="h-48 w-48 rotate-12" />
                                </div>
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Montant de la Zakat due (2.5%)</p>
                                    <p className={cn(
                                        "text-7xl font-black tracking-tighter transition-all duration-700",
                                        calculation.isEligible ? "text-primary scale-105" : "text-muted-foreground/20"
                                    )}>
                                        {formatCurrency(calculation.zakat)}
                                    </p>
                                </div>
                                {!calculation.isEligible && (
                                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-in zoom-in">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">En dessous du Nissab</span>
                                    </div>
                                )}
                                {calculation.isEligible && (
                                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in zoom-in">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Assiette éligible à la Zakat</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-muted/20 rounded-[2rem] border border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total Capital Imposable</p>
                                            <p className="text-2xl font-black tracking-tighter">{formatCurrency(calculation.base)}</p>
                                        </div>
                                        <Scale className="h-8 w-8 opacity-10" />
                                    </div>
                                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Évaluation au prix de vente</Label>
                                            <Switch 
                                                checked={useSalePrice} 
                                                onCheckedChange={setUseSalePrice}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                        <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                                            La plupart des savants préconisent l'évaluation du stock au prix de vente actuel pour les commerçants.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8 bg-muted/10 rounded-[2rem] border border-dashed border-white/5 space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <Info className="h-3 w-3 text-primary" /> Rappel des règles
                                    </h4>
                                    <ul className="space-y-4 text-[11px] font-medium text-muted-foreground/70 leading-relaxed">
                                        <li className="flex gap-3">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                            <span>La Zakat s'applique sur les biens destinés à la vente, l'argent liquide et les créances sûres.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                            <span>Vous devez avoir possédé ce capital pendant une année lunaire complète (Hawl).</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                            <span>Le seuil (Nissab) correspond à la valeur marchande de 85 grammes d'or pur.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="rounded-[2.5rem] border-white/5 bg-card/40 backdrop-blur-3xl overflow-hidden shadow-xl">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/60">Configuration Nissab</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="p-6 bg-black/20 rounded-2xl border border-white/5 text-center">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/40 mb-2">Cours de référence Or</p>
                                <p className="text-3xl font-black text-amber-500 tracking-tighter">{formatCurrency(data.goldPrice)}/g</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic text-center">
                                Modifiez cette valeur dans votre <a href="/profile" className="text-primary font-black hover:underline">Profil Elite</a> pour ajuster le seuil du Nissab.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 text-center relative overflow-hidden group">
                        <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-primary/5 group-hover:opacity-20 transition-opacity" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Pureté Financière</p>
                        <p className="text-xs font-bold text-muted-foreground/60 leading-relaxed italic relative z-10">
                            "Prélève de leurs biens une aumône par laquelle tu les purifies et les bénis." (Sourate At-Tawba, v.103)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
