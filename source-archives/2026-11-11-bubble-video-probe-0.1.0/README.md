# Bubble video replay capability probe 0.1.0

Historical independent diagnostic source archived 2026-11-11. This is not the released Bubble game, does not record a real previous game, and is not approved for submission. Its fixed ten-second trace tests Canvas replay, optional WebCodecs/MediaRecorder MP4 output and the native video editor handoff.

The five dist files are the complete directly authored editable source, not discardable build output. They and the three original test scripts are unchanged. No external runtime library is bundled.

Run `python3 run_offline_tests.py` with Python 3, Node.js, ffmpeg (libx264 encoder) and ffprobe available. The runner creates a temporary test fixture with ffmpeg, then runs syntax checks, all seven mocked capability-flow scenarios, the 240-frame mux test, ffprobe checks (H264, 360x640, 24fps, 240 frames, 10 seconds), and full ffmpeg decoding. It makes no platform or network requests. Generated test video is not committed.

test.cjs is the optional historical Playwright browser diagnostic and is retained but was not rerun during archival. Offline mocks are not live WebCodecs, MediaRecorder, native editor, Android or iOS validation.

session.json, upload/preview logs, configuration, QR codes, publish drafts, copied platform documentation, rendered reports and duplicate ZIPs are deliberately excluded. No credentials or private user records are included. No new license grant is introduced. No deployment or platform action is performed. See ARCHIVE_MANIFEST.json.
