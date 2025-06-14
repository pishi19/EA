'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, TrendingUp, Lightbulb, Target, Calendar, BarChart, Briefcase } from 'lucide-react';

interface Pattern {
  id: string;
  pattern_type: string;
  pattern_content: string;
  examples?: string[];
  occurrence_count: number;
  last_observed?: string;
}

interface GroupedPatterns {
  [key: string]: Pattern[];
}

const patternIcons: Record<string, any> = {
  vision_template: Target,
  mission_template: Briefcase,
  cadence_suggestion: Calendar,
  successful_interaction: TrendingUp,
  workstream_type: Lightbulb,
  okr_template: BarChart,
  kpi_suggestion: BarChart,
};

const patternLabels: Record<string, string> = {
  vision_template: 'Vision Templates',
  mission_template: 'Mission Templates',
  cadence_suggestion: 'Cadence Suggestions',
  successful_interaction: 'Successful Patterns',
  workstream_type: 'Workstream Types',
  okr_template: 'OKR Templates',
  kpi_suggestion: 'KPI Suggestions',
};

export default function OraPatterns() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [groupedPatterns, setGroupedPatterns] = useState<GroupedPatterns>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchPatterns();
    // Refresh patterns every 30 seconds
    const interval = setInterval(fetchPatterns, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPatterns = async () => {
    try {
      const response = await fetch('/api/ora/patterns?limit=50');
      if (response.ok) {
        const data = await response.json();
        setPatterns(data.patterns || []);
        setGroupedPatterns(data.grouped || {});
      }
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Learning Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const patternTypes = Object.keys(groupedPatterns);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Learning Patterns
          </div>
          <Badge variant="secondary">{patterns.length} patterns</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {patternTypes.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No patterns learned yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ora learns from successful workstream creations
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {patternTypes.map((type) => {
                const Icon = patternIcons[type] || Brain;
                const count = groupedPatterns[type].length;
                const totalOccurrences = groupedPatterns[type].reduce(
                  (sum, p) => sum + p.occurrence_count,
                  0
                );

                return (
                  <div
                    key={type}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedType === type
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedType(selectedType === type ? null : type)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {patternLabels[type] || type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {count} patterns • {totalOccurrences} uses
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedType && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  {React.createElement(patternIcons[selectedType] || Brain, {
                    className: 'w-4 h-4',
                  })}
                  {patternLabels[selectedType] || selectedType}
                </h4>
                <ScrollArea className="h-64">
                  <div className="space-y-3 pr-4">
                    {groupedPatterns[selectedType].map((pattern) => (
                      <div
                        key={pattern.id}
                        className="p-3 bg-background rounded-lg border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {pattern.pattern_content}
                            </p>
                            {pattern.examples && pattern.examples.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">
                                  Examples:
                                </p>
                                <ul className="space-y-1">
                                  {pattern.examples.map((example, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0"
                                    >
                                      {example}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-3">
                            <Badge variant="secondary" className="text-xs">
                              {pattern.occurrence_count}x
                            </Badge>
                            {pattern.last_observed && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(pattern.last_observed).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}