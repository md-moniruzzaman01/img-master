import { LegalPage, legalMetadata } from '../_legal/legal-page';

export const metadata = legalMetadata('privacy');

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
