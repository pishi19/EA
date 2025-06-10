/**
 * Ora System Layout - Canonical UI Protocol (Task 12.8.2)
 * 
 * Navigation streamlined to three core workflow pages:
 * 1. Planning (/planning) - Task Board for project planning and management
 * 2. Workstream (/workstream-filter-demo) - Unified artefact view with roadmap filtering and chat
 * 3. Contextual Chat (/semantic-chat-classic) - Context-aware chat architecture
 * 
 * Archived pages (preserved in codebase for audit):
 * - task-executor, system-view, contextual-chat-demo, system-docs, phase-doc
 * 
 * Protocol Benefits: Simplified navigation, clear workflow progression, focused UX
 */

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
            {/* Canonical UI Protocol - Three Core Workflows */}
            <Link href="/planning" className="text-sm text-muted-foreground hover:text-primary">Planning</Link>
            <Link href="/workstream-filter-demo" className="text-sm text-muted-foreground hover:text-primary">Workstream</Link>
            <Link href="/semantic-chat-classic" className="text-sm text-muted-foreground hover:text-primary">Contextual Chat</Link>
            {/* Legacy pages archived: task-executor, system-view, contextual-chat-demo, system-docs, phase-doc */}
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
                contextType="phase" 
                contextId="roadmap" 
                title="Workstream: Roadmap" 
              />
            </div>
          </DrawerContent>
        </Drawer>
      </body>
    </html>
  );
} 