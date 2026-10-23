// Small helpers for the favicon tools: save a Blob as a file, free a package's object URLs.
import type { FaviconPackage } from '@/lib/types';

/** Download a Blob through a temporary <a download>, then free its URL. */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  // Give the browser time to start the download before the URL goes away.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Revoke every preview URL once (the mock engine reuses one URL for all sizes). */
export function revokePackage(pkg: FaviconPackage): void {
  for (const url of new Set(Object.values(pkg.previews))) URL.revokeObjectURL(url);
}

export function isIOS(): boolean {
  const n = navigator;
  return /iP(hone|ad|od)/.test(n.userAgent) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
}
