'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Target, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            🤖 Ora System
          </h1>
          <p className="text-xl text-muted-foreground">
            Multi-Workstream Platform for Context-Aware Autonomous Operations
          </p>
        </div>
        
        <div className="flex justify-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Multi-Tenant Architecture
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Workstream Isolation
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Context-Aware AI
          </Badge>
        </div>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transform from single-tenant monolith to scalable multi-workstream platform. 
          Each workstream operates with complete isolation, dedicated roadmaps, and context-aware AI assistance.
        </p>
      </div>

      {/* Workstream Selection */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Select Your Workstream</h2>
          <p className="text-muted-foreground">
            Each workstream provides isolated environments with dedicated roadmaps, artefacts, and AI context
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ora System Workstream */}
          <Card className="relative overflow-hidden border-blue-200 hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="text-3xl">🤖</div>
                <Badge className="bg-blue-100 text-blue-800">Active</Badge>
              </div>
              <CardTitle className="text-xl">Ora System</CardTitle>
              <p className="text-sm text-muted-foreground">
                Context-aware autonomous agent - Core system development and architecture
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Focus:</span>
                  <span className="font-medium">AI & Automation</span>
                </div>
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="font-medium">System Team</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase:</span>
                  <span className="font-medium">11 - Filtering & Hierarchy</span>
                </div>
              </div>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/workstream/ora">
                  Enter Ora Workstream
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Mecca Project Workstream */}
          <Card className="relative overflow-hidden border-green-200 hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="text-3xl">🏛️</div>
                <Badge className="bg-yellow-100 text-yellow-800">Planning</Badge>
              </div>
              <CardTitle className="text-xl">Mecca Project</CardTitle>
              <p className="text-sm text-muted-foreground">
                Strategic business development initiative with market analysis and planning
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Focus:</span>
                  <span className="font-medium">Business Development</span>
                </div>
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="font-medium">Business Team</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase:</span>
                  <span className="font-medium">1 - Foundation & Planning</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50">
                <Link href="/workstream/mecca">
                  Enter Mecca Workstream
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Sales & Marketing Workstream */}
          <Card className="relative overflow-hidden border-purple-200 hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="text-3xl">📈</div>
                <Badge className="bg-yellow-100 text-yellow-800">Planning</Badge>
              </div>
              <CardTitle className="text-xl">Sales & Marketing</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customer acquisition and marketing operations with revenue focus
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Focus:</span>
                  <span className="font-medium">Revenue Growth</span>
                </div>
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="font-medium">Revenue Team</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase:</span>
                  <span className="font-medium">1 - Customer Acquisition</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full border-purple-600 text-purple-700 hover:bg-purple-50">
                <Link href="/workstream/sales">
                  Enter Sales Workstream
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="mt-16 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Multi-Workstream Architecture</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Each workstream operates as an isolated domain with dedicated data, roadmaps, and AI context. 
            The platform provides complete multi-tenant capabilities with workstream-aware routing and operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Isolated Workstreams</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>• Complete data isolation</li>
                <li>• Per-workstream roadmaps</li>
                <li>• Dedicated artefact directories</li>
                <li>• Workstream-scoped permissions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Context-Aware AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>• Workstream-specific LLM context</li>
                <li>• Domain-aware chat assistance</li>
                <li>• Contextual recommendations</li>
                <li>• Isolated memory traces</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span>Scalable Platform</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>• URL routing: /workstream/&#123;name&#125;/</li>
                <li>• Dynamic workstream detection</li>
                <li>• Multi-tenant API layer</li>
                <li>• Cross-workstream navigation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Legacy Access */}
      <div className="mt-16 p-6 bg-muted/30 rounded-lg border border-dashed">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium">Legacy System Access</h3>
          <p className="text-sm text-muted-foreground">
            Backwards compatibility maintained for existing workflows. 
            Legacy routes automatically redirect to the default Ora workstream.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/planning">Legacy Planning</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/workstream-filter-demo">Legacy Workstream</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/semantic-chat-classic">Legacy Chat</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 