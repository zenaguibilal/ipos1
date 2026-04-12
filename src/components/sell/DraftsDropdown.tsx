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
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
    FileStack,
    Plus,
    Trash2,
    Edit,
    PauseCircle,
    Check,
    ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateCartTotals, formatCurrency, cn } from '@/lib/utils';

export function DraftsDropdown() {
    const [isMounted, setIsMounted] = useState(false);
    const { carts, activeCartId }   = useCartStore();
    const { createCart, selectCart, deleteCart, renameCart } = useCartActions();

    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [cartToRename, setCartToRename] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleRename = () => {
        if (cartToRename && newName.trim()) {
            renameCart(cartToRename.id, newName.trim());
            toast.success('Panier renommé.');
        }
        setRenameDialogOpen(false);
        setCartToRename(null);
        setNewName('');
    };

    // FIX #19 : on ne stocke pas le retour de createCart dans une variable
    // inutilisée — on appelle directement la fonction.
    const handleSuspendAndNew = () => {
        createCart();
        toast.success('Vente actuelle mise en attente. Nouveau panier créé.');
    };

    if (!isMounted) {
        return (
            <Button
                variant="outline"
                size="lg"
                className="h-9 text-sm opacity-50 cursor-not-allowed"
            >
                <FileStack className="h-4 w-4 mr-1.5" />
                Ventes
            </Button>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5">
                        <FileStack className="h-4 w-4" />
                        <span className="hidden sm:inline">Ventes</span>
                        {carts.length > 1 && (
                            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4">
                                {carts.length}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="flex items-center justify-between">
                        <span>Paniers actifs</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary font-bold hover:bg-primary/10"
                            onClick={() => createCart()}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Nouveau
                        </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {carts.map(cart => {
                        const totals = calculateCartTotals(cart);
                        const isActive = cart.id === activeCartId;
                        return (
                            <DropdownMenuItem
                                key={cart.id}
                                className={cn(
                                    'flex items-center justify-between cursor-pointer p-2 rounded-md',
                                    isActive && 'bg-primary/10 text-primary font-semibold',
                                )}
                                onSelect={() => selectCart(cart.id)}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {isActive ? (
                                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                                    ) : (
                                        <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    )}
                                    <span className="truncate text-sm">
                                        {cart.name}
                                    </span>
                                    {cart.items.length > 0 && (
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            ({cart.items.length} art.)
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {totals.total > 0 && (
                                        <span className="text-xs font-mono text-primary">
                                            {formatCurrency(totals.total)}
                                        </span>
                                    )}
                                    <button
                                        className="p-1 rounded hover:bg-muted"
                                        onClick={e => {
                                            e.stopPropagation();
                                            setCartToRename({
                                                id:   cart.id,
                                                name: cart.name,
                                            });
                                            setNewName(cart.name);
                                            setRenameDialogOpen(true);
                                        }}
                                    >
                                        <Edit className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-1 rounded hover:bg-destructive/10"
                                        onClick={e => {
                                            e.stopPropagation();
                                            deleteCart(cart.id);
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </button>
                                </div>
                            </DropdownMenuItem>
                        );
                    })}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={handleSuspendAndNew}
                        className="text-primary font-medium gap-2"
                    >
                        <PauseCircle className="h-4 w-4" />
                        Suspendre et créer nouveau
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog renommage */}
            <AlertDialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Renommer le panier</AlertDialogTitle>
                        <AlertDialogDescription>
                            Entrez un nouveau nom pour ce panier.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleRename();
                        }}
                        autoFocus
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRename}>
                            Renommer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
