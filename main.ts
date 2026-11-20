// Leonida Ledger — the hand-in program for the gta6-trophy-guide-01 entry
// (Node 22, standard library only). The guide itself is the app/ folder beside
// this file: plain static files a browser opens at app/index.html (ES modules,
// CSS and one JSON data file, no build step), fully offline — it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json.
//
// This program copies app/ and screenshots/ into the output directory and
// writes output/dossier.json with the vendored make.fun library: the summary
// the judge reads (the screenshots, the first load's files and bytes, and the
// source). vendor/makefun-frontend.ts is the kit's copy, unchanged — the
// scorer rebuilds dossier.json with its own copy and compares byte for byte,
// so this file must not be edited.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used instead.
// The program is deterministic: two runs over the same files write the same
// bytes, since buildDossier reads only the files it is handed.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps (from the kit's reference/gate.json): only
// text_max_bytes shapes the bytes written; the other limits refuse an entry
// the scorer would refuse anyway (more than 4 screenshots, or one over
// 256 KiB; more than 993 files and directories in app/, or 48 MiB of app
// files — app/ shares /output's own 1,000-entry cap with screenshots/ and
// dossier.json, so the guide is kept well inside them).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
