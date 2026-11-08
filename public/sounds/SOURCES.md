# Sound sources

All three are Pixabay sound effects (Pixabay Content License: free for commercial use, modification allowed, no attribution required), trimmed and re-encoded to mono 64 kbps MP3 with short fades.

| File | Original | Cut |
|---|---|---|
| `start.mp3` | `oxidvideos-sword-swing-sfx-407574.mp3` | 0.00–0.50 s |
| `success.mp3` | `freesound_community-draw-sword1-44724.mp3` | 0.00–0.85 s |
| `error.mp3` | `freesound_community-sword-thud-47635.mp3` | 3.45–4.15 s (first thud) |

Encoded with ffmpeg: `-ac 1 -ar 44100 -b:a 64k`, fade in 10 ms, fade out 120 ms.
