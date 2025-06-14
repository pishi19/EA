'use client';

import OraChat from './components/OraChat';
import WorkstreamList from './components/WorkstreamList';
import OraPatterns from './components/OraPatterns';
import OraPnL from './components/OraPnL';

export default function OraPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ora - Workstream Creation Assistant</h1>
        <p className="text-muted-foreground">
          I'll help you create and manage workstreams with clear vision, mission, and cadence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workstreams List */}
        <div className="lg:col-span-1">
          <div className="h-[600px]">
            <WorkstreamList />
          </div>
        </div>

        {/* Ora Conversation */}
        <div className="lg:col-span-2">
          <div className="h-[600px] overflow-hidden">
            <OraChat />
          </div>
        </div>
      </div>

      {/* Learning Patterns and P&L */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <OraPatterns />
        </div>
        <div>
          <OraPnL />
        </div>
      </div>
    </div>
  );
}