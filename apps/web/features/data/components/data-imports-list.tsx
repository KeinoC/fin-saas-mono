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
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16" />
            </svg>
            Recent Uploads
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading uploads...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Toast Notification */}
      {downloadMessage && (
        <div className={`mx-4 mt-4 p-3 rounded-lg border transition-all duration-300 ${
          downloadMessage.includes('✅') 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{downloadMessage}</span>
            <button
              onClick={() => setDownloadMessage(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16" />
          </svg>
          Data Imports
        </h3>
      </div>
      
      {imports.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          No data imports found.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {imports.map(importItem => (
            <div key={importItem.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    {editingId === importItem.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(importItem.id)}
                          className="bg-input border border-border rounded px-2 py-1 text-sm text-foreground"
                          autoFocus
                        />
                        <button onClick={() => saveRename(importItem.id)} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">Save</button>
                        <button onClick={cancelEditing} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80">Cancel</button>
                      </div>
                    ) : (
                      <h4 className="font-semibold text-foreground">{importItem.filename}</h4>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{formatDate(importItem.createdAt)}</span>
                      <span>{formatUserName(importItem.uploadedBy)}</span>
                      <span>{formatFileSize(importItem.fileSize)}</span>
                      {importItem.rowCount && <span>{importItem.rowCount} rows</span>}
                    </div>
                    {importItem.columns?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Columns:</p>
                        <div className="flex flex-wrap gap-1">
                          {importItem.columns.slice(0, 5).map(col => (
                            <span key={col} className="text-xs bg-muted px-2 py-0.5 rounded-full">{col}</span>
                          ))}
                          {importItem.columns.length > 5 && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">+{importItem.columns.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {importItem.status === 'completed' && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400">completed</span>
                    )}
                    {importItem.status === 'pending' && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">pending</span>
                    )}
                    {importItem.status === 'failed' && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">failed</span>
                    )}
                  </div>
                  <button onClick={() => startEditing(importItem)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => handleDownload(importItem)} disabled={!!downloadStatus[importItem.id]} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50">
                    {downloadStatus[importItem.id] === 'downloading' 
                      ? <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    }
                  </button>
                  <button onClick={() => handleDelete(importItem.id)} className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 