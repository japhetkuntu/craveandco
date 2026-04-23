'use client';

import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ui/toast';
import { ReactNode } from 'react';
import { useVirtualKeyboard } from '@/hooks/useVirtualKeyboard';

function ViewportHeightProvider({ children }: { children: ReactNode }) {
  useVirtualKeyboard();
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
