import type { HTMLAttributes } from 'react';

/** Text for screen readers only. */
export function VisuallyHidden({ children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className="sr-only" {...props}>
      {children}
    </span>
  );
}
