'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const ToastProvider = dynamic(
  () => import('./toast').then(mod => ({ default: mod.ToastProvider })),
  {
    ssr: false,
    loading: () => null
  }
);

interface ToastProviderWrapperProps {
  children: ReactNode;
}

export function ToastProviderWrapper({ children }: ToastProviderWrapperProps) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
} 