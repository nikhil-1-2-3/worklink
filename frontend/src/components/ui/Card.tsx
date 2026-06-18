import React from 'react';
import { cn } from './Button';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable = false, children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden",
        hoverable && "transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-slate-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pt-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3", className)} {...props}>
      {children}
    </div>
  );
}
