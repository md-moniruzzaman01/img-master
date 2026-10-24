'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cx } from '@/components/ui/cx';

/** Desktop header link. The current page gets a short crimson brush underline. */
export function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cx('relative', className)}
    >
      {children}
      {active && (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 40 6"
          preserveAspectRatio="none"
          className="absolute inset-x-3 bottom-2 h-1.5 w-[calc(100%-1.5rem)]"
        >
          <path
            d="M1 4.2C8 2 15 3.6 22 2.6S34 2 39 3.2"
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="stroke-primary"
          />
        </svg>
      )}
    </Link>
  );
}
