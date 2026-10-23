import { LegalPage, legalMetadata } from '../_legal/legal-page';

export const metadata = legalMetadata('about');

export default function AboutPage() {
  return <LegalPage slug="about" />;
}
