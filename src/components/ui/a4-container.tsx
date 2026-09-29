import React from 'react';
import { cn } from '@/lib/utils';

interface A4ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const A4Container: React.FC<A4ContainerProps> = ({ children, className }) => {
  return (
    <div className={cn("a4-page", className)}>
      {children}
    </div>
  );
};
