'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { faviconCopy as t } from './copy';

type CopyState = 'idle' | 'copied' | 'failed';

/** Select all text in an element (fallback when the clipboard API is blocked). */
function selectAll(el: HTMLElement): void {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * The HTML snippet in a <pre> with a Copy button ("Copy code" → "Copied").
 * Reserves its height, so the snippet arriving never moves the page.
 */
export function SnippetBlock({ snippet }: { snippet: string | null }) {
  const headingId = useId();
  const preRef = useRef<HTMLPreElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [state, setState] = useState<CopyState>('idle');

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copySnippet() {
    if (!snippet) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(snippet);
      ok = true;
    } catch {
      // Blocked or unavailable: select the text and try the old way.
      const pre = preRef.current;
      if (pre) {
        selectAll(pre);
        try {
          ok = document.execCommand('copy');
        } catch {
          ok = false;
        }
      }
    }
    setState(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2500);
  }

  return (
    <section
      aria-labelledby={headingId}
      data-testid="snippet-block"
      className="grid gap-2 [&>*]:min-w-0"
    >
      <h2 id={headingId} className="type-h3 text-text">
        {t.snippetHeading}
      </h2>
      <p className="type-small text-muted">{t.snippetHint}</p>
      <div className="relative rounded-card border border-border bg-surface">
        <pre
          ref={preRef}
          tabIndex={0}
          aria-label={t.snippetHeading}
          data-testid="snippet"
          className="no-scrollbar min-h-[176px] overflow-x-auto p-4 pb-16 font-mono text-[0.8125rem] leading-5 text-text"
        >
          {snippet ? (
            <code>{snippet}</code>
          ) : (
            <span className="font-sans text-muted">{t.snippetPlaceholder}</span>
          )}
        </pre>
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-end gap-3">
          <p role="status" className="type-small text-muted">
            {state === 'failed' ? t.copyFailed : ''}
          </p>
          <Button
            variant="secondary"
            disabled={!snippet}
            onClick={() => void copySnippet()}
            data-testid="copy-snippet"
          >
            <span aria-live="polite">{state === 'copied' ? t.copied : t.copyCode}</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
