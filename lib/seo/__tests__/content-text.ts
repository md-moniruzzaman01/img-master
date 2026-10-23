// Helpers for the content validation tests. Owned by seo-content.
import type { ToolContent } from '@/lib/types';
import { toPlainText } from '@/lib/seo/url';

/** All text shown below the tool (how it works, sections, tips, FAQs), as plain text. */
export function belowToolText(c: ToolContent): string {
  const parts: string[] = [...c.howTo];
  for (const s of c.sections) {
    parts.push(s.heading, ...s.paragraphs, ...(s.list ?? []));
    if (s.table) {
      parts.push(s.table.caption, ...s.table.headers, ...s.table.rows.flat());
    }
  }
  parts.push(...(c.tips ?? []));
  for (const f of c.faqs) parts.push(f.q, f.a);
  return parts.map(toPlainText).join(' ');
}

export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function wordCount(c: ToolContent): number {
  return words(belowToolText(c)).length;
}

/** Word 5-gram shingles. */
export function shingles(text: string, n = 5): Set<string> {
  const w = words(text);
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
}

/** Share of the smaller page's shingles that also appear in the other page (0–1). */
export function overlap(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const s of a) if (b.has(s)) shared++;
  return shared / Math.min(a.size, b.size);
}

/** Lowercase, drop articles and possessives, so "an image" matches "image". */
export function normalizeForKeyword(text: string): string {
  return ` ${words(toPlainText(text))
    .filter((w) => !['a', 'an', 'the', 'your', 'my'].includes(w))
    .join(' ')} `;
}

export function containsKeyword(text: string, keyword: string): boolean {
  return normalizeForKeyword(text).includes(normalizeForKeyword(keyword));
}

/** Inline links in the text of a page (excluding hub tables). */
export function inlineLinks(c: ToolContent): string[] {
  const texts = [
    ...c.sections.flatMap((s) => [...s.paragraphs, ...(s.list ?? [])]),
    ...(c.tips ?? []),
    ...c.faqs.map((f) => f.a),
  ];
  return texts.flatMap((t) => [...t.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]));
}

const LINK = /\[[^\]]+\]\(([^)]+)\)/g;

/** Every link target anywhere in the page content, including hub tables. */
export function allLinks(c: ToolContent): string[] {
  const tableCells = c.sections.flatMap((s) => (s.table ? s.table.rows.flat() : []));
  return [...inlineLinks(c), ...tableCells.flatMap((t) => [...t.matchAll(LINK)].map((m) => m[1]))];
}
