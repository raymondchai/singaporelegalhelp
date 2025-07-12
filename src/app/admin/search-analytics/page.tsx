'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  MousePointer, 
  BarChart3, 
  Users,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';

interface SearchAnalyticsSummary {
  total_searches: number;
  total_clicks: number;
  click_through_rate: string;
  avg_response_time_ms: number;
  period_days: number;
}

interface PopularQuery {
  query: string;
  search_count: number;
}

interface TrendingQuery {
  query: string;
  current_searches: number;
  previous_searches: number;
  trend_percentage: number;
  trend_direction: string;
}

interface ClickThroughRate {
  query: string;
  total_searches: number;
  total_clicks: number;
  click_through_rate: number;
  avg_position: number;
}

interface PerformanceMetrics {
  avg_response_time_ms: number;
  avg_results_count: number;
  total_searches: number;
  period_days: number;
}

export default function SearchAnalyticsDashboard() {
  const [summary, setSummary] = useState<SearchAnalyticsSummary | null>(null);
  const [popularQueries, setPopularQueries] = useState<PopularQuery[]>([]);
  const [trendingQueries, setTrendingQueries] = useState<TrendingQuery[]>([]);
  const [ctrData, setCtrData] = useState<ClickThroughRate[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryRes, popularRes, trendingRes, ctrRes, performanceRes] = await Promise.all([
        fetch(`/api/search/analytics?type=summary&days=${selectedPeriod}`),
        fetch(`/api/search/analytics?type=popular-queries&days=${selectedPeriod}&limit=10`),
        fetch(`/api/search/analytics?type=trending-queries&days=${selectedPeriod}&limit=10`),
        fetch(`/api/search/analytics?type=click-through-rates&days=${selectedPeriod}&limit=10`),
        fetch(`/api/search/analytics?type=performance&days=${selectedPeriod}`)
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }

      if (popularRes.ok) {
        const data = await popularRes.json();
        setPopularQueries(data.popular_queries || []);
      }

      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setTrendingQueries(data.trending_queries || []);
      }

      if (ctrRes.ok) {
        const data = await ctrRes.json();
        setCtrData(data.click_through_rates || []);
      }

      if (performanceRes.ok) {
        const data = await performanceRes.json();
        setPerformance(data.performance);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const data = {
        summary,
        popular_queries: popularQueries,
        trending_queries: trendingQueries,
        click_through_rates: ctrData,
        performance,
        exported_at: new Date().toISOString(),
        period_days: selectedPeriod
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-analytics-${selectedPeriod}days-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor search performance and user behavior
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          
          <Button
            onClick={loadAnalytics}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatNumber(summary.total_searches) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatNumber(summary.total_clicks) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              Result clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? `${summary.click_through_rate}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average CTR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? `${summary.avg_response_time_ms}ms` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              Search performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Popular Search Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularQueries.length > 0 ? (
                popularQueries.map((query, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate flex-1">
                      {query.query}
                    </span>
                    <Badge variant="secondary">
                      {formatNumber(query.search_count)} searches
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trending Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trending Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendingQueries.length > 0 ? (
                trendingQueries.map((query, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate flex-1">
                      {query.query}
                    </span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(query.trend_direction)}
                      <Badge 
                        variant={query.trend_direction === 'up' ? 'default' : 'secondary'}
                      >
                        {query.trend_percentage > 0 ? '+' : ''}{query.trend_percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Click-Through Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="w-5 h-5" />
            Click-Through Rate Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Query</th>
                  <th className="text-right py-2">Searches</th>
                  <th className="text-right py-2">Clicks</th>
                  <th className="text-right py-2">CTR</th>
                  <th className="text-right py-2">Avg Position</th>
                </tr>
              </thead>
              <tbody>
                {ctrData.length > 0 ? (
                  ctrData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{item.query}</td>
                      <td className="text-right py-2">{formatNumber(item.total_searches)}</td>
                      <td className="text-right py-2">{formatNumber(item.total_clicks)}</td>
                      <td className="text-right py-2">{item.click_through_rate.toFixed(2)}%</td>
                      <td className="text-right py-2">{item.avg_position.toFixed(1)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
