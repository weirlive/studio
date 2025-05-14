
import type { PropsWithChildren } from 'react';
import Image from 'next/image';
import { Network } from 'lucide-react';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header removed */}
      <main className="flex-grow container mx-auto px-4 py-12 md:px-6">
        {children}
      </main>
      {/* Footer removed */}
    </div>
  );
}
