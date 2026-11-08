'use client';

import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { buttonClasses } from '@/components/ui/button-styles';
import { cx } from '@/components/ui/cx';
import { UploadIcon } from '@/components/ui/icons';

/**
 * The drop zone (spec §5.2): ink-dark with a crimson upload disc on desktop
 * (≥ 768px), dashed shu-soft "Tap to choose photos" on phones. The whole zone is
 * a <label> for a real file input, so it opens the gallery even before React
 * hydrates; files picked before hydration are picked up on mount. Desktop
 * extras: drag and drop, paste with Ctrl+V. No `capture` attribute.
 */
export function FilePicker({
  inputId,
  disabled,
  onFiles,
  onWarmUp,
  onDragState,
  accept = 'image/*',
  multiple = true,
  label,
  title,
  mobileTitle,
  hint,
  mobileHint,
  step,
  variant = 'page',
  className,
}: {
  inputId: string;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  /** Called on first intent (pointer down, focus) to start loading the engine. */
  onWarmUp?: () => void;
  /** Drag enters/leaves the zone (the samurai shows "Blade drawn"). */
  onDragState?: (over: boolean) => void;
  accept?: string;
  /** False: a single file; extras from drop or paste are ignored. */
  multiple?: boolean;
  /** Button text ("Choose images"). */
  label: string;
  /** Desktop heading ("Drop images here"). */
  title: string;
  /** Phone heading ("Tap to choose photos"). */
  mobileTitle: string;
  /** Desktop hint under the heading; null hides it. */
  hint?: string | null;
  /** Phone hint ("JPG, PNG, WebP · up to 20 photos"). */
  mobileHint?: string | null;
  /** Hero only: step number before the heading ("2"). */
  step?: string;
  /** `hero`: a low, horizontal zone (home). */
  variant?: 'page' | 'hero';
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [dragOver, setDragOver] = useState(false);
  const onFilesRef = useRef(onFiles);
  const dragRef = useRef(onDragState);
  useEffect(() => {
    onFilesRef.current = multiple ? onFiles : (files) => onFiles(files.slice(0, 1));
    dragRef.current = onDragState;
  }, [onFiles, multiple, onDragState]);

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

  function setOver(v: boolean) {
    setDragOver(v);
    dragRef.current?.(v);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesRef.current(files);
  }

  const hero = variant === 'hero';

  return (
    <label
      htmlFor={inputId}
      data-testid="file-picker"
      data-state={disabled ? 'disabled' : dragOver ? 'drag-over' : 'default'}
      onPointerDown={onWarmUp}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !dragOver) setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={onDrop}
      className={cx(
        'group/zone relative flex cursor-pointer flex-col items-center rounded-card text-center transition-colors duration-150 ease-out',
        // Phones: dashed crimson on shu-soft.
        'border-2 border-dashed border-shu bg-shu-soft px-5 py-5',
        // Desktop: ink-dark zone.
        'md:border-solid md:bg-zone',
        dragOver ? 'md:border-shu' : 'md:border-zone',
        hero ? 'md:flex-row md:gap-5 md:px-6 md:py-6 md:text-left' : 'md:px-8 md:py-12',
        'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus',
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'flex shrink-0 items-center justify-center rounded-full bg-shu text-white transition-transform duration-150',
          hero ? 'size-14' : 'size-14 md:size-[72px]',
          dragOver && 'scale-110',
        )}
      >
        <UploadIcon size={26} strokeWidth={2.25} />
      </span>
      <span className={cx('min-w-0', hero ? 'mt-3 md:mt-0 md:flex-1' : 'mt-3 md:mt-6')}>
        <span className="block font-display text-[1.375rem] leading-7 font-extrabold text-ink md:hidden">
          {mobileTitle}
        </span>
        <span
          className={cx(
            'hidden font-display font-extrabold text-on-zone md:block',
            hero ? 'text-lg leading-6' : 'text-[1.75rem] leading-9',
          )}
        >
          {step && <span className="mr-2 font-sans text-base text-on-zone-muted">{step}</span>}
          {dragOver ? 'Release to start the cut' : title}
        </span>
        {mobileHint && (
          <span className="mt-1 block type-small text-muted md:hidden">{mobileHint}</span>
        )}
        {hint && (
          <span id={hintId} className="mt-1 hidden type-small text-on-zone-muted md:block">
            {hint}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          buttonClasses('primary', 'md'),
          'max-md:hidden',
          hero ? 'shrink-0' : 'mt-5 min-w-36',
        )}
      >
        {label}
      </span>
      <input
        ref={inputRef}
        id={inputId}
        data-testid="file-input"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        onFocus={onWarmUp}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length > 0) onFilesRef.current(files);
        }}
        className="sr-only"
      />
    </label>
  );
}
