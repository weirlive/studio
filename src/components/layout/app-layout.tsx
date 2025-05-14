
import type { PropsWithChildren } from 'react';
import Link from 'next/link';
import { Home, Aperture } from 'lucide-react';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">PANW Network Object Creator</h1>
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1">
              <Home size={16} />
              Home
            </Link>
            <Link href="/apps" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1">
              <Aperture size={16} />
              Apps
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-12 md:px-6">
        {children}
      </main>
      <footer className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4 md:px-6 text-center text-sm">
          © {new Date().getFullYear()} PANW Network Object Creator. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
