const CRUMB_WORDS: Record<string, string> = {
  jpg: 'JPG',
  png: 'PNG',
  ico: 'ICO',
  webp: 'WebP',
  to: 'to',
};

/**
 * "compress image to 50kb" -> "Compress Image to 50KB". The name of the last
 * breadcrumb, shown on the page and in the BreadcrumbList JSON-LD (they must match).
 */
export function keywordCrumbName(keyword: string): string {
  return keyword
    .split(/\s+/)
    .map((w) => {
      const known = CRUMB_WORDS[w.toLowerCase()];
      if (known) return known;
      if (/^\d+(kb|mb)$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}
