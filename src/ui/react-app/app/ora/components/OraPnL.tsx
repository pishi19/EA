'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react';

interface PnLData {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  trend: 'up' | 'down' | 'neutral';
  lastUpdated: string;
}

export default function OraPnL() {
  const [pnlData, setPnLData] = useState<PnLData>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    margin: 0,
    trend: 'neutral',
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulated data for now - replace with actual API call
    setTimeout(() => {
      setPnLData({
        revenue: 125000,
        expenses: 87500,
        profit: 37500,
        margin: 30,
        trend: 'up',
        lastUpdated: new Date().toISOString()
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            P&L Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            P&L Summary
          </div>
          <Badge variant={pnlData.trend === 'up' ? 'default' : 'secondary'}>
            {pnlData.trend === 'up' ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : pnlData.trend === 'down' ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : (
              <BarChart2 className="w-3 h-3 mr-1" />
            )}
            {pnlData.margin}% margin
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Revenue */}
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Revenue</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(pnlData.revenue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Expenses */}
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Expenses</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {formatCurrency(pnlData.expenses)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Profit</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(pnlData.profit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {pnlData.margin}% margin
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {new Date(pnlData.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 