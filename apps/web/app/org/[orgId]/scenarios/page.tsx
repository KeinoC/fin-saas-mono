import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileBarChart, GitBranch, Calculator, Zap } from 'lucide-react';

export default function ScenariosPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scenarios</h1>
          <p className="text-gray-600 mt-2">Create and compare different financial scenarios and what-if analyses</p>
        </div>
        <Button disabled>
          Create Scenario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GitBranch className="mr-2 h-5 w-5 text-blue-500" />
              What-If Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Create multiple scenarios to test different assumptions and see how they impact your financial outcomes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="mr-2 h-5 w-5 text-green-500" />
              Financial Modeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Build complex financial models with dynamic variables and see instant results across different scenarios.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-purple-500" />
              Scenario Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Compare scenarios side-by-side with visual charts and detailed variance analysis to make informed decisions.
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
              <h3 className="font-semibold text-gray-900 mb-2">Scenario Creation & Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create custom scenario templates</li>
                <li>• Define variable inputs and assumptions</li>
                <li>• Copy and modify existing scenarios</li>
                <li>• Version control for scenario iterations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Analysis & Insights</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Side-by-side scenario comparisons</li>
                <li>• Sensitivity analysis and stress testing</li>
                <li>• Monte Carlo simulations</li>
                <li>• Export scenario reports and presentations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="font-semibold mb-2">Best Case</h3>
            <p className="text-sm text-gray-600">Optimistic projections with favorable conditions</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold mb-2">Base Case</h3>
            <p className="text-sm text-gray-600">Most likely scenario based on current trends</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📉</span>
            </div>
            <h3 className="font-semibold mb-2">Worst Case</h3>
            <p className="text-sm text-gray-600">Conservative projections with challenging conditions</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center">
          <FileBarChart className="h-8 w-8 text-purple-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-purple-900">Scenario Planning Coming Soon</h3>
            <p className="text-purple-700 mt-1">
              We're building powerful scenario planning tools to help you model different business outcomes. 
              Create, compare, and analyze multiple financial scenarios with ease.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 