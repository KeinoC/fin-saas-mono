'use client';

import { useState } from 'react';
import { FileUploader } from '@/features/data/components/file-uploader';
import { DataImportsList } from '@/features/data/components/data-imports-list';
import { useSession } from '@/lib/auth-client';
import { formatUserDisplayName } from '@/lib/user-utils';

interface DataUploadsPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function DataUploadsPage({ params }: DataUploadsPageProps) {
  const { orgId } = await params;
  
  return (
    <DataUploadsContent orgId={orgId} />
  );
}

function DataUploadsContent({ orgId }: { orgId: string }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data: session, isPending } = useSession();
  
  // Get user information from session, with fallback
  const userId = session?.user?.email || session?.user?.id || 'anonymous-user';
  const userName = formatUserDisplayName(userId, session?.user);

  const handleUploadSuccess = (result: any) => {
    console.log('Upload successful:', result);
    // Trigger refresh of the data imports list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  // Show loading state while session is being fetched
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Uploads</h1>
          <p className="mt-2 text-gray-600">
            Upload CSV and Excel files to import your data into the system
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New File</h2>
          <FileUploader
            orgId={orgId}
            userId={userId}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>

        {/* Data Imports List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <DataImportsList 
            orgId={orgId} 
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Upload Guidelines</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Supported Formats</h4>
              <ul className="space-y-1">
                <li>• CSV files (.csv)</li>
                <li>• Excel files (.xls, .xlsx)</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Best Practices</h4>
              <ul className="space-y-1">
                <li>• Include column headers in the first row</li>
                <li>• Use consistent date formats</li>
                <li>• Avoid special characters in column names</li>
                <li>• Keep data clean and properly formatted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 