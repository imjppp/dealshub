# Third-party notices

| Component | Where | Licence | How it is used |
|---|---|---|---|
| **Clipper** (JavaScript port 6.4.2, by Angus Johnson / Timo) | `vendor/clipper.js`, text in `vendor/CLIPPER-LICENSE.txt` | Boost Software License 1.0 | Polygon boolean operations and offsetting. Source unmodified (a one-line ESM wrapper and `@ts-nocheck` were added). |
| **pyembroidery** 1.5.1 by Tatarize | `src/data/pec-palette.js`, `jef-palette.js`, `pec-blank.js` (data tables); `src/formats/*` (see below) | MIT (Copyright (c) 2018 Tatarize) | (1) Colour tables and the blank PEC icon template are copied as data. (2) The byte layouts of the machine-format writers were implemented by following pyembroidery's writers, because most of these formats are only documented by working implementations. (3) Dev-only: it is the test oracle in `scripts/verify_pyembroidery.py`. It is **not** a runtime dependency. |
| **JSLib** (Affinity SDK convenience library) | not vendored; `src/affinity/sdk.cjs` calls it at runtime and copies call patterns from its examples | BSD 3-Clause, Copyright (c) 2026 Canva Pty Ltd | Provided by Affinity at runtime (`require('/document.js')` etc.). |

```
pyembroidery  MIT License  Copyright (c) 2018 Tatarize
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED ... (full text in the
pyembroidery distribution).
```

## Ink/Stitch (GPL-3.0) - decision record

Ink/Stitch is licensed GPLv3. **No Ink/Stitch code was read, ported or translated.** The stitch algorithms in
`src/stitch/` (tatami fill with serpentine chaining, satin from rails with underlays and short stitches, running/bean
stitch, contour fill) and the planner in `src/plan/` were written from general knowledge of how embroidery stitch
generation works and from the public documentation of what the features do. Ink/Stitch is credited as the
**inspiration** for the feature set and for the parameter names users will recognise; behaviour is *not* guaranteed to
match it stitch-for-stitch.

The thread palette JSON files in `src/data/palette-*.json` are **placeholders** with approximate colours (not copied
from any vendor chart or from Ink/Stitch's palettes) - see README.
