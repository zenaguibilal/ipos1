
'use client';

import React from 'react';
import type { Expense } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Banknote, Calendar, Tag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, cn, safeToDate } from '@/lib/utils';

interface ExpenseCardProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
}

const ExpenseCardComponent = ({ expense, onEdit, onDelete }: ExpenseCardProps) => {
    return (
        <Card className="group flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-card border-none relative overflow-hidden rounded-3xl">
            {/* Action Menu */}
            <div className="absolute top-3 right-3 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-md border-none shadow-sm rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl">
                        <DropdownMenuItem onClick={() => onEdit(expense)} className="rounded-xl">
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive focus:text-destructive rounded-xl">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-5 pb-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-2xl bg-destructive/10 text-destructive transition-colors group-hover:bg-destructive/20">
                        <Banknote className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 pr-8">
                        <CardTitle className="text-lg font-black leading-tight tracking-tight truncate group-hover:text-primary transition-colors">
                            {expense.description}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="px-2 py-0.5 rounded-lg bg-muted/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <Tag className="h-2.5 w-2.5" />
                                {expense.category}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 py-2 flex-grow">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/20 px-3 py-2 rounded-xl w-fit border border-border/50">
                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                    <span>{format(safeToDate(expense.expenseDate), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
            </CardContent>

            <CardFooter className="p-5 pt-3 border-t border-white/5 bg-muted/5 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-2xl font-black text-destructive tracking-tighter leading-none">{formatCurrency(expense.amount)}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">Montant décaissé</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(expense)}
                    className="h-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
                >
                    Modifier <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export const ExpenseCard = React.memo(ExpenseCardComponent);
