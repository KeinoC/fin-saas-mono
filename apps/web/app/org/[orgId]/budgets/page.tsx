import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, Target, TrendingUp } from 'lucide-react';

export default function BudgetsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600 mt-2">Create and manage your financial budgets and forecasts</p>
        </div>
        <Button disabled>
          Create Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-blue-500" />
              Budget Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Set financial targets and track performance against your goals. Create detailed budgets by category and time period.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-green-500" />
              Multi-Period Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Plan budgets for monthly, quarterly, and annual periods. Compare actuals vs. budget with variance analysis.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-purple-500" />
              Forecasting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Generate forecasts based on historical data and trends. Adjust projections with scenario planning.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget Creation & Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create detailed budget templates</li>
                <li>• Set budget categories and line items</li>
                <li>• Define budget periods and cycles</li>
                <li>• Copy and modify existing budgets</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Analysis & Reporting</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Budget vs. actual variance analysis</li>
                <li>• Visual budget performance dashboards</li>
                <li>• Automated budget alerts and notifications</li>
                <li>• Export budget reports and summaries</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Budget Management Coming Soon</h3>
            <p className="text-blue-700 mt-1">
              We're working on comprehensive budget planning and forecasting tools. 
              Stay tuned for updates on this feature!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 