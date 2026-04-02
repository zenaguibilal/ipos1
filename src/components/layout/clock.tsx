'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export function Clock() {
  const [isMounted, setIsMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Return a stable placeholder on the server and first client render
  if (!isMounted || !time) {
    return (
      <div className="hidden sm:flex items-center h-6 w-[240px]">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center text-base font-medium text-foreground h-6 w-[240px] animate-in fade-in duration-500">
      <span>{format(time, 'd MMMM yyyy, HH:mm:ss', { locale: fr })}</span>
    </div>
  );
}
