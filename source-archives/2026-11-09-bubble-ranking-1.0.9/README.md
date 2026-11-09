# Bubble 1.0.9 source archive

Recovered and archived on 2026-11-09. This preserves the latest available cloud source candidate, not a new publication or a claim of phone acceptance. The repository root and existing 1.0.3 website are unchanged.

`candidate/` contains all 19 original editable HTML/CSS/JS/assets and its runtime manifest. The complete candidate exactly matches the independently retained 1.0.9 runtime ZIP. `baseline-1.0.5/`, `core.mjs`, and all six test suites preserve the build and regression inputs. Historical candidate notes are in `SOURCE_NOTES.md`; they are not a new release approval.

## Reproduce

Use Python 3 and Node.js. In this directory run `npm install`, `npm run build`, and `npm test`. The build recreates `bubble-ranking-1.0.9.zip`. No deployment, upload, or submission runs.

The archive adds a dependency/test package.json. The only change to the recovered package.py removes the publishing-account/session record generator and creates the reports directory on a clean checkout. Runtime source, assets, baseline and tests are unchanged. Publishing records, preview QR codes, login/session/account configuration, duplicate ZIPs and generated screenshots are intentionally omitted. They are not build inputs.

## Verification

Both the recovered build and this archive build reproduce the independent runtime ZIP byte-for-byte. All 70 automated checks pass (8 ambience, 17 gameplay including 5000 deterministic frames, 6 layout, 3 platform, 15 ranking DOM, 21 ranking client). These are offline and mocked checks, not real Xiaohongshu API, native permission, Android or iOS acceptance. No browser or phone validation was newly performed during archival.

See `ARCHIVE_MANIFEST.json` for input checksums, retained file checksums and verification scope. Bird audio licensing is retained in `candidate/bird-credits.json`.
