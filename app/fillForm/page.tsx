/* Generated from the captured site by scripts/generate-pages.mjs — do not edit. */
import type { Metadata } from 'next';
import { html, title, description } from '@/lib/pages/fillForm';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = { title, description };

export default function Page() {
  const [before, after = ''] = html.split('<!--SLOT-->');
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <ContactForm variant="collab" />
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
