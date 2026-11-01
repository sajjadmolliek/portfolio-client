'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

/**
 * Fills the captured `GitHub Activity` card on /about with live data.
 *
 * The card ships as static markup with placeholders ("0 contributions in the
 * last year", an empty month row, "Loading GitHub activity…" and a "0" in every
 * repo card) because the original site built all of it on the client. This
 * component finds those slots in the DOM and portals real content into them,
 * fed by `/api/github` (server-side proxy, the token never reaches the browser).
 *
 * The calendar is sized from the width the card actually has, so the grid runs
 * the full width of the card instead of floating as a fixed 690px block inside
 * it; the Mon/Wed/Fri column is kept at the grid's resulting height.
 */

export interface ContributionDay {
  date: string;
  contributionCount: number;
  color: string;
}

interface RepoCounts {
  public: number;
  private: number;
  total: number;
}

interface ActivityPayload {
  login: string;
  total: number;
  weeks: ContributionDay[][];
  repos?: RepoCounts;
  error?: string;
}

const GAP = 3;
const MONTH_ROW = 18; // the space the captured markup reserves above the grid
const MIN_CELL = 9;
const MAX_CELL = 20;
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

function Calendar({ weeks, cell }: { weeks: ContributionDay[][]; cell: number }) {
  const column = cell + GAP;
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
    <div className="relative w-full" style={{ paddingTop: MONTH_ROW }}>
      {labels.map(({ label, index }) => (
        <span
          key={`${label}-${index}`}
          className="absolute top-0 text-xs text-[#7d8590]"
          style={{ left: index * column }}
        >
          {label}
        </span>
      ))}
      <div className="flex w-full" style={{ gap: GAP }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap: GAP, flex: '1 1 0', minWidth: 0 }}>
            {week.map(day => (
              <div
                key={day.date}
                className="rounded-[2px] transition-colors"
                style={{ width: '100%', aspectRatio: '1 / 1', backgroundColor: shade(day) }}
                title={`${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'} on ${day.date}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GitHubActivity() {
  const pathname = usePathname();
  const [gridHost, setGridHost] = useState<HTMLElement | null>(null);
  const [weeks, setWeeks] = useState<ContributionDay[][] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [cell, setCell] = useState(12);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);
  const heading = useRef<HTMLElement | null>(null);

  // locate the placeholders the captured markup left behind
  useEffect(() => {
    const grid = Array.from(document.querySelectorAll<HTMLElement>('div')).find(
      d => d.childElementCount === 0 && d.textContent?.trim() === 'Loading GitHub activity…',
    );
    const monthsRow = document.querySelector<HTMLElement>('div.mb-1.ml-10');
    heading.current =
      Array.from(document.querySelectorAll<HTMLElement>('h2')).find(h =>
        h.textContent?.includes('contributions in the last year'),
      ) || null;

    if (grid) {
      grid.textContent = '';
      grid.style.justifyContent = 'flex-start';
      grid.style.height = 'auto';
      grid.style.overflowX = 'hidden';
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
        if (json.repos) fillRepoCards(json.repos);
      } catch (err) {
        if (!cancelled) setError(String((err as Error)?.message || err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gridHost, nonce]);

  /**
   * The card is much wider than a fixed 53×10px calendar, so the cell size comes
   * from the width the card actually has and the grid spans it edge to edge
   * (month labels included).
   */
  useEffect(() => {
    if (!gridHost) return;
    const measure = () => {
      const width = gridHost.clientWidth;
      if (!width) return;
      const next = Math.min(MAX_CELL, Math.max(MIN_CELL, (width - 52 * GAP) / 53));
      setCell(next);
      const height = MONTH_ROW + 7 * next + 6 * GAP;
      gridHost.style.height = 'auto';
      const dayLabels = gridHost.previousElementSibling as HTMLElement | null;
      if (dayLabels) dayLabels.style.height = `${height}px`;
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [gridHost, weeks]);

  const gridHeight = useMemo(() => MONTH_ROW + 7 * cell + 6 * GAP, [cell]);

  if (!gridHost) return null;

  return createPortal(
    <div className="relative w-full" style={{ minHeight: weeks ? gridHeight : undefined }}>
      {weeks && total !== null ? (
        <Calendar weeks={weeks} cell={cell} />
      ) : (
        <div className="w-full text-xs text-[#7d8590]">{error || 'Loading GitHub activity…'}</div>
      )}
    </div>,
    gridHost,
  );
}

/**
 * Writes the real counts into the captured Public / Private / Total Repos cards.
 * Cards are located by their caption, so re-capturing the markup does not
 * silently break this.
 */
function fillRepoCards(counts: RepoCounts) {
  const values: Record<string, number> = {
    'Public Repos': counts.public,
    'Private Repos': counts.private,
    'Total Repos': counts.total,
  };
  const captions = Array.from(document.querySelectorAll<HTMLElement>('div')).filter(d => {
    const text = d.textContent?.trim() ?? '';
    return d.childElementCount === 0 && text in values;
  });
  for (const caption of captions) {
    const number = caption.parentElement?.querySelector('div.font-mono > span');
    if (number) number.textContent = String(values[caption.textContent?.trim() ?? '']);
  }
}