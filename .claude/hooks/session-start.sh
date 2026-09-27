#!/bin/bash
# Prepares HyperFrames video rendering in Claude Code on the web sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

npm install

if ! command -v ffmpeg >/dev/null 2>&1; then
  (apt-get install -y ffmpeg || (apt-get update && apt-get install -y ffmpeg)) >/dev/null
fi

npx hyperframes browser ensure >/dev/null
