import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-yellow-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

// For compatibility with shadcn-like APIs
export const SelectContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => children;
export const SelectItem = ({ children, value, ...props }: React.OptionHTMLAttributes<HTMLOptionElement>) => (
  <option value={value} {...props}>{children}</option>
);
export const SelectTrigger = Select;
export const SelectValue = ({ placeholder }: { placeholder?: string }) => null; 