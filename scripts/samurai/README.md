# Samurai sprite pipeline (offline, run by hand)

Turns two free Pixabay clips into the ink-silhouette sprites in `public/samurai/`.
Not part of `npm run build`. Needs Python 3.14 and a throwaway virtualenv (no npm dependency).

```bash
python -m venv venv
./venv/Scripts/python -m pip install opencv-python-headless potracer "rembg[cpu]" numpy pillow imageio-ffmpeg
```

Source clips (see `public/samurai/SOURCES.md`), downloaded to `dl/`:

- `315583_large.mp4`: Pixabay video 315583 (kendo, tool-page samurai)
- `339449_large.mp4`: Pixabay video 339449 (back-view ronin, home hero)

## Steps

```bash
# 1. Extract frames: <video> <outdir> <start s> <end s> <every Nth frame>
python ext.py dl/315583_large.mp4 f/kendo 0 10 3     # 81 frames
python ext.py dl/339449_large.mp4 f/back  0 6  2     # 73 frames

# 2. Person masks (human segmentation). NUMBA_DISABLE_JIT avoids a Windows path-length
#    crash in pymatting's numba cache.
NUMBA_DISABLE_JIT=1 U2NET_HOME=./models python seg.py f/kendo f/back

# 3. Ink silhouettes: mask + sword pixels near the person (wood for kendo, dark for ronin)
python ink.py kendo f/kendo f/kendo_ink
python ink.py back  f/back  f/back_ink

# 4. Trace the chosen frames with one shared bounding box (figure never jumps)
python trace.py f/kendo_ink tr/all.json  200 0 2 4 6 11 12 13 14 15 16 17 18 19 38 39 40 41 77 78
python trace.py f/back_ink  tr/hero.json 260 $(seq 0 2 72)

# 5. Sprites
python sprite.py tr/all.json  k ../../public/samurai/kendo.svg
python sprite.py tr/hero.json r ../../public/samurai/ronin.svg
```

## Frame map (kendo.svg)

| Symbol | Source frame | Use |
|---|---|---|
| k0–k3 | 0, 2, 4, 6 | idle (on guard) |
| k4–k12 | 11–19 | working strike (k8 = down-cut, slash fires) |
| k13–k16 | 38–41 | success (lowers sword, stands tall) |
| k17–k18 | 77, 78 | error (drops to one knee) |

`ronin.svg`: r0–r36 = every second frame 0–72 (rolls up sleeves, then rests).

Frame order and meaning are used by `components/samurai/frames.ts`. Change both together.
