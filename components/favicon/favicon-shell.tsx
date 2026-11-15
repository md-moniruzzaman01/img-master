'use client';

import dynamic from 'next/dynamic';
import type { ToolDefinition } from '@/lib/types';

// Separate chunk so the favicon island is only loaded on favicon pages.
const Impl = dynamic(() => import('./favicon-shell-impl').then((m) => m.FaviconShellImpl));

export function FaviconShell({ tool }: { tool: ToolDefinition }) {
  return <Impl tool={tool} />;
}
