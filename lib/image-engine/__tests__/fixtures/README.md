# Test fixtures

HEIC samples for `heic-libheif.test.ts`. Treated as untrusted data: only read by the libheif decoder, never executed.

| File | Bytes | Source | Licence |
|---|---|---|---|
| `colors-no-alpha.heic` | 499 | https://github.com/strukturag/libheif/blob/master/fuzzing/data/corpus/colors-no-alpha.heic | LGPL-3.0 (libheif repository, same licence as the library we ship) |
| `colors-with-alpha.heic` | 817 | https://github.com/strukturag/libheif/blob/master/fuzzing/data/corpus/colors-with-alpha.heic | LGPL-3.0 |
| `clap_cropped.heic` | 2060 | https://github.com/strukturag/libheif/blob/master/tests/data/clap_cropped.heic | LGPL-3.0 |

All are 64x64. Downloaded 2026-11-16. Nokia's `heif_conformance` files were not used because that repository has no licence file.
These files are test data only; the site does not serve them.
