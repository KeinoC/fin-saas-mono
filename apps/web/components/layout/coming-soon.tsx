"use client";

import { ArrowLeft, Building2, Users, FileText, BarChart, CreditCard, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ComingSoonProps {
  title: string;
  description: string;
  orgId: string;
  icon?: 'budgets' | 'scenarios' | 'reports' | 'team' | 'settings';
}

export function ComingSoon({ title, description, orgId, icon = 'settings' }: ComingSoonProps) {
  const iconMap = {
    budgets: CreditCard,
    scenarios: BarChart,
    reports: FileText,
    team: Users,
    settings: Settings,
  };

  const IconComponent = iconMap[icon];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <IconComponent className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>
          <p className="text-lg text-muted-foreground mb-8">{description}</p>
        </div>

        <div className="bg-card rounded-sm shadow-sm border border-border p-6 mb-8">
          <Building2 className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-sm">
            We're working hard to bring you this feature. It will be available in an upcoming release.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild>
            <Link
              href={`/org/${orgId}/dashboard`}
              className="inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="text-center">
            <Link
              href={`/org/${orgId}/integrations`}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Or explore Integrations →
            </Link>
          </div>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          Have feedback or suggestions?{' '}
          <a href="mailto:feedback@k-fin.com" className="text-primary hover:text-primary/80">
            Let us know
          </a>
        </div>
      </div>
    </div>
  );
} 