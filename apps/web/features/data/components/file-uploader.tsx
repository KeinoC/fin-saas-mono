'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FileUploaderProps {
  orgId: string;
  userId: string;
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: string) => void;
}

interface UploadResult {
  id: string;
  filename: string;
  rowCount: number;
  columns: string[];
  preview: any[];
}

interface FileUpload {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: UploadResult;
  error?: string;
}

export function FileUploader({ orgId, userId, onUploadSuccess, onUploadError }: FileUploaderProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const uploadFile = async (fileUpload: FileUpload) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === fileUpload.id 
          ? { ...upload, status: 'uploading', progress: 0 }
          : upload
      )
    );

    try {
      const formData = new FormData();
      formData.append('file', fileUpload.file);
      formData.append('orgId', orgId);
      formData.append('userId', userId);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploads(prev => 
          prev.map(upload => 
            upload.id === fileUpload.id 
              ? { ...upload, progress: Math.min(upload.progress + 10, 90) }
              : upload
          )
        );
      }, 200);

      const response = await fetch('/api/data/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploads(prev => 
        prev.map(upload => 
          upload.id === fileUpload.id 
            ? { 
                ...upload, 
                status: 'success', 
                progress: 100, 
                result: { ...data.dataImport, filename: fileUpload.file.name } 
              }
            : upload
        )
      );

      onUploadSuccess?.(data.dataImport);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setUploads(prev => 
        prev.map(upload => 
          upload.id === fileUpload.id 
            ? { ...upload, status: 'error', error: errorMessage }
            : upload
        )
      );
      onUploadError?.(errorMessage);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: FileUpload[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Start uploading files one by one
    newUploads.forEach(upload => {
      uploadFile(upload);
    });
  }, [orgId, userId]);

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const closePreview = (id: string) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id 
          ? { ...upload, result: undefined }
          : upload
      )
    );
  };

  const processFile = async (upload: FileUpload) => {
    if (!upload.result) return;
    setIsProcessing(upload.id);

    try {
      const response = await fetch('/api/data/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataImportId: upload.result.id,
          // In the future, we'll pass transformation rules here
          transformationRules: [], 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      // You can update the UI to show that processing is complete
      console.log('Processing successful:', data);

    } catch (err) {
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          {isDragActive ? (
            <p className="text-lg font-medium text-primary">Drop your files here</p>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                Drag & drop your files here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports CSV and Excel files up to 10MB each. Multiple files supported.
              </p>
            </div>
          )}
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">File Uploads</h3>
          
          {uploads.map((upload) => (
            <div key={upload.id} className="border border-border rounded-lg p-4 space-y-3">
              {/* File Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{upload.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeUpload(upload.id)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={upload.status === 'uploading'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Status */}
              {upload.status === 'uploading' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-foreground">Uploading...</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{upload.progress}%</p>
                </div>
              )}

              {upload.status === 'error' && (
                <div className="flex items-center text-destructive space-x-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-sm font-medium">{upload.error || 'Upload failed'}</p>
                </div>
              )}

              {upload.status === 'success' && (
                <div className="flex items-center text-green-500 space-x-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-medium">Upload complete</p>
                </div>
              )}

              {/* File Preview */}
              {upload.result && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Successfully processed {upload.result.rowCount} rows
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Detected {upload.result.columns.length} columns
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => closePreview(upload.id)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  {/* Transformation Trigger */}
                  <div className="mt-4 border-t border-border pt-4">
                    <Button
                      onClick={() => processFile(upload)}
                      disabled={isProcessing === upload.id}
                    >
                      {isProcessing === upload.id ? 'Processing...' : 'Process Data'}
                    </Button>
                  </div>

                  {upload.result?.preview && upload.result.preview.length > 0 && upload.result.columns && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Data Preview:</p>
                      <div className="bg-card rounded border border-border shadow-sm">
                        <div className="max-h-80 overflow-auto">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                              <tr>
                                {upload.result.columns.map((column, i) => (
                                  <th 
                                    key={i}
                                    className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                  >
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {upload.result.preview.map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                                  {upload.result!.columns.map((column, colIndex) => (
                                    <td 
                                      key={`${rowIndex}-${colIndex}`}
                                      className="px-3 py-2 text-xs text-foreground whitespace-nowrap overflow-hidden text-ellipsis"
                                      style={{ maxWidth: '200px' }}
                                    >
                                      {row[column] !== undefined ? String(row[column]) : ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 