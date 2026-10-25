#!/usr/bin/env bash
# Build a vertical (1080x1920) side-by-side or ghosted comparison of two video
# clips, sized for Instagram Reels / Stories.
#
# Usage:
#   scripts/compare-clips.sh -a campbell.mp4 -b skattebo.mp4 -o out.mp4 \
#     -A "1978 - Earl Campbell" -B "2026 - Cam Skattebo" \
#     -T "SAME RUN. 48 YEARS APART." -K "One is in the Hall of Fame."
#
# Requires ffmpeg built with libfreetype (drawtext).

set -euo pipefail

CLIP_A=""; CLIP_B=""; OUT="comparison.mp4"
LABEL_A="Then"; LABEL_B="Now"
TITLE=""; KICKER=""
DURATION=8; MODE="stack"
START_A=0; START_B=0
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

usage() { sed -n '2,12p' "$0"; exit 1; }

while getopts "a:b:o:A:B:T:K:d:m:s:S:f:h" opt; do
  case "$opt" in
    a) CLIP_A=$OPTARG ;;  b) CLIP_B=$OPTARG ;;  o) OUT=$OPTARG ;;
    A) LABEL_A=$OPTARG ;; B) LABEL_B=$OPTARG ;;
    T) TITLE=$OPTARG ;;   K) KICKER=$OPTARG ;;
    d) DURATION=$OPTARG ;; m) MODE=$OPTARG ;;
    s) START_A=$OPTARG ;; S) START_B=$OPTARG ;;
    f) FONT=$OPTARG ;;    h|*) usage ;;
  esac
done

[ -n "$CLIP_A" ] && [ -n "$CLIP_B" ] || usage
for f in "$CLIP_A" "$CLIP_B"; do
  [ -f "$f" ] || { echo "error: no such file: $f" >&2; exit 1; }
done
[ -f "$FONT" ] || { echo "error: font not found: $FONT" >&2; exit 1; }

W=1080; H=1920
PANE_H=740          # height of each video pane
TOP_Y=220           # y of the first pane
BOT_Y=1000          # y of the second pane

# drawtext chokes on ':' and friends inside the filtergraph, so pass text via
# files instead of inline strings.
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
printf '%s' "$LABEL_A" > "$TMP/la.txt"
printf '%s' "$LABEL_B" > "$TMP/lb.txt"
printf '%s' "$TITLE"   > "$TMP/title.txt"
printf '%s' "$KICKER"  > "$TMP/kick.txt"

# Scale-to-fill then centre-crop each pane so clips of any aspect ratio work.
fit="scale=${W}:${PANE_H}:force_original_aspect_ratio=increase,crop=${W}:${PANE_H},setsar=1,fps=30"

if [ "$MODE" = "overlay" ]; then
  # Ghosted: B blended on top of A at 50% in a single full-bleed pane.
  GEOM="[0:v]${fit//${PANE_H}/1480}[a];[1:v]${fit//${PANE_H}/1480}[b];\
[a][b]blend=all_mode=normal:all_opacity=0.5[m];\
[bg][m]overlay=0:220[v0]"
  LABELS="drawtext=fontfile=${FONT}:textfile=${TMP}/la.txt:fontcolor=white@0.9:fontsize=40:x=40:y=260:box=1:boxcolor=black@0.55:boxborderw=14,\
drawtext=fontfile=${FONT}:textfile=${TMP}/lb.txt:fontcolor=white@0.9:fontsize=40:x=40:y=1620:box=1:boxcolor=black@0.55:boxborderw=14"
else
  GEOM="[0:v]${fit}[a];[1:v]${fit}[b];\
[bg][a]overlay=0:${TOP_Y}[v1];[v1][b]overlay=0:${BOT_Y}[v0]"
  LABELS="drawtext=fontfile=${FONT}:textfile=${TMP}/la.txt:fontcolor=white:fontsize=42:x=40:y=$((TOP_Y+PANE_H-72)):box=1:boxcolor=black@0.6:boxborderw=16,\
drawtext=fontfile=${FONT}:textfile=${TMP}/lb.txt:fontcolor=white:fontsize=42:x=40:y=$((BOT_Y+PANE_H-72)):box=1:boxcolor=black@0.6:boxborderw=16"
fi

CHROME="drawtext=fontfile=${FONT}:textfile=${TMP}/title.txt:fontcolor=white:fontsize=58:x=(w-text_w)/2:y=96,\
drawtext=fontfile=${FONT}:textfile=${TMP}/kick.txt:fontcolor=0xF5C542:fontsize=44:x=(w-text_w)/2:y=1812"

ffmpeg -hide_banner -loglevel error -y \
  -ss "$START_A" -t "$DURATION" -i "$CLIP_A" \
  -ss "$START_B" -t "$DURATION" -i "$CLIP_B" \
  -f lavfi -t "$DURATION" -i "color=c=0x0A0A0A:s=${W}x${H}:r=30" \
  -filter_complex "[2:v]null[bg];${GEOM};[v0]${LABELS},${CHROME}[out]" \
  -map "[out]" -an \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart \
  "$OUT"

echo "wrote $OUT"
ffprobe -hide_banner -loglevel error -show_entries format=duration:stream=width,height \
  -of default=noprint_wrappers=1 "$OUT"
