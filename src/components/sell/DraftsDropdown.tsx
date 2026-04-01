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
import { File, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

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
                    <Button variant="outline" size="lg" className="h-14 text-base">
                        <File className="mr-2 h-5 w-5" />
                        Paniers
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Paniers en cours</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {carts.map(cart => (
                        <DropdownMenuItem 
                            key={cart.id} 
                            onClick={() => selectCart(cart.id)}
                            className={`flex justify-between items-center ${cart.id === activeCartId ? 'bg-accent' : ''}`}
                        >
                            <span>{cart.name} ({cart.items.length})</span>
                            <div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setNewName(cart.name); setCartToRename(cart); setDialogOpen(true); }}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteCart(cart.id); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => createCart()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Panier
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Rename Dialog */}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Renommer le panier</AlertDialogTitle>
                        <AlertDialogDescription>
                           Entrez un nouveau nom pour le panier "{cartToRename?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRename}>Renommer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
