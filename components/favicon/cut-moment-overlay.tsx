'use client';

import { useEffect, type ReactNode } from 'react';

/** Stub: the cut animation runs immediately (full animation pending new slash/motion deps). */
export function CutMoment({
  playKey,
  onDone,
}: {
  playKey: number;
  tile: ReactNode;
  onDone: () => void;
}) {
  useEffect(() => {
    if (playKey > 0) onDone();
  }, [playKey, onDone]);
  return null;
}
