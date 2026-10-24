import type { FrameSet, SamuraiState } from './frames';

export type Timeline = {
  set: FrameSet;
  shown: SamuraiState;
  requested: SamuraiState;
  i: number;
  done: boolean;
};

function isDone(set: FrameSet, state: SamuraiState, i: number): boolean {
  return !set.loop[state] && i >= set.seq[state].length - 1;
}

function at(set: FrameSet, state: SamuraiState, i: number): Timeline {
  return { set, shown: state, requested: state, i, done: isDone(set, state, i) };
}

export function startTimeline(set: FrameSet, state: SamuraiState): Timeline {
  return at(set, state, 0);
}

export function currentFrame(t: Timeline): number {
  return t.set.seq[t.shown][t.i];
}

export function request(t: Timeline, state: SamuraiState): Timeline {
  if (state === 'working') {
    if (t.shown === 'working' && t.requested === 'working' && t.i === 0) return t;
    return at(t.set, 'working', 0);
  }
  if (t.requested === state) return t;
  if (t.shown === 'working' && (state === 'success' || state === 'error')) {
    // Let the current stroke finish; tick() performs the switch.
    return { ...t, requested: state };
  }
  return at(t.set, state, 0);
}

export function tick(t: Timeline): { t: Timeline; frame: number; cut: boolean } {
  const { set, shown } = t;
  const seq = set.seq[shown];
  const last = seq.length - 1;

  if (shown !== t.requested) {
    if (t.i >= last) {
      const next = at(set, t.requested, 0);
      return { t: next, frame: currentFrame(next), cut: false };
    }
  }

  let i = t.i;
  if (i < last) i += 1;
  else if (set.loop[shown]) i = 0;

  const next: Timeline = { ...t, i, done: isDone(set, shown, i) };
  const frame = seq[i];
  const cut = shown === 'working' && set.cutFrame !== null && frame === set.cutFrame;
  return { t: next, frame, cut };
}
