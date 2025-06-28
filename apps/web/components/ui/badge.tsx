import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'subtle';
  children: React.ReactNode;
}

export function Badge({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  
  const variantClasses = {
    default: 'bg-primary/10 text-primary',
    secondary: 'bg-muted text-muted-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    outline: 'border border-border text-muted-foreground',
    subtle: 'bg-muted/50 text-muted-foreground text-[10px] px-1.5 py-0 font-normal opacity-70',
  };

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)} 
      {...props}
    >
      {children}
    </div>
  );
} 