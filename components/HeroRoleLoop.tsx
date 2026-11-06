'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * The hero headline ends in "a <rotating role>". The reference renders that with
 * a TextLoop: one word at a time, each word split into per-letter spans that
 * blur/rise in with a 0.3s word stagger and a 0.05s letter stagger, replaced
 * every 3s; the outgoing word blurs, lifts and scales away.
 *
 * The capture froze on the first word, so the markup ships those letter spans
 * already. This finds that container and keeps the loop going with the reference's
 * twelve roles and timings, rebuilding the same span structure for each word.
 */

const WORDS = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Software Developer',
  'Software Engineer',
  'Web Developer',
  'React Developer',
  'Next.js Developer',
  'JavaScript Developer',
  'Node.js Developer',
  'Tech Enthusiast',
  'Open Source Contributor',
];

const INTERVAL = 3000;
const IN_WORD_DELAY = 0.3;
const IN_LETTER_DELAY = 0.05;
const IN_DURATION = 0.2;

const IN_HIDDEN = 'opacity:0;transform:translateY(10px);filter:blur(8px)';
const IN_SHOWN = 'opacity:1;transform:translateY(0);filter:blur(0px)';
const OUT_STYLE =
  'position:absolute;opacity:0;transform:translateY(-40px) translateX(40px) scale(2);filter:blur(8px)';

/** Builds `<span word><span>l</span>…<span>&nbsp;</span></span>` like the capture. */
function buildWord(word: string): HTMLElement[] {
  return word.split(' ').map((part, wordIndex) => {
    const outer = document.createElement('span');
    outer.className = 'inline-block whitespace-nowrap';
    outer.style.cssText = `${IN_HIDDEN};transition:opacity ${IN_DURATION}s ease ${IN_WORD_DELAY * wordIndex}s, transform ${IN_DURATION}s ease ${IN_WORD_DELAY * wordIndex}s, filter ${IN_DURATION}s ease ${IN_WORD_DELAY * wordIndex}s`;

    part.split('').forEach((letter, letterIndex) => {
      const delay = IN_WORD_DELAY * wordIndex + IN_LETTER_DELAY * letterIndex;
      const inner = document.createElement('span');
      inner.className = 'inline-block';
      inner.textContent = letter;
      inner.style.cssText = `${IN_HIDDEN};transition:opacity ${IN_DURATION}s ease ${delay}s, transform ${IN_DURATION}s ease ${delay}s, filter ${IN_DURATION}s ease ${delay}s`;
      outer.appendChild(inner);
    });

    const space = document.createElement('span');
    space.className = 'inline-block';
    space.textContent = '\u00a0';
    outer.appendChild(space);

    return outer;
  });
}

// one loop per container, even across StrictMode's double effect run or a hot reload
const BOUND = new WeakSet<HTMLElement>();

export default function HeroRoleLoop() {
  const pathname = usePathname();

  useEffect(() => {
    const container = Array.from(
      document.querySelectorAll<HTMLElement>('div.z-10.inline-block.relative.text-left'),
    ).find(node => (node.textContent || '').trim().length > 0);
    if (!container || BOUND.has(container)) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    BOUND.add(container);

    // the captured first word is already in the DOM; start the cycle after it
    let index = 0;
    let swap: ReturnType<typeof setTimeout> | undefined;

    const advance = () => {
      index = (index + 1) % WORDS.length;
      const existing = Array.from(container.children) as HTMLElement[];

      existing.forEach(node => {
        delete node.dataset.roleWord;
        node.style.transition = 'opacity .2s ease, transform .2s ease, filter .2s ease';
        node.style.cssText = OUT_STYLE;
      });

      // the incoming word is tagged so the exit sweep below cannot take it with
      // it — leaving the sweeper to key off a timer alone sometimes left two
      // words stacked in the container
      const incoming = buildWord(WORDS[index]);
      incoming.forEach(node => {
        node.dataset.roleWord = 'current';
        container.appendChild(node);
      });

      requestAnimationFrame(() => {
        incoming.forEach(node => {
          const ownDelay = node.style.transition;
          node.style.cssText = IN_SHOWN;
          node.style.transition = ownDelay;
          // the per-letter spans keep their own staggered transitions
          Array.from(node.children).forEach(child => {
            const el = child as HTMLElement;
            const childTransition = el.style.transition;
            el.style.cssText = IN_SHOWN;
            el.style.transition = childTransition;
          });
        });
      });

      setTimeout(() => {
        Array.from(container.children).forEach(node => {
          if (!(node as HTMLElement).dataset.roleWord) node.remove();
        });
      }, 320);

      swap = setTimeout(advance, INTERVAL);
    };

    swap = setTimeout(advance, INTERVAL);

    return () => {
      clearTimeout(swap);
      BOUND.delete(container);
    };
  }, [pathname]);

  return null;
}
