'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

/**
 * Fills the captured `GitHub Activity` card on /about with live data.
 *
 * The card ships as static markup with placeholders ("0 contributions in the
 * last year", an empty month row, "Loading GitHub activity…") because the
 * original site built the calendar on the client. This component finds those
 * three slots in the DOM and portals real content into them, fed by
 * `/api/github` (server-side proxy, token never reaches the browser).
 */

export interface ContributionDay {
  date: string;
  contributionCount: number;
  color: string;
}

interface ActivityPayload {
  login: string;
  total: number;
  weeks: ContributionDay[][];
  error?: string;
}

const CELL = 10;
const GAP = 3;
const COLUMN = CELL + GAP;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * GitHub answers with its light-theme greens (#9be9a8 …) while the captured card
 * ships the dark legend (#161b22 … #39d353), so each day is translated to the
 * matching dark shade instead of being painted with the raw API colour.
 */
const DARK_SHADE: Record<string, string> = {
  '#9be9a8': '#0e4429',
  '#40c463': '#006d32',
  '#30a14e': '#26a641',
  '#216e39': '#39d353',
};

function shade(day: ContributionDay): string {
  if (day.contributionCount <= 0) return '#161b22';
  return DARK_SHADE[day.color.toLowerCase()] || '#26a641';
}

function Calendar({ weeks }: { weeks: ContributionDay[][] }) {
  const labels: { label: string; index: number }[] = [];
  let previous = -1;
  weeks.forEach((week, index) => {
    const first = week[0];
    if (!first) return;
    const month = new Date(`${first.date}T00:00:00`).getMonth();
    if (month !== previous) {
      labels.push({ label: MONTHS[month], index });
      previous = month;
    }
  });

  return (
    <>
      {labels.map(({ label, index }) => (
        <span
          key={`${label}-${index}`}
          className="absolute top-0 text-xs text-[#7d8590]"
          style={{ left: index * COLUMN }}
        >
          {label}
        </span>
      ))}
      <div className="flex gap-[3px]" style={{ paddingTop: 18 }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map(day => (
              <div
                key={day.date}
                className="w-[10px] h-[10px] rounded-[2px] transition-colors"
                style={{ backgroundColor: shade(day) }}
                title={`${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'} on ${day.date}`}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default function GitHubActivity() {
  const pathname = usePathname();
  const [gridHost, setGridHost] = useState<HTMLElement | null>(null);
  const [weeks, setWeeks] = useState<ContributionDay[][] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);
  const heading = useRef<HTMLElement | null>(null);

  // locate the three placeholders the captured markup left behind
  useEffect(() => {
    const grid = Array.from(document.querySelectorAll<HTMLElement>('div')).find(
      d => d.childElementCount === 0 && d.textContent?.trim() === 'Loading GitHub activity…',
    );
    const monthsRow = document.querySelector<HTMLElement>('div.mb-1.ml-10');
    heading.current = Array.from(document.querySelectorAll<HTMLElement>('h2')).find(h =>
      h.textContent?.includes('contributions in the last year'),
    ) || null;

    if (grid) {
      grid.textContent = '';
      grid.style.justifyContent = 'flex-start';
      grid.style.overflowX = 'auto';
      setGridHost(prev => (prev === grid ? prev : grid));
    }
    if (monthsRow) {
      // the month names are rendered above the columns themselves (in the grid
      // portal), so the captured empty row only needs to get out of the way
      monthsRow.style.display = 'none';
    }

    const refresh = document.querySelector<HTMLButtonElement>('button[title="Refresh GitHub data"]');
    const onClick = () => setNonce(n => n + 1);
    refresh?.addEventListener('click', onClick);
    return () => refresh?.removeEventListener('click', onClick);
  }, [pathname]);

  useEffect(() => {
    if (!gridHost) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(nonce ? `/api/github?t=${nonce}` : '/api/github', {
          cache: nonce ? 'no-store' : 'default',
        });
        const json = (await res.json()) as ActivityPayload;
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error || `Request failed (${res.status})`);
          return;
        }
        setError('');
        setWeeks(json.weeks);
        setTotal(json.total);
        if (heading.current) heading.current.textContent = `${json.total} contributions in the last year`;
      } catch (err) {
        if (!cancelled) setError(String((err as Error)?.message || err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gridHost, nonce]);

  if (!gridHost) return null;

  return createPortal(
    <div className="relative w-max min-w-full">
      {weeks && total !== null ? (
        <Calendar weeks={weeks} />
      ) : (
        <div className="w-full text-xs text-[#7d8590]">{error || 'Loading GitHub activity…'}</div>
      )}
    </div>,
    gridHost,
  );
}
