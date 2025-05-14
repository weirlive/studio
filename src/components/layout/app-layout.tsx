import type { PropsWithChildren } from 'react';
import Image from 'next/image';
import { Network } from 'lucide-react';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Image 
              src="https://placehold.co/40x40.png" 
              alt="Cat Logo" 
              width={40} 
              height={40} 
              className="rounded-full"
              data-ai-hint="cat"
            />
            <h1 className="text-2xl font-bold tracking-tight">PANW Network Object Creator</h1>
          </div>
          {/* Placeholder for potential future nav items or user profile */}
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-12 md:px-6"> {/* Increased py-8 to py-12 */}
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
