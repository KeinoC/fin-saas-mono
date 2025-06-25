import { Construction, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  description?: string;
  orgId: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function ComingSoon({ title, description, orgId, icon: Icon = Construction }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-yellow-700" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {title}
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-2">
          {description || `The ${title.toLowerCase()} feature is currently under development.`}
        </p>
        <p className="text-gray-500 text-sm mb-8">
          We're working hard to bring you this feature soon!
        </p>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-8">
          <Construction className="w-4 h-4 mr-2" />
          Coming Soon
        </div>

        {/* Back to Dashboard */}
        <div className="space-y-4">
          <Link
            href={`/org/${orgId}/dashboard`}
            className="inline-flex items-center gap-2 bg-yellow-700 text-white px-6 py-3 rounded-md hover:bg-yellow-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>In the meantime, you can:</p>
            <div className="mt-2 space-y-1">
              <Link 
                href={`/org/${orgId}/integrations`} 
                className="block text-yellow-700 hover:text-yellow-800"
              >
                • Set up your integrations
              </Link>
              <Link 
                href={`/org/${orgId}/dashboard`} 
                className="block text-yellow-700 hover:text-yellow-800"
              >
                • View your dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 