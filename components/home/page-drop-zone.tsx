'use client';

import { useEffect, useState } from 'react';
import { copy } from '@/components/tool/copy';
import { sendFilesToHero } from '@/components/tool/hero-bus';
import { UploadIcon } from '@/components/ui/icons';

/**
 * Home only (spec §5.1 item 8, last sentence): dropping a file anywhere on the
 * page feeds the hero tool. Shows a full-viewport overlay while a file is
 * being dragged over the page, and hands the files to hero-bus.ts on drop.
 * `fixed`, so it never shifts layout; no props, mount it once on the page.
 */
export function PageDropZone() {
  const [over, setOver] = useState(false);

  useEffect(() => {
    function hasFiles(e: DragEvent) {
      return Array.from(e.dataTransfer?.types ?? []).includes('Files');
    }
    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setOver(true);
    }
    function onDragOver(e: DragEvent) {
      // Required so the browser lets a "drop" fire here instead of opening the file.
      if (!hasFiles(e)) return;
      e.preventDefault();
    }
    function onDragLeave(e: DragEvent) {
      // Only really left the page when the pointer isn't re-entering a child
      // element — the same containment check FilePicker uses, generalised to
      // the whole document (avoids the enter/leave flicker between children).
      const to = e.relatedTarget;
      if (!(to instanceof Node) || !document.documentElement.contains(to)) setOver(false);
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setOver(false);
      // Dropped straight onto the hero card's own drop zone: it already handles
      // the files itself (FilePicker's onDrop) — don't hand them over twice.
      if (e.target instanceof Element && e.target.closest('[data-testid="file-picker"]')) return;
      sendFilesToHero(Array.from(e.dataTransfer?.files ?? []));
    }
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  if (!over) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-scrim"
    >
      <div className="rounded-card border-2 border-dashed border-white bg-shu px-10 py-8 text-center text-white">
        <UploadIcon size={36} className="mx-auto mb-3" />
        <p className="font-display text-xl font-extrabold sm:text-2xl">{copy.dropHere}</p>
      </div>
    </div>
  );
}
