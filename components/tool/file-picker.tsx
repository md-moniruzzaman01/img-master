'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { buttonClasses } from '@/components/ui/button-styles';
import { cx } from '@/components/ui/cx';
import { UploadIcon } from '@/components/ui/icons';
import { copy } from './copy';

/**
 * Big "Choose images" control (DESIGN.md §4.3).
 *
 * The visible button is a <label> for a real file input, so it opens the
 * gallery even before React hydrates. Files picked before hydration are picked
 * up on mount. No `capture` attribute: users pick from the gallery.
 * Desktop extras: drag and drop onto the zone, paste with Ctrl+V.
 */
export function FilePicker({
  inputId,
  maxFiles,
  disabled,
  onFiles,
  onWarmUp,
}: {
  inputId: string;
  maxFiles: number;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  /** Called on first intent (pointer down, focus) to start loading the engine. */
  onWarmUp?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const onFilesRef = useRef(onFiles);
  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  // A file chosen before hydration is still sitting in the input.
  useEffect(() => {
    const input = inputRef.current;
    if (input?.files && input.files.length > 0) {
      const files = Array.from(input.files);
      input.value = '';
      onFilesRef.current(files);
    }
  }, []);

  // Paste images from the clipboard (desktop).
  useEffect(() => {
    if (disabled) return;
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
        f.type.startsWith('image/'),
      );
      if (files.length === 0) return;
      e.preventDefault();
      onFilesRef.current(files);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [disabled]);

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }

  return (
    <div
      data-testid="file-picker"
      data-state={disabled ? 'disabled' : dragOver ? 'drag-over' : 'default'}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
      }}
      onDrop={onDrop}
      className={cx(
        'flex flex-col items-center gap-3 rounded-card border-2 border-dashed px-4 py-4 text-center',
        'transition-colors duration-150 ease-out fine-pointer:lg:py-10',
        dragOver ? 'border-primary bg-surface-2' : 'border-border bg-surface',
      )}
    >
      <UploadIcon className="hidden text-primary fine-pointer:lg:block" />
      <label
        htmlFor={inputId}
        onPointerDown={onWarmUp}
        aria-disabled={disabled || undefined}
        className={cx(
          buttonClasses('primary', 'lg'),
          'cursor-pointer sm:min-w-64',
          'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus',
          disabled && 'pointer-events-none',
        )}
      >
        <UploadIcon size={20} />
        {dragOver ? copy.dropHere : copy.pickerButton}
        <input
          ref={inputRef}
          id={inputId}
          data-testid="file-input"
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          onFocus={onWarmUp}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (files.length > 0) onFiles(files);
          }}
          className="sr-only"
        />
      </label>
      <p className="type-small text-muted">
        {copy.pickerHintMobile(maxFiles)}
        <span className="hidden fine-pointer:block">{copy.pickerHintDesktop}</span>
      </p>
    </div>
  );
}
