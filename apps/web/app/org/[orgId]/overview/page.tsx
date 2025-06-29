'use client';

import { useAppStore } from '@lib/stores/app-store';
import { useSession } from '@lib/auth-client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Plus,
  ArrowUpRight,
  DollarSign,
  Database,
  ChevronDown,
  RefreshCw,
  Calendar,
  FileText,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OverviewPageProps {
  params: Promise<{ orgId: string }>;
}

interface WarehouseData {
  id: string;
  name: string;
  date: string;
  amount: number;
  source: string;
  dataType: string;
  categoryLevel1?: string;
  categoryLevel2?: string;
}

interface DataSource {
  source: string;
  count: number;
  totalAmount: number;
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { orgId } = await params;
  
  return <OverviewContent orgId={orgId} />;
}

function OverviewContent({ orgId }: { orgId: string }) {
  const { data: session } = useSession();
  const { currentOrg, switchOrganization } = useAppStore();
  const router = useRouter();
  
  // Warehouse data state
  const [warehouseData, setWarehouseData] = useState<WarehouseData[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedDataType, setSelectedDataType] = useState('all');
  const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    // If no current org or org doesn't match URL, redirect to org selection
    if (!currentOrg || currentOrg.id !== orgId) {
      router.push('/org/select');
      return;
    }

    // Load warehouse data when org is available
    if (currentOrg && currentOrg.id === orgId) {
      loadWarehouseData();
    }
  }, [session, currentOrg, orgId, router]);

  const loadWarehouseData = async () => {
    setIsLoadingWarehouse(true);
    try {
      // Load data sources summary
      const warehouseResponse = await fetch(`/api/data/warehouse?orgId=${orgId}`);
      if (warehouseResponse.ok) {
        const warehouseData = await warehouseResponse.json();
        setDataSources(warehouseData.sources || []);
      }

      // Load recent warehouse data
      const dataResponse = await fetch(`/api/data/warehouse/items?orgId=${orgId}&limit=10`);
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        setWarehouseData(data.items || []);
      }
    } catch (error) {
      console.error('Error loading warehouse data:', error);
    } finally {
      setIsLoadingWarehouse(false);
    }
  };

  const loadFilteredWarehouseData = async () => {
    setIsLoadingWarehouse(true);
    try {
      let url = `/api/data/warehouse/items?orgId=${orgId}&limit=10`;
      if (selectedSource !== 'all') {
        url += `&source=${selectedSource}`;
      }
      if (selectedDataType !== 'all') {
        url += `&dataType=${selectedDataType}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setWarehouseData(data.items || []);
      }
    } catch (error) {
      console.error('Error loading filtered warehouse data:', error);
    } finally {
      setIsLoadingWarehouse(false);
    }
  };

  useEffect(() => {
    if (currentOrg && currentOrg.id === orgId) {
      loadFilteredWarehouseData();
    }
  }, [selectedSource, selectedDataType]);

  if (!session?.user || !currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mock data for demo - in real app, this would come from API
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      change: '+20.1% from last month',
      icon: DollarSign,
      trend: 'up'
    },
    {
      title: 'Active Integrations',
      value: '3',
      change: '+1 new this month',
      icon: BarChart3,
      trend: 'up'
    },
    {
      title: 'Team Members',
      value: '12',
      change: '+2 new this week',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Budget Utilization',
      value: '73%',
      change: '+5% from last month',
      icon: TrendingUp,
      trend: 'up'
    }
  ];

  const recentActivities = [
    { action: 'Connected Plaid integration', user: 'John Doe', time: '2 hours ago' },
    { action: 'Created new budget scenario', user: 'Jane Smith', time: '4 hours ago' },
    { action: 'Invited new team member', user: 'Mike Johnson', time: '1 day ago' },
    { action: 'Updated QuickBooks sync', user: 'Sarah Wilson', time: '2 days ago' }
  ];

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'csv':
        return Upload;
      case 'google_sheets':
        return FileText;
      case 'plaid':
        return DollarSign;
      case 'acuity':
        return Calendar;
      default:
        return Database;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'csv':
        return 'bg-blue-100 text-blue-800';
      case 'google_sheets':
        return 'bg-green-100 text-green-800';
      case 'plaid':
        return 'bg-purple-100 text-purple-800';
      case 'acuity':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {currentOrg.name} Overview
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back! Here's what's happening with your organization.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Integration
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-card rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <ArrowUpRight className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-sm text-green-400">{stat.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => currentOrg?.id && router.push(`/org/${currentOrg.id}/integrations`)}
                className="p-4 border-2 border-border rounded-lg hover:border-primary/50 hover:bg-primary/10 transition-colors text-left"
              >
                <BarChart3 className="w-8 h-8 text-primary mb-2" />
                <p className="font-medium text-foreground">Connect Integration</p>
                <p className="text-sm text-muted-foreground">Add new data sources</p>
              </button>
              
              <button 
                onClick={() => currentOrg?.id && router.push(`/org/${currentOrg.id}/budgets`)}
                className="p-4 border-2 border-border rounded-lg hover:border-primary/50 hover:bg-primary/10 transition-colors text-left"
              >
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <p className="font-medium text-foreground">Create Budget</p>
                <p className="text-sm text-muted-foreground">Plan your finances</p>
              </button>
              
              <button 
                onClick={() => currentOrg?.id && router.push(`/org/${currentOrg.id}/scenarios`)}
                className="p-4 border-2 border-border rounded-lg hover:border-primary/50 hover:bg-primary/10 transition-colors text-left"
              >
                <BarChart3 className="w-8 h-8 text-primary mb-2" />
                <p className="font-medium text-foreground">New Scenario</p>
                <p className="text-sm text-muted-foreground">Model different outcomes</p>
              </button>
              
              <button 
                onClick={() => currentOrg?.id && router.push(`/org/${currentOrg.id}/invitations`)}
                className="p-4 border-2 border-border rounded-lg hover:border-primary/50 hover:bg-primary/10 transition-colors text-left"
              >
                <Users className="w-8 h-8 text-primary mb-2" />
                <p className="font-medium text-foreground">Invite Team</p>
                <p className="text-sm text-muted-foreground">Add team members</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">by {activity.user}</p>
                    <p className="text-xs text-muted-foreground/80">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Warehouse Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Warehouse
                  </CardTitle>
                  <CardDescription>
                    Recent data from your warehouse with filtering options
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/org/${orgId}/data/warehouse`)}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {dataSources.map((source) => (
                      <SelectItem key={source.source} value={source.source.toLowerCase()}>
                        {source.source.replace('_', ' ')} ({source.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="actual">Actual</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="forecast">Forecast</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={loadWarehouseData} 
                  variant="outline" 
                  size="icon"
                  disabled={isLoadingWarehouse}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingWarehouse ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Data Table */}
              {isLoadingWarehouse ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : warehouseData.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No data found</p>
                  <p className="text-sm text-muted-foreground">
                    Upload some data to get started
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouseData.map((item) => {
                        const Icon = getSourceIcon(item.source);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name.length > 40 
                                ? `${item.name.substring(0, 40)}...` 
                                : item.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <Badge className={getSourceColor(item.source)}>
                                  {item.source.replace('_', ' ')}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.dataType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(item.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              <span className={item.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                ${Math.abs(item.amount).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {item.categoryLevel1 && (
                                  <div>{item.categoryLevel1}</div>
                                )}
                                {item.categoryLevel2 && (
                                  <div className="text-muted-foreground text-xs">
                                    → {item.categoryLevel2}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Organization Info */}
        <div className="mt-8 bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Organization Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="text-sm font-medium capitalize">{currentOrg.subscriptionPlan}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Currency</span>
                <span className="text-sm font-medium uppercase">{currentOrg.currency}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium capitalize">{currentOrg.userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 