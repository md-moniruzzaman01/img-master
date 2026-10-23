import { LockIcon } from '@/components/ui/icons';
import { copy } from './copy';

/** Lock icon + one line. */
export function PrivacyNote() {
  return (
    <p className="flex items-start gap-2 type-small text-muted">
      <LockIcon size={20} className="shrink-0 text-success" />
      <span className="pt-px">{copy.privacy}</span>
    </p>
  );
}
