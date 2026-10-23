import { LegalPage, legalMetadata } from '../_legal/legal-page';

export const metadata = legalMetadata('contact');

export default function ContactPage() {
  return <LegalPage slug="contact" />;
}
