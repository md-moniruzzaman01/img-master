import { describe, expect, it } from 'vitest';
import { KENDO } from '../frames';
import { currentFrame, request, startTimeline, tick, type Timeline } from '../timeline';

function run(t: Timeline, n: number) {
  const out: { t: Timeline; frame: number; cut: boolean }[] = [];
  let cur = t;
  for (let k = 0; k < n; k++) {
    const r = tick(cur);
    out.push(r);
    cur = r.t;
  }
  return out;
}

describe('samurai timeline', () => {
  it('idle ping-pongs and loops', () => {
    const frames = run(startTimeline(KENDO, 'idle'), 7).map((r) => r.frame);
    expect(frames).toEqual([1, 2, 3, 2, 1, 0, 1]);
  });

  it('working emits cut on frame 8 once per stroke', () => {
    const r = run(startTimeline(KENDO, 'working'), 18);
    expect(r.filter((x) => x.cut)).toHaveLength(2);
  });

  it('success waits for the current stroke to finish', () => {
    let t = startTimeline(KENDO, 'working');
    const first = run(t, 2);
    t = request(first[1].t, 'success');
    expect(t.shown).toBe('working');
    const rest = run(t, 14);
    const frames = rest.map((r) => r.frame);
    expect(frames.slice(0, 10)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    expect(rest[5].t.shown).toBe('working');
    expect(rest[6].t.shown).toBe('success');
    expect(frames.slice(10)).toEqual([16, 16, 16, 16]);
    expect(rest[9].t.done).toBe(true);
    expect(rest[8].t.done).toBe(false);
  });

  it('fast job still gets one full stroke incl. cut', () => {
    let t = request(startTimeline(KENDO, 'working'), 'success');
    const seen: boolean[] = [];
    for (let k = 0; k < 30 && t.shown !== 'success'; k++) {
      const r = tick(t);
      seen.push(r.cut);
      t = r.t;
    }
    expect(t.shown).toBe('success');
    expect(seen).toContain(true);
  });

  it('error holds kneeling frame', () => {
    const frames = run(startTimeline(KENDO, 'error'), 4).map((r) => r.frame);
    expect(frames).toEqual([17, 18, 18, 18]);
  });

  it('timeline restarts on new working request', () => {
    let t = request(startTimeline(KENDO, 'working'), 'success');
    // advance into success
    while (t.shown !== 'success') t = tick(t).t;
    t = tick(t).t; // frame 14
    expect(currentFrame(t)).toBe(14);
    t = request(t, 'working');
    expect(t.shown).toBe('working');
    const r = tick(t);
    expect(r.frame).toBe(5);
    expect(r.t.shown).toBe('working');
  });

  it('request same state is a no-op', () => {
    let t = startTimeline(KENDO, 'idle');
    t = tick(tick(t).t).t;
    const same = request(t, 'idle');
    expect(same.i).toBe(t.i);
    expect(same).toBe(t);
  });
});
