'use client';

import { useState } from 'react';
import { useCartStore, useCartActions } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { FileStack, Plus, Trash2, Edit, PauseCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function DraftsDropdown() {
    const { carts, activeCartId } = useCartStore();
    const { createCart, selectCart, deleteCart, renameCart } = useCartActions();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [cartToRename, setCartToRename] = useState<{ id: string, name: string } | null>(null);
    const [newName, setNewName] = useState('');
    
    const handleRename = () => {
        if (cartToRename && newName.trim()) {
            renameCart(cartToRename.id, newName.trim());
            toast.success("Panier renommé.");
        }
        setDialogOpen(false);
        setCartToRename(null);
        setNewName('');
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="h-14 text-base border-primary/20 hover:bg-primary/5 transition-all">
                        <FileStack className="mr-2 h-5 w-5 text-primary" />
                        <span className="hidden sm:inline">Brouillons</span>
                        <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-bold">{carts.length}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-2">
                    <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5">
                        <span>Ventes en attente</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-bold" onClick={() => createCart()}>
                            <Plus className="mr-1 h-3 w-3" /> Nouveau
                        </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <div className="max-h-[350px] overflow-y-auto space-y-1 my-1">
                        {carts.map(cart => {
                            const { total } = calculateCartTotals(cart);
                            const isActive = cart.id === activeCartId;
                            const itemCount = cart.items.reduce((sum, item) => sum + item.cartQuantity, 0);

                            return (
                                <div 
                                    key={cart.id}
                                    className={cn(
                                        "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                                        isActive ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted"
                                    )}
                                    onClick={() => selectCart(cart.id)}
                                >
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={cn("font-bold truncate text-sm", isActive ? "text-primary" : "")}>
                                                {cart.name}
                                            </p>
                                            {isActive && <Check className="h-3 w-3 text-primary" />}
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                                            <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
                                            <span className="text-primary/60 font-bold">{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 hover:bg-background shadow-sm" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setNewName(cart.name); 
                                                setCartToRename(cart); 
                                                setDialogOpen(true); 
                                            }}
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-sm" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (carts.length > 1) {
                                                    deleteCart(cart.id);
                                                } else {
                                                    toast.error("Impossible de supprimer le dernier panier.");
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => {
                            createCart();
                            toast.success("Vente actuelle mise en attente. Nouveau panier créé.");
                        }}
                        className="flex items-center justify-center gap-2 p-2 font-bold text-primary focus:text-primary focus:bg-primary/5 cursor-pointer"
                    >
                        <PauseCircle className="h-4 w-4" />
                        Suspendre et Nouveau
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Rename Dialog */}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Renommer le panier</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                           Entrez un nom pour identifier cette vente (ex: Nom du client, Numéro de table...)
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Input 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            className="h-12 text-lg font-bold rounded-xl bg-muted/50"
                            autoFocus
                        />
                    </div>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold border-none">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRename} className="rounded-xl font-bold px-8">Enregistrer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
