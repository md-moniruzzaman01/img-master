import { describe, expect, it } from 'vitest';
import { cutReducer, initialCut, type CutEvent, type CutState } from '../cut-moment';

const run = (s: CutState, ...events: CutEvent[]) => events.reduce(cutReducer, s);

describe('cutReducer', () => {
  it('image: file then built plays once', () => {
    const s = run(initialCut('image'), { type: 'file' }, { type: 'built' });
    expect(s.plays).toBe(1);
    expect(run(s, { type: 'built' }).plays).toBe(1);
  });

  it('text: load build does not play', () => {
    expect(run(initialCut('text'), { type: 'built' }).plays).toBe(0);
  });

  it('text: first edit then built plays once; later edits never replay', () => {
    const s = run(
      initialCut('text'),
      { type: 'edit' },
      { type: 'built' },
      { type: 'edit' },
      { type: 'edit' },
      { type: 'built' },
    );
    expect(s.plays).toBe(1);
  });

  it('emoji behaves like text', () => {
    const s = run(
      initialCut('emoji'),
      { type: 'built' },
      { type: 'edit' },
      { type: 'built' },
      { type: 'edit' },
      { type: 'built' },
    );
    expect(s.plays).toBe(1);
  });

  it('mode switch resets arming but keeps plays', () => {
    let s = run(initialCut('image'), { type: 'file' }, { type: 'built' }, { type: 'file' });
    expect(s.armed).toBe(true);
    s = run(s, { type: 'mode', mode: 'text' });
    expect(s).toEqual({ mode: 'text', armed: false, edited: false, plays: 1 });
    expect(run(s, { type: 'built' }).plays).toBe(1);
  });
});
