'use client';

import { useId } from 'react';
import type { FaviconShape } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ChipGroup } from '@/components/ui/chip-group';
import { cx } from '@/components/ui/cx';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { faviconCopy as t } from './copy';
import {
  MAX_TEXT,
  PADDING,
  QUICK_EMOJI,
  ZOOM,
  limitGraphemes,
  type EmojiOpts,
  type FaviconMode,
  type FaviconOptions,
  type ImageOpts,
  type TextOpts,
  type Weight,
} from './favicon-options';

const SHAPES = [
  { value: 'square', label: t.shapeSquare },
  { value: 'rounded', label: t.shapeRounded },
  { value: 'circle', label: t.shapeCircle },
] as const;

const WEIGHTS = [
  { value: '400', label: t.weightRegular },
  { value: '600', label: t.weightSemibold },
  { value: '800', label: t.weightBold },
] as const;

const percent = (v: number) => `${Math.round(v)}%`;
const times = (v: number) => `${v.toFixed(2).replace(/0$/, '')}×`;

/** A labeled native color input (48px tall, 16px text, keyboard accessible). */
function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block type-small font-semibold text-text">
        {label}
      </label>
      <input
        id={id}
        type="color"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        data-testid="color-input"
        className="block h-12 w-full cursor-pointer rounded-control border border-border-strong bg-bg p-1 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

/** Background color with a "transparent" switch (image and emoji modes). */
function BackgroundControl({
  transparent,
  color,
  onTransparent,
  onColor,
}: {
  transparent: boolean;
  color: string;
  onTransparent: (v: boolean) => void;
  onColor: (v: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Switch label={t.transparent} checked={transparent} onChange={onTransparent} />
      <ColorField label={t.background} value={color} onChange={onColor} disabled={transparent} />
    </div>
  );
}

function ShapeControl({
  value,
  onChange,
}: {
  value: FaviconShape;
  onChange: (v: FaviconShape) => void;
}) {
  return (
    <ChipGroup
      label={t.shape}
      variant="segmented"
      className="[&>div]:flex"
      options={SHAPES}
      value={value}
      onChange={onChange}
    />
  );
}

/**
 * Mode controls (PRODUCT.md §4.4). `part="main"` is the text or emoji field that
 * sits right under the mode tabs; `part="style"` is everything else, in a card.
 * (The image picker lives in the shell.)
 */
export function FaviconControls({
  mode,
  part,
  options,
  onChange,
}: {
  mode: FaviconMode;
  part: 'main' | 'style';
  options: FaviconOptions;
  onChange: <M extends FaviconMode>(mode: M, patch: Partial<FaviconOptions[M]>) => void;
}) {
  if (part === 'main') {
    if (mode === 'text') {
      return (
        <TextField value={options.text.text} onChange={(text) => onChange('text', { text })} />
      );
    }
    if (mode === 'emoji') {
      return (
        <EmojiField
          value={options.emoji.emoji}
          onChange={(emoji) => onChange('emoji', { emoji })}
        />
      );
    }
    return null;
  }

  return (
    <Card data-testid="favicon-controls" data-mode={mode} className="grid gap-4">
      {mode === 'image' && <ImageStyle o={options.image} set={(p) => onChange('image', p)} />}
      {mode === 'text' && <TextStyle o={options.text} set={(p) => onChange('text', p)} />}
      {mode === 'emoji' && <EmojiStyle o={options.emoji} set={(p) => onChange('emoji', p)} />}
    </Card>
  );
}

function ImageStyle({ o, set }: { o: ImageOpts; set: (p: Partial<ImageOpts>) => void }) {
  return (
    <>
      <ShapeControl value={o.shape} onChange={(shape) => set({ shape })} />
      <Slider
        label={t.zoom}
        hint={t.zoomHint}
        min={ZOOM.min}
        max={ZOOM.max}
        step={ZOOM.step}
        value={o.zoom}
        format={times}
        onChange={(zoom) => set({ zoom })}
      />
      <Slider
        label={t.padding}
        min={PADDING.min}
        max={PADDING.max}
        value={o.padding}
        format={percent}
        onChange={(padding) => set({ padding })}
      />
      <BackgroundControl
        transparent={o.transparent}
        color={o.background}
        onTransparent={(transparent) => set({ transparent })}
        onColor={(background) => set({ background })}
      />
    </>
  );
}

function TextStyle({ o, set }: { o: TextOpts; set: (p: Partial<TextOpts>) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <ColorField label={t.textColor} value={o.color} onChange={(color) => set({ color })} />
        <ColorField
          label={t.background}
          value={o.background}
          onChange={(background) => set({ background })}
        />
      </div>
      <ChipGroup
        label={t.weight}
        variant="segmented"
        className="[&>div]:flex"
        options={WEIGHTS}
        value={String(o.weight) as '400' | '600' | '800'}
        onChange={(w) => set({ weight: Number(w) as Weight })}
      />
      <ShapeControl value={o.shape} onChange={(shape) => set({ shape })} />
      <Slider
        label={t.padding}
        min={PADDING.min}
        max={PADDING.max}
        value={o.padding}
        format={percent}
        onChange={(padding) => set({ padding })}
      />
    </>
  );
}

function EmojiStyle({ o, set }: { o: EmojiOpts; set: (p: Partial<EmojiOpts>) => void }) {
  return (
    <>
      <ShapeControl value={o.shape} onChange={(shape) => set({ shape })} />
      <Slider
        label={t.padding}
        min={PADDING.min}
        max={PADDING.max}
        value={o.padding}
        format={percent}
        onChange={(padding) => set({ padding })}
      />
      <BackgroundControl
        transparent={o.transparent}
        color={o.background}
        onTransparent={(transparent) => set({ transparent })}
        onColor={(background) => set({ background })}
      />
    </>
  );
}

const FIELD =
  'block h-14 w-full rounded-control border border-border-strong bg-bg px-4 text-center text-[1.5rem] font-semibold text-text';

function TextField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  const hintId = useId();
  const invalid = value.trim() === '';
  return (
    <div>
      <label htmlFor={id} className="mb-1 block type-small font-semibold text-text">
        {t.textLabel}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? hintId : undefined}
        data-testid="text-input"
        onChange={(e) => onChange(limitGraphemes(e.target.value, MAX_TEXT, 'first'))}
        className={cx(FIELD, invalid && 'border-danger')}
      />
      {/* Always present, so showing it never moves the content below. */}
      <p
        id={hintId}
        className={cx('mt-1 min-h-5 type-small', invalid ? 'text-danger' : 'invisible')}
      >
        {t.textInvalid}
      </p>
    </div>
  );
}

function EmojiField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  const hintId = useId();
  const invalid = value === '';
  return (
    <div className="grid gap-2">
      <div>
        <label htmlFor={id} className="mb-1 block type-small font-semibold text-text">
          {t.emojiLabel}
        </label>
        <input
          id={id}
          type="text"
          value={value}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          data-testid="emoji-input"
          onChange={(e) => onChange(limitGraphemes(e.target.value, 1, 'last'))}
          onFocus={(e) => e.currentTarget.select()}
          className={cx(FIELD, invalid && 'border-danger')}
        />
        <p
          id={hintId}
          className={cx('mt-1 min-h-5 type-small', invalid ? 'text-danger' : 'text-muted')}
        >
          {invalid ? t.emojiInvalid : t.emojiHint}
        </p>
      </div>
      <ChipGroup
        label={t.emojiQuick}
        variant="chips"
        options={QUICK_EMOJI.map((e) => ({ value: e.value, label: e.value, ariaLabel: e.name }))}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
