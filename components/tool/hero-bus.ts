// Lets the home page feed the hero tool (ToolShell variant="hero") from outside
// it: the CTA band opens its picker, and a file dropped anywhere on the page goes
// to it. Plain window events, so callers need no React context. Tiny on purpose.

export const HERO_PICK_EVENT = 'im:hero-pick';
export const HERO_FILES_EVENT = 'im:hero-files';
/** Stable id of the hero tool's section (scroll target and no-JS link target). */
export const HERO_TOOL_ID = 'hero-tool';

/**
 * Open the hero tool's file picker and scroll the tool into view. Call it from a
 * click handler: the event is dispatched synchronously, so the browser still
 * treats input.click() as part of the user's gesture.
 */
export function openHeroPicker(): void {
  window.dispatchEvent(new Event(HERO_PICK_EVENT));
}

/** Hand files to the hero tool (page-wide drop). */
export function sendFilesToHero(files: File[]): void {
  if (files.length === 0) return;
  window.dispatchEvent(new CustomEvent<File[]>(HERO_FILES_EVENT, { detail: files }));
}
