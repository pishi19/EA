'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, MessageSquare, FolderOpen, Brain } from 'lucide-react'

export default function OraPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-4xl font-bold">Ora</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Your intelligent guide for creating well-structured workstreams with strong foundations for success.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Workstreams */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Workstreams
              </CardTitle>
              <CardDescription>
                Your active workstreams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No workstreams yet. Start a conversation with Ora to create your first one!
                </p>
                <Button className="w-full" variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create New Workstream
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Ora Conversation */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Ora Conversation
              </CardTitle>
              <CardDescription>
                Chat with Ora to create and refine your workstreams
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Conversation Area */}
              <div className="flex-1 border rounded-lg p-4 mb-4 bg-muted/30">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Ora</p>
                    <p className="text-sm">
                      Hello! I'm Ora, your guide for creating successful workstreams. 
                      I'll help you define a clear vision, mission, and cadence for your team's work.
                    </p>
                    <p className="text-sm mt-2">
                      Would you like to create a new workstream? Click the button below to get started!
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button className="flex-1" variant="default">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create New Workstream
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Patterns */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Ora's Learning
            </CardTitle>
            <CardDescription>
              Patterns and insights Ora has learned to help you better
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              As you create workstreams, Ora will learn patterns to provide better suggestions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}