import { cx } from '@/components/ui/cx';
import { copy } from './copy';

/** "🔒 Your images never leave your device", one small gray line under the picker. */
export function PrivacyNote({ className }: { className?: string }) {
  return (
    <p data-testid="privacy-note" className={cx('type-small text-muted', className)}>
      <span aria-hidden="true">🔒 </span>
      {copy.privacy}
    </p>
  );
}
