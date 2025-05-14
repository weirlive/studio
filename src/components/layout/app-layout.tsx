
import type { PropsWithChildren } from 'react';
import Link from 'next/link';
import { Home, Aperture, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">WeirLive</h1>
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1">
              <Home size={16} />
              Home
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1 px-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <Aperture size={16} />
                  Apps
                  <ChevronDown size={16} className="ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-primary text-primary-foreground border-primary-foreground/20 w-56">
                <DropdownMenuItem asChild>
                  <Link href="/apps" className="cursor-pointer hover:!bg-primary-foreground/10 focus:!bg-primary-foreground/10 flex items-center gap-2">
                    {/* Using an inline SVG for a generic network icon as an example, replace if you have a specific one */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                      <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                      <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                      <path d="M12 12V8"></path>
                    </svg>
                    Network Object Creator
                  </Link>
                </DropdownMenuItem>
                {/* Subnet Calculator link removed */}
                {/* Add more DropdownMenuItems here for other apps in the future */}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-12 md:px-6">
        {children}
      </main>
      <footer className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4 md:px-6 text-center text-sm">
          © {new Date().getFullYear()} WeirLive. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
