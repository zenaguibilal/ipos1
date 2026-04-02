'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Edit, Users, Wheat } from 'lucide-react';
import { BreadClientForm } from './BreadClientForm';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BREAD_WEEK_DAY_LABELS, BREAD_WEEK_DAYS } from '@/lib/constants';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BreadClientListProps {
    onListChange: () => void;
}

export function BreadClientList({ onListChange }: BreadClientListProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [clients, setClients] = useState<Customer[] | undefined>(undefined);

    const fetchClients = useCallback(async () => {
        try {
            const data = await customerService.filterCustomers({ status: 'is_bread_client' });
            setClients(data);
        } catch (error: any) {
            toast.error("Impossible de charger les clients de pain.");
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);
    
    const handleFormSuccess = () => {
        fetchClients();
        onListChange(); 
    }

    const isLoading = clients === undefined;

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsFormOpen(true);
    };

    const getRecurrenceBadge = (client: Customer) => {
        if (!client.isBreadClient) return null;
        
        switch (client.bread_type_recurrence) {
            case 'quotidien':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase">Quotidien</Badge>;
            case 'jours_specifiques':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] font-black uppercase">Programmé</Badge>;
            case 'aucun':
                return <Badge variant="outline" className="bg-muted text-muted-foreground text-[8px] font-black uppercase">Manuel</Badge>;
            default:
                return null;
        }
    }

    return (
        <>
            <Card className="flex flex-col h-full rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary opacity-50" />
                        Abonnés au Pain
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-4">
                    <ScrollArea className="h-full pr-2 -mr-2">
                        <div className="space-y-2">
                            {isLoading && [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                            
                            {!isLoading && clients?.map(client => (
                                <div key={client.uuid} className="group flex items-center p-3 rounded-2xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/50">
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-sm truncate">{client.firstName} {client.lastName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getRecurrenceBadge(client)}
                                            {client.bread_type_recurrence === 'quotidien' && (
                                                <span className="text-[10px] font-bold text-muted-foreground">×{client.bread_quantite_defaut}</span>
                                            )}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(client)}>
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}

                             {!isLoading && clients?.length === 0 && (
                                <div className="text-center py-12">
                                    <Wheat className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4">Aucun abonné</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <BreadClientForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                customer={selectedCustomer}
                onSuccess={handleFormSuccess}
            />
        </>
    );
}
