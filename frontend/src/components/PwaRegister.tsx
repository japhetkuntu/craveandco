'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          console.log('Crave & Co PWA service worker registered');
        })
        .catch((error) => {
          console.warn('PWA service worker failed to register:', error);
        });
    }
  }, []);

  return null;
}
