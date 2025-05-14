import type {Metadata} from 'next';
// import { GeistSans } from 'geist/font/sans'; // Removed
// import { GeistMono } from 'geist/font/mono'; // Removed
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// const geistSans = GeistSans; // Removed
// const geistMono = GeistMono; // Removed

export const metadata: Metadata = {
  title: 'PANW Network Object Creator',
  description: 'Network Object Configuration Generator for Palo Alto Networks',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased"> {/* Updated className to remove Geist variables */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
