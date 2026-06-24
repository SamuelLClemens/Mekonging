#!/usr/bin/env bash
#
# sync-web.sh — copy the Mekonging web app into the iOS app's bundled "Web" folder.
#
# The Xcode target includes "Web" as a FOLDER REFERENCE (blue folder), so whatever is
# in it at build time is copied verbatim into the app bundle and served offline by the
# WKWebView wrapper (see ContentView.swift).
#
# Run this once before the first build, and again whenever the web app changes, then
# rebuild in Xcode. The Web copy is git-ignored (it is a build input regenerated here),
# so the repository stays lean.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEST="$SCRIPT_DIR/Mekonging/Mekonging/Web"

ITEMS=(index.html manifest.webmanifest sw.js css js lib img icons)

echo "Source : $REPO_ROOT"
echo "Dest   : $DEST"

rm -rf "$DEST"
mkdir -p "$DEST"

for item in "${ITEMS[@]}"; do
  if [ -e "$REPO_ROOT/$item" ]; then
    cp -R "$REPO_ROOT/$item" "$DEST/"
  else
    echo "  warning: $item not found, skipping"
  fi
done

COUNT="$(find "$DEST" -type f | wc -l | tr -d ' ')"
SIZE="$(du -sh "$DEST" | cut -f1)"
echo "Synced $COUNT files ($SIZE) into Web/. Rebuild in Xcode to pick up changes."
