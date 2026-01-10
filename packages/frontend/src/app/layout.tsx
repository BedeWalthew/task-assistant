import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Task Assistant",
  description: "AI Powered Task Manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen flex flex-col">
            <header className="border-b" data-testid="header">
              <div className="mx-auto max-w-5xl w-full px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-xl font-semibold" data-testid="header-brand">
                  Task Assistant
                </Link>
                <nav className="flex items-center gap-4 text-sm font-medium">
                  <Link href="/projects" className="hover:underline" data-testid="nav-projects">
                    Projects
                  </Link>
                  <Link href="/tickets" className="hover:underline" data-testid="nav-tickets">
                    Tickets
                  </Link>
                </nav>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
          <SonnerToaster />
        </QueryProvider>
      </body>
    </html>
  );
}
