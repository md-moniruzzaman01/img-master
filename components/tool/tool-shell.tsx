'use client';

import dynamic from 'next/dynamic';
import type { ToolDefinition } from '@/lib/types';

// The shell is its own chunk (preloaded by the page), so each route loads only the island it renders.
const Impl = dynamic(() => import('./tool-shell-impl').then((m) => m.ToolShellImpl));

export function ToolShell(props: {
  tool: ToolDefinition;
  sideTip?: string;
  variant?: 'page' | 'hero';
}) {
  return <Impl {...props} />;
}
