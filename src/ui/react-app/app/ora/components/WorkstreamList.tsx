'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Briefcase, Calendar, Target, ChevronRight, Plus } from 'lucide-react';

interface Workstream {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  constitution?: {
    vision: string;
    mission: string;
    cadence: string;
    okrs?: Array<{
      objective: string;
      keyResults: string[];
    }>;
    kpis?: string[];
  };
}

export default function WorkstreamList() {
  const [workstreams, setWorkstreams] = useState<Workstream[]>([]);
  const [selectedWorkstream, setSelectedWorkstream] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkstreams();

    // Listen for workstream creation events
    const handleWorkstreamCreated = () => {
      fetchWorkstreams();
    };

    window.addEventListener('workstream-created', handleWorkstreamCreated);
    return () => {
      window.removeEventListener('workstream-created', handleWorkstreamCreated);
    };
  }, []);

  const fetchWorkstreams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ora/workstreams');
      if (response.ok) {
        const data = await response.json();
        setWorkstreams(data.workstreams || []);
      }
    } catch (error) {
      console.error('Failed to fetch workstreams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkstreamClick = (workstreamId: string) => {
    setSelectedWorkstream(selectedWorkstream === workstreamId ? null : workstreamId);
  };

  const startNewWorkstream = () => {
    // Dispatch event to send message to chat
    window.dispatchEvent(new CustomEvent('ora-send-message', {
      detail: { message: 'I want to create a new workstream' }
    }));
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Your Workstreams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Your Workstreams
          </div>
          <Badge variant="secondary">{workstreams.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <Button 
          onClick={startNewWorkstream}
          className="mb-4 w-full"
          size="default"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Workstream
        </Button>
        <ScrollArea className="flex-1 pr-4">
          {workstreams.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No workstreams yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click below to get started
              </p>
              <Button 
                onClick={startNewWorkstream}
                className="mt-4"
                size="default"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workstream
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workstreams.map((workstream) => (
                <div key={workstream.id} className="space-y-2">
                  <div
                    className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleWorkstreamClick(workstream.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{workstream.name}</h4>
                        {workstream.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {workstream.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Created {new Date(workstream.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 mt-1 transition-transform ${
                          selectedWorkstream === workstream.id ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {selectedWorkstream === workstream.id && workstream.constitution && (
                    <div className="ml-4 p-4 bg-muted rounded-lg space-y-3 text-sm">
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Target className="w-3 h-3" />
                          <span className="font-medium">Vision</span>
                        </div>
                        <p>{workstream.constitution.vision}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Briefcase className="w-3 h-3" />
                          <span className="font-medium">Mission</span>
                        </div>
                        <p>{workstream.constitution.mission}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Calendar className="w-3 h-3" />
                          <span className="font-medium">Cadence</span>
                        </div>
                        <p>{workstream.constitution.cadence}</p>
                      </div>

                      {workstream.constitution.okrs && workstream.constitution.okrs.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">OKRs</span>
                          {workstream.constitution.okrs.map((okr, i) => (
                            <div key={i} className="mt-2">
                              <p className="font-medium">{okr.objective}</p>
                              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                                {okr.keyResults.map((kr, j) => (
                                  <li key={j}>{kr}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {workstream.constitution.kpis && workstream.constitution.kpis.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">KPIs</span>
                          <ul className="list-disc list-inside mt-1">
                            {workstream.constitution.kpis.map((kpi, i) => (
                              <li key={i}>{kpi}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}