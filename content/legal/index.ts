// Legal and info pages. Owned by seo-content.
import type { LegalContent, LegalSlug } from '@/lib/types';
import { aboutContent } from './about';
import { contactContent } from './contact';
import { privacyContent } from './privacy';
import { termsContent } from './terms';

export const legalContent: Readonly<Record<LegalSlug, LegalContent>> = {
  about: aboutContent,
  privacy: privacyContent,
  terms: termsContent,
  contact: contactContent,
};
