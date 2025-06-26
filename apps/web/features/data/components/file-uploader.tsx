'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

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
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-600">Drop your files here</p>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                Drag & drop your files here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports CSV and Excel files up to 10MB each. Multiple files supported.
              </p>
            </div>
          )}
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">File Uploads</h3>
          
          {uploads.map((upload) => (
            <div key={upload.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              {/* File Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">{upload.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeUpload(upload.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={upload.status === 'uploading'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Status */}
              {upload.status === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-gray-700">Uploading...</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{upload.progress}%</p>
                </div>
              )}

              {upload.status === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-red-700 font-medium text-sm">Upload Failed</p>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{upload.error}</p>
                </div>
              )}

              {upload.status === 'success' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-green-700 font-medium text-sm">Upload Successful!</p>
                    </div>
                    
                    {upload.result && (
                      <button
                        onClick={() => closePreview(upload.id)}
                        className="text-green-600 hover:text-green-800 text-sm underline"
                      >
                        Close Preview
                      </button>
                    )}
                  </div>
                  
                  {upload.result && (
                    <>
                      <div className="space-y-1 text-sm mb-3">
                        <p className="text-green-600">
                          <span className="font-medium">{upload.result.rowCount}</span> rows imported
                        </p>
                        <p className="text-green-600">
                          <span className="font-medium">{upload.result.columns.length}</span> columns detected: 
                          <span className="ml-1">{upload.result.columns.join(', ')}</span>
                        </p>
                      </div>

                      {upload.result.preview && upload.result.preview.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Data Preview:</p>
                          <div className="bg-white rounded border border-gray-200 shadow-sm">
                            <div className="max-h-80 overflow-auto">
                              <table className="min-w-full text-xs">
                                <thead className="bg-gray-50 sticky top-0">
                                  <tr>
                                    {upload.result.columns.map((column) => (
                                      <th 
                                        key={column} 
                                        className="px-3 py-2 text-left font-medium text-gray-600 border-b border-gray-200 whitespace-nowrap"
                                        style={{ minWidth: '120px', maxWidth: '200px' }}
                                      >
                                        <div className="truncate" title={column}>
                                          {column}
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {upload.result.preview.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      {upload.result!.columns.map((column) => (
                                        <td 
                                          key={column} 
                                          className="px-3 py-2 text-gray-900 border-r border-gray-100 last:border-r-0"
                                          style={{ minWidth: '120px', maxWidth: '200px' }}
                                        >
                                          <div className="truncate" title={String(row[column] || '')}>
                                            {String(row[column] || '')}
                                          </div>
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                              Showing first {upload.result.preview.length} rows of {upload.result.rowCount} total rows
                            </div>
                          </div>
                        </div>
                      )}
                    </>
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