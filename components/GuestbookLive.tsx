'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getTestimonials, type Testimonial } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * The guestbook page's pinned card, heading, sort control and empty state are all
 * part of the captured markup and render exactly as the reference does. This
 * component only fills the message grid and the "(n)" count the way the original
 * did, and turns a failed load into the same toast pair the reference shows:
 * "Failed to load messages / Please try again later".
 */

function card(entry: Testimonial): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'bg-black border border-[#30363d] rounded-xl p-4 sm:p-6';

  const head = document.createElement('div');
  head.className = 'flex items-center gap-3 mb-3';

  const name = entry.user?.name || 'Anonymous';
  if (entry.user?.image) {
    const img = document.createElement('img');
    img.src = entry.user.image;
    img.alt = name;
    img.className = 'w-10 h-10 rounded-full object-cover';
    head.appendChild(img);
  } else {
    const badge = document.createElement('div');
    badge.className = 'w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold';
    badge.textContent = name.slice(0, 1).toUpperCase();
    head.appendChild(badge);
  }

  const who = document.createElement('div');
  const label = document.createElement('div');
  label.className = 'font-semibold';
  label.textContent = name;
  who.appendChild(label);
  if (entry.createdAt) {
    const when = document.createElement('div');
    when.className = 'text-xs text-gray-400';
    when.textContent = new Date(entry.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    who.appendChild(when);
  }
  head.appendChild(who);
  wrap.appendChild(head);

  const body = document.createElement('p');
  body.className = 'text-sm text-gray-300 whitespace-pre-wrap';
  body.textContent = entry.text;
  wrap.appendChild(body);

  return wrap;
}

export default function GuestbookLive() {
  const pathname = usePathname();

  useEffect(() => {
    const grid = document.querySelector<HTMLElement>('.grid.grid-cols-1.md\\:grid-cols-2');
    const heading = Array.from(document.querySelectorAll<HTMLHeadingElement>('h3')).find(h =>
      (h.textContent || '').startsWith('All Messages'),
    );
    const empty = Array.from(document.querySelectorAll<HTMLElement>('div')).find(d =>
      d.childElementCount === 0 && (d.textContent || '').trim() === 'No messages yet. Be the first to leave one!',
    );
    if (!grid) return;

    let alive = true;
    getTestimonials()
      .then(entries => {
        if (!alive) return;
        if (heading) heading.textContent = `All Messages (${entries.length})`;
        grid.replaceChildren(...entries.map(card));
        if (empty) empty.remove();
      })
      .catch(() => {
        if (!alive) return;
        toast.error('Failed to load messages', { description: 'Please try again later' });
      });

    return () => {
      alive = false;
    };
  }, [pathname]);

  return null;
}
