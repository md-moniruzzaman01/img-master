'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { buttonClasses } from '@/components/ui/button-styles';
import { cx } from '@/components/ui/cx';
import { copy } from './copy';
import { PrivacyNote } from './privacy-note';
import { siteConfig } from '@/lib/site-config';

/**
 * Big "Choose images" control (DESIGN.md §4.3), with the privacy line right
 * under the button. Mobile: button + privacy line. From sm (640px): a dashed
 * drop zone around both, plus the drop/paste hint.
 *
 * The visible button is a <label> for a real file input, so it opens the
 * gallery even before React hydrates. Files picked before hydration are picked
 * up on mount. No `capture` attribute: users pick from the gallery.
 * Desktop extras: drag and drop onto the zone, paste with Ctrl+V.
 */
export function FilePicker({
  inputId,
  disabled,
  onFiles,
  onWarmUp,
  accept = 'image/*',
  multiple = true,
  label,
  desktopHint,
}: {
  inputId: string;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  /** File types for the picker (default: any image). */
  accept?: string;
  /** False: a single file; extras from drop or paste are ignored. */
  multiple?: boolean;
  /** Overrides the button text (favicon tools). */
  label?: string;
  /** Drop/paste hint shown in the desktop drop zone; `null` hides it. */
  desktopHint?: string | null;
  /** Called on first intent (pointer down, focus) to start loading the engine. */
  onWarmUp?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const onFilesRef = useRef(onFiles);
  useEffect(() => {
    onFilesRef.current = multiple ? onFiles : (files) => onFiles(files.slice(0, 1));
  }, [onFiles, multiple]);

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
    if (files.length > 0) onFilesRef.current(files);
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
        'flex flex-col items-center text-center transition-colors duration-150 ease-out',
        // From sm up: a dashed drop zone around the button.
        'sm:rounded-card sm:border-2 sm:border-dashed sm:bg-card sm:px-6 sm:py-10',
        dragOver ? 'sm:border-primary sm:bg-gold-tint' : 'sm:border-border-strong',
      )}
    >
      <label
        htmlFor={inputId}
        onPointerDown={onWarmUp}
        aria-disabled={disabled || undefined}
        className={cx(
          buttonClasses('primary', 'lg'),
          'cursor-pointer text-[1.0625rem] sm:w-auto sm:min-w-80 sm:px-10',
          'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus',
          disabled && 'pointer-events-none',
        )}
      >
        {dragOver ? copy.dropHere : (label ?? copy.pickerButton)}
        <input
          ref={inputRef}
          id={inputId}
          data-testid="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onFocus={onWarmUp}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (files.length > 0) onFilesRef.current(files);
          }}
          className="sr-only"
        />
      </label>
      <PrivacyNote className="mt-2" />
      {multiple && accept === 'image/*' && (
        <p className="mt-1 type-small text-muted sm:hidden">
          {copy.pickerHintMobile(siteConfig.maxFiles)}
        </p>
      )}
      {desktopHint !== null && (
        <p className="mt-1 hidden type-small text-muted sm:block">
          {desktopHint ?? copy.pickerHintDesktop}
        </p>
      )}
    </div>
  );
}
