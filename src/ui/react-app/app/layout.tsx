/**
 * Ora System Layout - Multi-Workstream Architecture (Task 12.9)
 * 
 * Updated navigation structure to support multi-workstream platform:
 * 1. Legacy routes maintained for backwards compatibility
 * 2. New workstream-based navigation (/workstream/{name}/)
 * 3. Workstream switcher for easy navigation between domains
 * 4. Canonical three-page workflow preserved within each workstream
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import ChatPane from "@/components/chat/ChatPane";
import { MessageSquare, Calendar, Settings, List, FileText } from "lucide-react";
import { WorkstreamProvider } from "@/lib/workstream-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ora System | Multi-Workstream Platform",
  description: "Context-aware Autonomous Agent with Multi-Workstream Architecture",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WorkstreamProvider defaultWorkstream="ora">
          <div className="min-h-screen bg-background">
            {/* Global Header with Multi-Workstream Navigation */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  {/* Main Brand */}
                  <div className="flex items-center space-x-4">
                    <Link href="/" className="text-xl font-bold">
                      🤖 Ora System
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      Multi-Workstream Platform
                    </span>
                  </div>

                  {/* Legacy Navigation (for backwards compatibility) */}
                  <nav className="hidden md:flex items-center space-x-6">
                    <Link 
                      href="/planning" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center space-x-1"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Planning</span>
                    </Link>
                    <Link 
                      href="/workstream-filter-demo" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center space-x-1"
                    >
                      <List className="h-4 w-4" />
                      <span>Workstream</span>
                    </Link>
                    {/* Removed: semantic-chat-classic - redundant with comprehensive workstream page */}
                    <Link 
                      href="/system-docs" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center space-x-1"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Docs</span>
                    </Link>
                    <Link 
                      href="/admin" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center space-x-1"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </nav>

                  {/* Workstream Switcher */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Workstreams:</span>
                    <div className="flex space-x-1">
                      <Link 
                        href="/workstream/ora"
                        className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium"
                        title="Ora System - Core development"
                      >
                        🤖 Ora
                      </Link>
                      <Link 
                        href="/workstream/mecca"
                        className="px-3 py-1 text-xs rounded bg-green-100 text-green-800 hover:bg-green-200 font-medium"
                        title="Mecca Project - Business development"
                      >
                        🏛️ Mecca
                      </Link>
                      <Link 
                        href="/workstream/sales"
                        className="px-3 py-1 text-xs rounded bg-purple-100 text-purple-800 hover:bg-purple-200 font-medium"
                        title="Sales & Marketing - Customer acquisition"
                      >
                        📈 Sales
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main>
              {children}
            </main>

            {/* Multi-Workstream Footer */}
            <footer className="border-t bg-muted/10 mt-12">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">🤖 Ora System</h3>
                    <p className="text-sm text-muted-foreground">
                      Context-aware autonomous agent with multi-workstream architecture
                    </p>
                    <Link href="/workstream/ora" className="text-xs text-blue-600 hover:underline">
                      View Ora Workstream →
                    </Link>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">🏛️ Mecca Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Strategic business development initiative
                    </p>
                    <Link href="/workstream/mecca" className="text-xs text-green-600 hover:underline">
                      View Mecca Workstream →
                    </Link>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">📈 Sales & Marketing</h3>
                    <p className="text-sm text-muted-foreground">
                      Customer acquisition and marketing operations
                    </p>
                    <Link href="/workstream/sales" className="text-xs text-purple-600 hover:underline">
                      View Sales Workstream →
                    </Link>
                  </div>
                </div>
                <div className="border-t pt-4 mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Multi-Workstream Architecture | Project 12.9 Implementation | 
                    <Link href="/workstream/ora/admin" className="hover:underline ml-1">
                      Admin Panel
                    </Link>
                  </p>
                </div>
              </div>
            </footer>
          </div>
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
        </WorkstreamProvider>
      </body>
    </html>
  );
} 