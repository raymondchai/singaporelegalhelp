// src/app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  CreditCard,
  Target,
  AlertCircle,
  BarChart3,
  Shield
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';

interface RevenueMetrics {
  mrr_sgd: number;
  arr_sgd: number;
  total_revenue_sgd: number;
  total_customers: number;
  new_customers: number;
  churned_customers: number;
  customer_growth_rate: number;
  avg_revenue_per_user: number;
  customer_lifetime_value: number;
  churn_rate: number;
  tier_breakdown: {
    free: number;
    basic_individual: number;
    premium_individual: number;
    professional: number;
    enterprise: number;
  };
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  customers: number;
  mrr: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to access admin dashboard');
        setLoading(false);
        return;
      }

      // Check admin role
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select(`
          role,
          is_active,
          permissions
        `)
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (!adminRole || !adminRole.is_active) {
        setError('Admin access required. Contact system administrator.');
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchAdminAnalytics();
    } catch (err) {
      console.error('Admin access check error:', err);
      setError('Failed to verify admin access');
      setLoading(false);
    }
  };

  const fetchAdminAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Fetch revenue metrics
      const metricsResponse = await fetch('/api/admin/analytics/revenue', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch monthly data
      const monthlyResponse = await fetch('/api/admin/analytics/monthly', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!metricsResponse.ok || !monthlyResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const metricsData = await metricsResponse.json();
      const monthlyData = await monthlyResponse.json();
      
      setMetrics(metricsData);
      setMonthlyData(monthlyData);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error || 'Access denied'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const tierColors = {
    free: '#8884d8',
    basic_individual: '#82ca9d', 
    premium_individual: '#ffc658',
    professional: '#ff7c7c',
    enterprise: '#8dd1e1'
  };

  const tierData = [
    { name: 'Free', value: metrics.tier_breakdown.free, color: tierColors.free },
    { name: 'Basic Individual', value: metrics.tier_breakdown.basic_individual, color: tierColors.basic_individual },
    { name: 'Premium Individual', value: metrics.tier_breakdown.premium_individual, color: tierColors.premium_individual },
    { name: 'Professional', value: metrics.tier_breakdown.professional, color: tierColors.professional },
    { name: 'Enterprise', value: metrics.tier_breakdown.enterprise, color: tierColors.enterprise },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-red-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Revenue analytics and business intelligence</p>
          </div>
          <Badge variant="destructive" className="text-sm">
            🔒 Admin Access
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customer Metrics</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="growth">Growth Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">S${metrics.mrr_sgd.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{metrics.customer_growth_rate.toFixed(1)}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">S${metrics.arr_sgd.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  MRR × 12 projection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">S${metrics.total_revenue_sgd.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  All-time revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">S${metrics.avg_revenue_per_user.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  Per paying customer
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`S$${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_customers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Active subscribers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.new_customers}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">S${metrics.customer_lifetime_value.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  Projected CLV
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.churn_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Monthly churn
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          {/* Subscription Tier Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tierData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({name, percent}) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {tierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tierData.map((tier) => (
                  <div key={tier.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tier.color }}
                      />
                      <span className="font-medium">{tier.name}</span>
                    </div>
                    <Badge variant="outline">{tier.value} users</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          {/* Growth Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="customers" stroke="#8884d8" name="Total Customers" />
                  <Line type="monotone" dataKey="mrr" stroke="#82ca9d" name="MRR (S$)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}