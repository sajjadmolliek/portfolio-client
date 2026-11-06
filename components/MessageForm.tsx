'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sendMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * The "Collaborate With Me" form on /fillForm is part of the captured markup —
 * inputs, gradients and the Send Message button render exactly as the reference
 * ships them. This component only supplies the behaviour the reference wired up
 * on the client: the live `0/1000` counter, the same validation messages, and the
 * same success/error toasts. Submissions go to the dashboard API instead of the
 * original endpoint.
 */

const MAX = 1000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate({ name, email, message }: { name: string; email: string; message: string }): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length > 100) return 'Name exceeds maximum length of 100 characters';
  if (!email.trim()) return 'Email is required';
  if (!EMAIL.test(email.trim().toLowerCase())) return 'Please provide a valid email address';
  if (!message.trim()) return 'Message is required';
  if (message.trim().length > MAX) return `Message exceeds maximum length of ${MAX} characters`;
  return null;
}

export default function MessageForm() {
  const pathname = usePathname();

  useEffect(() => {
    const name = document.querySelector<HTMLInputElement>('input[name="name"]');
    const email = document.querySelector<HTMLInputElement>('input[name="email"]');
    const message = document.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(b =>
      b.textContent?.includes('Send Message'),
    );
    if (!message || !button) return;

    // the counter the reference renders next to the "Message" label
    const counter = Array.from(document.querySelectorAll<HTMLElement>('span')).find(s =>
      /^\d+\s*\/\s*1000$/.test((s.textContent || '').trim()),
    );
    const paint = () => {
      if (counter) counter.textContent = `${message.value.length}/${MAX}`;
      // Tailwind's sr-only-free flow: the captured markup ships the counter as a
      // single text node ("0/1000"), which React would otherwise keep in sync.
      counter?.setAttribute('data-live', 'true');
    };
    paint();

    message.addEventListener('input', paint);

    let sending = false;
    const submit = async () => {
      if (sending) return;
      const payload = {
        name: name?.value ?? '',
        email: email?.value ?? '',
        message: message.value,
      };
      const problem = validate(payload);
      if (problem) {
        toast.error(problem);
        return;
      }

      // the reference clears the form and announces success immediately, then
      // reports a failure only if the request comes back with one
      sending = true;
      if (name) name.value = '';
      if (email) email.value = '';
      message.value = '';
      paint();
      toast.success('Message sent successfully!', {
        description: 'Thanks for reaching out. I’ll get back to you soon.',
      });

      try {
        await sendMessage({ ...payload, email: payload.email.trim().toLowerCase() });
      } catch (err) {
        const detail = String((err as Error)?.message || err);
        if (/fetch|network|load failed/i.test(detail)) {
          toast.error('Network error', { description: 'Please check your connection.' });
        } else {
          toast.error('Failed to send message', { description: 'Please try again later.' });
        }
      } finally {
        sending = false;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Node && button.contains(event.target)) {
        event.preventDefault();
        void submit();
      }
    };
    button.addEventListener('click', onClick);

    return () => {
      message.removeEventListener('input', paint);
      button.removeEventListener('click', onClick);
    };
  }, [pathname]);

  return null;
}
