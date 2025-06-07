import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import ChatPane from "@/components/chat/ChatPane";
import { MessageSquare } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ora System",
  description: "Context-aware Autonomous Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="p-4 border-b">
          <nav className="flex items-center space-x-4">
            <Link href="/" className="font-bold">Ora System</Link>
            <Link href="/task-executor" className="text-sm text-muted-foreground hover:text-primary">Task Executor</Link>
            <Link href="/system-view" className="text-sm text-muted-foreground hover:text-primary">System View</Link>
            <Link href="/phase-doc" className="text-sm text-muted-foreground hover:text-primary">Phase Document</Link>
            <Link href="/planning" className="text-sm text-muted-foreground hover:text-primary">Task Board</Link>
          </nav>
        </header>
        <main>{children}</main>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon" className="fixed bottom-8 right-8 rounded-full h-14 w-14 shadow-lg">
              <MessageSquare className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh] flex flex-col">
            <div className="flex-1 p-4">
              <ChatPane 
                scope="workstream" 
                params={{ name: 'roadmap' }} 
                title="Workstream: Roadmap" 
              />
            </div>
          </DrawerContent>
        </Drawer>
      </body>
    </html>
  );
} 