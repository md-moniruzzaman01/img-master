import { cx } from '@/components/ui/cx';
import { copy } from './copy';

/**
 * "🔒 Processed on this device…", one small line under the picker. Matcha text
 * (spec §3: matcha = success text, privacy line).
 */
export function PrivacyNote({ className }: { className?: string }) {
  return (
    <p data-testid="privacy-note" className={cx('type-small text-matcha', className)}>
      <span aria-hidden="true">🔒 </span>
      {copy.privacy}
    </p>
  );
}
