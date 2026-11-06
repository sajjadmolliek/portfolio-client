'use client';

import { useEffect } from 'react';
import { toast } from '@/lib/toast';

/**
 * The greeting toast the reference site fires on load — once per hour, guarded by
 * the same `greeting-toast` sessionStorage key and the same 5s duration:
 *
 *   hour 5–11  Good Morning!      12–16  Good Afternoon!
 *   hour 17–20 Good Evening!      otherwise Good Night!
 */
const STORAGE_KEY = 'greeting-toast';
const HOUR = 60 * 60 * 1000;

function greet(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good Morning!';
  if (hour >= 12 && hour < 17) return 'Good Afternoon!';
  if (hour >= 17 && hour < 21) return 'Good Evening!';
  return 'Good Night!';
}

export default function GreetingToast() {
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      /* private mode — show it anyway */
    }
    const last = stored ? Number(stored) : 0;
    if (last && Date.now() - last < HOUR) return;

    toast(greet(new Date().getHours()), { duration: 5000 });
    try {
      sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
