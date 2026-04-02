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
        <header className={cn("flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center mb-8", className)}>
            <div className="space-y-1.5">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-primary">
                    {title}
                </h1>
                <p className="text-sm font-medium text-muted-foreground/80 tracking-wide uppercase flex items-center gap-2">
                    <span className="h-1 w-8 bg-primary/30 rounded-full" />
                    {description}
                </p>
            </div>
            {children && (
                 <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
                    {children}
                 </div>
            )}
        </header>
    );
}