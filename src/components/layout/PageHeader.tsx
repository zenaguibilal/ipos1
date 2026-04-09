'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <header className={cn("flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center", className)}>
            <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-primary leading-tight">
                    {title}
                </h1>
                <p className="text-[9px] font-black text-muted-foreground/60 tracking-wider uppercase flex items-center gap-2">
                    <span className="h-0.5 w-4 bg-primary/30 rounded-full" />
                    {description}
                </p>
            </div>
            {children && (
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                    {children}
                 </div>
            )}
        </header>
    );
}
