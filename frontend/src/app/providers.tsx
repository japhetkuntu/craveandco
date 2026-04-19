'use client';

import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ui/toast';
import { ReactNode, useEffect } from 'react';

function ViewportHeightProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ViewportHeightProvider>{children}</ViewportHeightProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
