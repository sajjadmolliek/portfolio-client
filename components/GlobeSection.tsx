'use client';

import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

/**
 * The captured home page keeps an empty, absolutely positioned box inside the
 * "I'm very flexible with time zone communications" card — that is where the
 * reference appends its globe. The card is captured twice (the lg:hidden mobile
 * stack and the desktop one), so both boxes get their own globe, and each only
 * loads three.js when it comes within 200px of the viewport, exactly like the
 * reference's IntersectionObserver.
 */

const GlobeCanvas = dynamic(() => import('@/components/GlobeCanvas'), { ssr: false });

export default function GlobeSection() {
  const pathname = usePathname();
  const [hosts, setHosts] = useState<HTMLElement[]>([]);

  useEffect(() => {
    setHosts([]);
    const found = Array.from(document.querySelectorAll<HTMLElement>('[data-slot="globe"]'));
    if (!found.length) return;

    const observers = found.map(target => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setHosts(current => (current.includes(target) ? current : [...current, target]));
          observer.disconnect();
        },
        { rootMargin: '200px' },
      );
      observer.observe(target);
      return observer;
    });

    return () => observers.forEach(observer => observer.disconnect());
  }, [pathname]);

  return (
    <>
      {hosts.map((host, i) => (
        <Fragment key={i}>{createPortal(<GlobeCanvas />, host)}</Fragment>
      ))}
    </>
  );
}
