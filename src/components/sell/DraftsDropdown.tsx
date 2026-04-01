'use client';

import { useState } from 'react';
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
    const { carts, activeCartId } = useCartStore();
    const activeCart = useActiveCart();
    const { createCart, selectCart, deleteCart, renameCart } = useCartActions();

    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [cartToRename, setCartToRename] = useState<{ id: string, name: string } | null>(null);
    const [newName, setNewName] = useState('');
    
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
        const newId = createCart();
        toast.success("Vente actuelle mise en attente. Nouveau panier créé.");
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button id="sell-drafts-button" variant="outline" size="lg" className="h-14 text-base border-primary/20 hover:bg-primary/5 transition-all shadow-sm">
                        <FileStack className="mr-2 h-5 w-5 text-primary" />
                        <span className="hidden sm:inline">Brouillons</span>
                        <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">{carts.length}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-xl border-primary/10">
                    <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm font-black uppercase tracking-tighter">Ventes en attente</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-bold hover:bg-primary/10" onClick={() => createCart()}>
                            <Plus className="mr-1 h-3 w-3" /> Nouveau
                        </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="opacity-50" />
                    
                    <div className="max-h-[350px] overflow-y-auto space-y-1 my-1 pr-1 custom-scrollbar">
                        {carts.map(cart => {
                            const { total } = calculateCartTotals(cart);
                            const isActive = cart.id === activeCartId;
                            const itemCount = cart.items.reduce((sum, item) => sum + item.cartQuantity, 0);

                            return (
                                <div 
                                    key={cart.id}
                                    className={cn(
                                        "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                                        isActive ? "bg-primary/15 border-l-4 border-l-primary shadow-inner" : "hover:bg-muted/50"
                                    )}
                                    onClick={() => selectCart(cart.id)}
                                >
                                    <div className={cn(
                                        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <ShoppingBag className="h-5 w-5" />
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={cn("font-bold truncate text-sm tracking-tight", isActive ? "text-primary" : "")}>
                                                {cart.name}
                                            </p>
                                            {isActive && <Check className="h-3 w-3 text-primary animate-in zoom-in" />}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-70">
                                            <span>{itemCount} Article{itemCount > 1 ? 's' : ''}</span>
                                            <span className="text-primary font-black">{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 hover:bg-background rounded-lg shadow-sm" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setNewName(cart.name); 
                                                setCartToRename(cart); 
                                                setRenameDialogOpen(true); 
                                            }}
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg shadow-sm" 
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

                    <DropdownMenuSeparator className="opacity-50" />
                    <DropdownMenuItem 
                        onClick={handleSuspendAndNew}
                        className="flex items-center justify-center gap-2 p-3 my-1 rounded-xl font-black text-xs uppercase tracking-widest text-primary focus:text-primary focus:bg-primary/10 cursor-pointer transition-all active:scale-95"
                    >
                        <PauseCircle className="h-4 w-4" />
                        Suspendre et Nouveau
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Rename Dialog */}
            <AlertDialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black tracking-tighter">Identifier cette vente</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground font-medium">
                           Entrez un nom pour cette مسودة (مثلاً: رقم الطاولة، اسم العميل، إلخ)
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-6">
                        <div className="relative">
                            <Input 
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                className="h-14 text-xl font-bold rounded-2xl bg-muted/50 border-none px-6 focus-visible:ring-primary shadow-inner"
                                placeholder="Nom du panier..."
                                autoFocus
                            />
                            <ShoppingBag className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        </div>
                    </div>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-2xl font-bold border-none h-12 flex-1">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRename} className="rounded-2xl font-bold px-8 h-12 flex-1 shadow-lg shadow-primary/20">
                            Enregistrer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
