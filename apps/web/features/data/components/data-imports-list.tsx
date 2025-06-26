'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { formatUserDisplayName, getUserInitials } from '@/lib/user-utils';

interface DataImport {
  id: string;
  filename: string;
  status: 'pending' | 'completed' | 'failed';
  rowCount: number | null;
  fileSize: number;
  createdAt: string;
  uploadedBy: string;
  columns: string[];
  preview: any[];
  fileUrl: string | null;
}

interface DataImportsListProps {
  orgId: string;
  refreshTrigger: number;
}

export function DataImportsList({ orgId, refreshTrigger }: DataImportsListProps) {
  const [imports, setImports] = useState<DataImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{[key: string]: 'downloading' | 'success' | 'error'}>({});
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const { data: session } = useSession();

  const fetchImports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/data/imports?orgId=${orgId}`);
      
      if (!response.ok) {
        if (response.status === 500) {
          setImports([]);
          setError(null);
          return;
        }
        throw new Error('Failed to fetch imports');
      }
      
      const data = await response.json();
      setImports(data);
    } catch (error) {
      console.error('Error fetching imports:', error);
      setImports([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, [orgId, refreshTrigger]);

  const handleDelete = async (importId: string) => {
    try {
      const response = await fetch(`/api/data/imports/${importId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete import');
      }
      
      setImports(imports.filter(imp => imp.id !== importId));
    } catch (error) {
      console.error('Error deleting import:', error);
    }
  };

  const handleDownload = async (importItem: DataImport) => {
    try {
      // Set downloading status
      setDownloadStatus(prev => ({ ...prev, [importItem.id]: 'downloading' }));
      
      // Create download URL
      const downloadUrl = `/api/data/imports/${importItem.id}/download`;
      
      // Fetch the file
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = importItem.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Set success status
      setDownloadStatus(prev => ({ ...prev, [importItem.id]: 'success' }));
      setDownloadMessage(`✅ "${importItem.filename}" downloaded successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[importItem.id];
          return newStatus;
        });
        setDownloadMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus(prev => ({ ...prev, [importItem.id]: 'error' }));
      setDownloadMessage(`❌ Failed to download "${importItem.filename}"`);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[importItem.id];
          return newStatus;
        });
        setDownloadMessage(null);
      }, 5000);
    }
  };

  const startEditing = (importItem: DataImport) => {
    setEditingId(importItem.id);
    setEditingName(importItem.filename);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveRename = async (importId: string) => {
    if (!editingName.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/data/imports/${importId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: editingName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename file');
      }

      // Update the local state
      setImports(imports.map(imp => 
        imp.id === importId 
          ? { ...imp, filename: editingName.trim() }
          : imp
      ));

      setDownloadMessage(`✅ File renamed to "${editingName.trim()}"`);
      setTimeout(() => setDownloadMessage(null), 3000);

      cancelEditing();
    } catch (error) {
      console.error('Error renaming file:', error);
      setDownloadMessage(`❌ Failed to rename file`);
      setTimeout(() => setDownloadMessage(null), 5000);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatUserName = (uploadedBy: string) => {
    return formatUserDisplayName(uploadedBy, session?.user);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16" />
            </svg>
            Recent Uploads
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading uploads...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Toast Notification */}
      {downloadMessage && (
        <div className={`mx-4 mt-4 p-3 rounded-lg border transition-all duration-300 ${
          downloadMessage.includes('✅') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{downloadMessage}</span>
            <button
              onClick={() => setDownloadMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16" />
          </svg>
          Recent Uploads
        </h3>
      </div>
      <div className="p-6">
        {imports.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
            <p className="text-gray-500">Upload your first CSV or Excel file to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {imports.map((importItem) => (
              <div key={importItem.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      {editingId === importItem.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveRename(importItem.id);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => saveRename(importItem.id)}
                            className="p-1 text-green-600 hover:text-green-700"
                            title="Save"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Cancel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{importItem.filename}</h4>
                          <button
                            onClick={() => startEditing(importItem)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Rename file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-8 0V21h8a4 4 0 004-4V7M8 7H4" />
                          </svg>
                          {formatDate(importItem.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {formatUserName(importItem.uploadedBy)}
                        </span>
                        <span>{formatFileSize(importItem.fileSize)}</span>
                        {importItem.rowCount && (
                          <span>{importItem.rowCount.toLocaleString()} rows</span>
                        )}
                      </div>
                      {importItem.columns.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm text-gray-500 mb-1">Columns:</div>
                          <div className="flex flex-wrap gap-1">
                            {importItem.columns.slice(0, 5).map((column, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {column}
                              </span>
                            ))}
                            {importItem.columns.length > 5 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                +{importItem.columns.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      importItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                      importItem.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {importItem.status}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleDownload(importItem)}
                        disabled={downloadStatus[importItem.id] === 'downloading'}
                        className={`p-1 border border-gray-200 rounded hover:bg-gray-50 transition-colors ${
                          downloadStatus[importItem.id] === 'downloading' 
                            ? 'text-blue-500 cursor-not-allowed' 
                            : downloadStatus[importItem.id] === 'success'
                            ? 'text-green-600 hover:text-green-700'
                            : downloadStatus[importItem.id] === 'error'
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-gray-400 hover:text-blue-600'
                        }`}
                        title={
                          downloadStatus[importItem.id] === 'downloading' 
                            ? 'Downloading...' 
                            : downloadStatus[importItem.id] === 'success'
                            ? 'Downloaded successfully'
                            : downloadStatus[importItem.id] === 'error'
                            ? 'Download failed - click to retry'
                            : 'Download original CSV'
                        }
                      >
                        {downloadStatus[importItem.id] === 'downloading' ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : downloadStatus[importItem.id] === 'success' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : downloadStatus[importItem.id] === 'error' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M9 21h6a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(importItem.id)}
                        className="p-1 text-gray-400 hover:text-red-600 border border-gray-200 rounded hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 