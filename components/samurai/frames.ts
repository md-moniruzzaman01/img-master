export type SamuraiState = 'idle' | 'working' | 'success' | 'error';

export type FrameSet = {
  sprite: string;
  prefix: string;
  w: number;
  h: number;
  seq: Record<SamuraiState, number[]>;
  ms: Record<SamuraiState, number>;
  loop: Record<SamuraiState, boolean>;
  still: Record<SamuraiState, number>;
  cutFrame: number | null;
};

export const KENDO: FrameSet = {
  sprite: '/samurai/kendo.svg',
  prefix: 'k',
  w: 271,
  h: 200,
  seq: {
    idle: [0, 1, 2, 3, 2, 1],
    working: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    success: [13, 14, 15, 16],
    error: [0, 17, 18],
  },
  ms: { idle: 320, working: 95, success: 130, error: 160 },
  loop: { idle: true, working: true, success: false, error: false },
  still: { idle: 0, working: 8, success: 16, error: 18 },
  cutFrame: 8,
};

const RONIN_SEQ = Array.from({ length: 37 }, (_, n) => n);

export const RONIN: FrameSet = {
  sprite: '/samurai/ronin.svg',
  prefix: 'r',
  w: 165,
  h: 260,
  seq: {
    idle: RONIN_SEQ,
    working: RONIN_SEQ,
    success: RONIN_SEQ,
    error: RONIN_SEQ,
  },
  ms: { idle: 85, working: 85, success: 85, error: 85 },
  loop: { idle: false, working: false, success: false, error: false },
  still: { idle: 0, working: 0, success: 0, error: 0 },
  cutFrame: null,
};

export const RONIN_REST_MS = 5000;
