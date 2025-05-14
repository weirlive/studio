
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
      <footer className="py-6 md:px-6 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
           <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} PANW Network Object Creator. Built with fun and GenAI.
          </p>
        </div>
      </footer>
    </div>
  );
}
