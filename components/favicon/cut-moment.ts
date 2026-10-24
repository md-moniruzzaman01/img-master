export type CutState = {
  mode: 'image' | 'text' | 'emoji';
  armed: boolean;
  edited: boolean;
  plays: number;
};

export type CutEvent =
  | { type: 'file' }
  | { type: 'edit' }
  | { type: 'built' }
  | { type: 'mode'; mode: CutState['mode'] };

export function initialCut(mode: CutState['mode']): CutState {
  return { mode, armed: false, edited: false, plays: 0 };
}

/** When the samurai cuts: after a new image, or after the first edit in text/emoji. */
export function cutReducer(s: CutState, e: CutEvent): CutState {
  switch (e.type) {
    case 'file':
      return s.mode === 'image' ? { ...s, armed: true } : s;
    case 'edit':
      if (s.mode === 'image' || s.edited) return s;
      return { ...s, edited: true, armed: true };
    case 'built':
      return s.armed ? { ...s, armed: false, plays: s.plays + 1 } : s;
    case 'mode':
      return { ...initialCut(e.mode), plays: s.plays };
  }
}
