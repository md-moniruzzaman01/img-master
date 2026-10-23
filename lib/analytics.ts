// One tracking function for the whole site (GROWTH.md §4). Owned by the lead.
// Never pass file names or image data. Does nothing unless a provider that
// supports custom events is configured in site-config.
import { siteConfig } from './site-config';

export type AnalyticsEvent =
  | { name: 'tool_start'; props: { tool: string; files: number } }
  | {
      name: 'tool_success';
      props: { tool: string; target?: number; outcome: 'success' | 'partial' };
    }
  | { name: 'tool_error'; props: { tool: string; code: string } }
  | { name: 'download'; props: { tool: string; kind: 'single' | 'zip' } }
  | { name: 'share'; props: { tool: string } };

type PlausibleFn = (name: string, opts?: { props?: Record<string, unknown> }) => void;
type UmamiObj = { track: (name: string, data?: Record<string, unknown>) => void };

export type AnalyticsEventName = AnalyticsEvent['name'];
export type AnalyticsProps<N extends AnalyticsEventName> = Extract<
  AnalyticsEvent,
  { name: N }
>['props'];

export function track<N extends AnalyticsEventName>(name: N, props: AnalyticsProps<N>): void {
  if (typeof window === 'undefined') return;
  try {
    const w = window as unknown as { plausible?: PlausibleFn; umami?: UmamiObj };
    switch (siteConfig.analytics.provider) {
      case 'plausible':
        w.plausible?.(name, { props });
        break;
      case 'umami':
        w.umami?.track(name, props);
        break;
      default:
        // 'none' and 'cloudflare' (page views only): no custom events.
        break;
    }
  } catch {
    // Analytics must never break a tool.
  }
}
