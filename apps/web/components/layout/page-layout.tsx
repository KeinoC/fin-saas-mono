import React from 'react';

interface PageLayoutProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({ title, description, actions, children }: PageLayoutProps) {
  return (
    <div>
      <div className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <p className="text-muted-foreground mt-1">{description}</p>
            </div>
            {actions && <div className="flex items-center space-x-3">{actions}</div>}
          </div>
        </div>
      </div>

      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
} 