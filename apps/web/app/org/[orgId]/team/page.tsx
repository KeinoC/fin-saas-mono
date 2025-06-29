import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Shield, Settings } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage team members, roles, and permissions for your organization</p>
        </div>
        <Button disabled>
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5 text-blue-500" />
              Member Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Invite team members, manage user accounts, and control access to different features and data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-green-500" />
              Role-Based Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Define custom roles and permissions to ensure team members have appropriate access levels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-purple-500" />
              Team Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Configure team-wide settings, notification preferences, and collaboration workflows.
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
              <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Send team invitations via email</li>
                <li>• Manage user profiles and settings</li>
                <li>• Deactivate or remove team members</li>
                <li>• Bulk user operations and imports</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Permissions & Security</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Custom role definitions and permissions</li>
                <li>• Data access controls by department</li>
                <li>• Activity logging and audit trails</li>
                <li>• Two-factor authentication setup</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👑</span>
            </div>
            <h3 className="font-semibold mb-2">Admin</h3>
            <p className="text-sm text-gray-600">Full access to all features</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✏️</span>
            </div>
            <h3 className="font-semibold mb-2">Editor</h3>
            <p className="text-sm text-gray-600">Can edit and manage data</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👁️</span>
            </div>
            <h3 className="font-semibold mb-2">Viewer</h3>
            <p className="text-sm text-gray-600">Read-only access to reports</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-semibold mb-2">Custom</h3>
            <p className="text-sm text-gray-600">Define your own roles</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-green-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">Team Management Coming Soon</h3>
            <p className="text-green-700 mt-1">
              We're developing comprehensive team management features including user invitations, 
              role-based permissions, and activity monitoring. Collaborate securely with your team!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 