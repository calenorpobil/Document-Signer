'use client';

import { MetaMaskProvider } from '../contexts/MetaMaskContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MetaMaskProvider>
      {children}
    </MetaMaskProvider>
  );
}