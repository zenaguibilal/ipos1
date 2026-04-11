import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4', className)}>
            <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-foreground truncate">{title}</h1>
                {description && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2 shrink-0">{children}</div>
            )}
        </div>
    );
}
