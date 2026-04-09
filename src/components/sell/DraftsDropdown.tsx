'use client';

import { useState, useEffect } from 'react';
import { useCartStore, useCartActions, useActiveCart } from '@/stores/cartStore';
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
import { FileStack, Plus, Trash2, Edit, PauseCircle, Check, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function DraftsDropdown() {
    const [isMounted, setIsMounted] = useState(false);
    const { carts, activeCartId } = useCartStore();
    const { createCart, selectCart, deleteCart, renameCart } = useCartActions();

    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [cartToRename, setCartToRename] = useState<{ id: string, name: string } | null>(null);
    const [newName, setNewName] = useState('');
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleRename = () => {
        if (cartToRename && newName.trim()) {
            renameCart(cartToRename.id, newName.trim());
            toast.success("Panier renommé.");
        }
        setRenameDialogOpen(false);
        setCartToRename(null);
        setNewName('');
    }

    const handleSuspendAndNew = () => {
        createCart();
        toast.success("Mise en attente réussie.");
    };

    if (!isMounted) {
        return (
            <Button variant="outline" size="lg" className="h-12 text-sm opacity-50 cursor-not-allowed">
                <FileStack className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Chargement...</span>
            </Button>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button id="sell-drafts-button" variant="outline" size="lg" className="h-12 text-sm border shadow-sm bg-white/50">
                        <FileStack className="mr-2 h-4 w-4 text-primary" />
                        <span className="hidden sm:inline">Attente</span>
                        <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black">{carts.length}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 p-1.5 rounded-xl shadow-xl border">
                    <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">Sessions en cours</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary font-bold hover:bg-primary/10" onClick={() => createCart()}>
                            <Plus className="mr-1 h-3 w-3" /> Nouveau
                        </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <div className="max-h-[280px] overflow-y-auto space-y-1 my-1 pr-1 custom-scrollbar">
                        {carts.map(cart => {
                            const { total } = calculateCartTotals(cart);
                            const isActive = cart.id === activeCartId;
                            const itemCount = cart.items.reduce((sum, item) => sum + item.cartQuantity, 0);

                            return (
                                <div 
                                    key={cart.id}
                                    className={cn(
                                        "group flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-200 border border-transparent",
                                        isActive ? "bg-primary/10 border-primary/20 shadow-inner" : "hover:bg-muted/50"
                                    )}
                                    onClick={() => selectCart(cart.id)}
                                >
                                    <div className={cn(
                                        "flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center transition-colors",
                                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <ShoppingBag className="h-4 w-4" />
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className={cn("font-bold truncate text-[11px] tracking-tight", isActive ? "text-primary" : "")}>
                                                {cart.name}
                                            </p>
                                            {isActive && <Check className="h-3 w-3 text-primary animate-in zoom-in" />}
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-70">
                                            <span>{itemCount} pos</span>
                                            <span className="text-primary font-black">{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 hover:bg-white rounded-md border bg-white/50" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setNewName(cart.name); 
                                                setCartToRename(cart); 
                                                setRenameDialogOpen(true); 
                                            }}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-md border bg-white/50" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (carts.length > 1) {
                                                    deleteCart(cart.id);
                                                } else {
                                                    toast.error("Action impossible.");
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={handleSuspendAndNew}
                        className="flex items-center justify-center gap-2 p-2.5 my-1 rounded-lg font-black text-[10px] uppercase tracking-widest text-primary focus:text-primary focus:bg-primary/10 cursor-pointer"
                    >
                        <PauseCircle className="h-3.5 w-3.5" />
                        Mettre en attente [F9]
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Rename Dialog */}
            <AlertDialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <AlertDialogContent className="rounded-2xl border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-black tracking-tight">Nommer la session</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-medium opacity-70">
                           Entrez un identifiant pour ce brouillon.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Input 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            className="h-11 font-bold rounded-xl bg-muted/50"
                            placeholder="Nom..."
                            autoFocus
                        />
                    </div>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl h-10 text-xs">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRename} className="rounded-xl h-10 text-xs font-bold">
                            Enregistrer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
