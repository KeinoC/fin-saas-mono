import React from 'react';

interface ContentLayoutProps {
  children: React.ReactNode;
}

export function ContentLayout({ children }: ContentLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  );
} 