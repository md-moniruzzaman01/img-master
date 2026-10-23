import { LegalPage, legalMetadata } from '../_legal/legal-page';

export const metadata = legalMetadata('terms');

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
