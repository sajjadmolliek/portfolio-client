/* Generated from the captured site by scripts/generate-pages.mjs — do not edit. */
import type { Metadata } from 'next';
import { html, title, description } from '@/lib/pages/bookCall';
import BookCall from '@/components/BookCall';

export const metadata: Metadata = { title, description };

export default function Page() {
  const [before, after = ''] = html.split('<!--SLOT-->');
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <BookCall />
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
