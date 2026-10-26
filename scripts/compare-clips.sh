#!/usr/bin/env bash
# Build a vertical (1080x1920) side-by-side or ghosted comparison of two video
# clips, sized for Instagram Reels / Stories.
#
# Usage:
#   scripts/compare-clips.sh -a campbell.mp4 -b skattebo.mp4 -o out.mp4 \
#     -A "1978 - Earl Campbell" -B "2026 - Cam Skattebo" \
#     -T "SAME RUN. 48 YEARS APART." -K "One is in the Hall of Fame." \
#     -s 3.5 -S 1.0 -x 2 -X 2
#
# Alignment:  -s / -S  seek each clip so both hit contact at the same moment.
# Slow motion: -x / -X  per-clip factor (2 = half speed). Source is trimmed
#              proportionally so each pane still fills -d seconds of output.
#              -I smooths slowed footage via motion interpolation (slow encode).
#
# Requires ffmpeg built with libfreetype (drawtext).

set -euo pipefail

CLIP_A=""; CLIP_B=""; OUT="comparison.mp4"
LABEL_A="Then"; LABEL_B="Now"
TITLE=""; KICKER=""
DURATION=8; MODE="stack"
START_A=0; START_B=0
SLOW_A=1; SLOW_B=1; INTERP=0
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FPS=30

usage() { sed -n '2,18p' "$0"; exit 1; }

while getopts "a:b:o:A:B:T:K:d:m:s:S:x:X:If:h" opt; do
  case "$opt" in
    a) CLIP_A=$OPTARG ;;  b) CLIP_B=$OPTARG ;;  o) OUT=$OPTARG ;;
    A) LABEL_A=$OPTARG ;; B) LABEL_B=$OPTARG ;;
    T) TITLE=$OPTARG ;;   K) KICKER=$OPTARG ;;
    d) DURATION=$OPTARG ;; m) MODE=$OPTARG ;;
    s) START_A=$OPTARG ;; S) START_B=$OPTARG ;;
    x) SLOW_A=$OPTARG ;;  X) SLOW_B=$OPTARG ;;
    I) INTERP=1 ;;
    f) FONT=$OPTARG ;;    h|*) usage ;;
  esac
done

[ -n "$CLIP_A" ] && [ -n "$CLIP_B" ] || usage
for f in "$CLIP_A" "$CLIP_B"; do
  [ -f "$f" ] || { echo "error: no such file: $f" >&2; exit 1; }
done
[ -f "$FONT" ] || { echo "error: font not found: $FONT" >&2; exit 1; }
for v in "$SLOW_A" "$SLOW_B"; do
  awk -v x="$v" 'BEGIN{exit !(x+0 > 0)}' || { echo "error: slow factor must be > 0: $v" >&2; exit 1; }
done

W=1080; H=1920
if [ "$MODE" = "overlay" ]; then PANE_H=1480; else PANE_H=740; fi
TOP_Y=220
BOT_Y=1000

# Slowing footage by N stretches it N-fold, so only DURATION/N seconds of
# source are needed to fill a DURATION-second pane.
SRC_A=$(awk -v d="$DURATION" -v x="$SLOW_A" 'BEGIN{printf "%.4f", d/x}')
SRC_B=$(awk -v d="$DURATION" -v x="$SLOW_B" 'BEGIN{printf "%.4f", d/x}')

# drawtext chokes on ':' and friends inside the filtergraph, so pass text via
# files instead of inline strings.
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
printf '%s' "$LABEL_A" > "$TMP/la.txt"
printf '%s' "$LABEL_B" > "$TMP/lb.txt"
printf '%s' "$TITLE"   > "$TMP/title.txt"
printf '%s' "$KICKER"  > "$TMP/kick.txt"

# Scale-to-fill then centre-crop each pane so clips of any aspect ratio work.
geom="scale=${W}:${PANE_H}:force_original_aspect_ratio=increase,crop=${W}:${PANE_H},setsar=1"

# Duplicated frames read as judder; interpolation invents the in-between ones.
if [ "$INTERP" = "1" ]; then
  smooth="minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:vsbmc=1"
else
  smooth="fps=${FPS}"
fi
chain_a="setpts=${SLOW_A}*PTS,${geom},${smooth}"
chain_b="setpts=${SLOW_B}*PTS,${geom},${smooth}"

if [ "$MODE" = "overlay" ]; then
  GEOM="[0:v]${chain_a}[a];[1:v]${chain_b}[b];\
[a][b]blend=all_mode=normal:all_opacity=0.5[m];\
[bg][m]overlay=0:${TOP_Y}[v0]"
  LA_Y=260; LB_Y=1620
else
  GEOM="[0:v]${chain_a}[a];[1:v]${chain_b}[b];\
[bg][a]overlay=0:${TOP_Y}[v1];[v1][b]overlay=0:${BOT_Y}[v0]"
  LA_Y=$((TOP_Y+PANE_H-72)); LB_Y=$((BOT_Y+PANE_H-72))
fi

LABELS="drawtext=fontfile=${FONT}:textfile=${TMP}/la.txt:fontcolor=white:fontsize=42:x=40:y=${LA_Y}:box=1:boxcolor=black@0.6:boxborderw=16,\
drawtext=fontfile=${FONT}:textfile=${TMP}/lb.txt:fontcolor=white:fontsize=42:x=40:y=${LB_Y}:box=1:boxcolor=black@0.6:boxborderw=16"

CHROME="drawtext=fontfile=${FONT}:textfile=${TMP}/title.txt:fontcolor=white:fontsize=58:x=(w-text_w)/2:y=96,\
drawtext=fontfile=${FONT}:textfile=${TMP}/kick.txt:fontcolor=0xF5C542:fontsize=44:x=(w-text_w)/2:y=1812"

ffmpeg -hide_banner -loglevel error -y \
  -ss "$START_A" -t "$SRC_A" -i "$CLIP_A" \
  -ss "$START_B" -t "$SRC_B" -i "$CLIP_B" \
  -f lavfi -t "$DURATION" -i "color=c=0x0A0A0A:s=${W}x${H}:r=${FPS}" \
  -filter_complex "[2:v]null[bg];${GEOM};[v0]${LABELS},${CHROME}[out]" \
  -map "[out]" -an \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart \
  "$OUT"

echo "wrote $OUT"
ffprobe -hide_banner -loglevel error -show_entries format=duration:stream=width,height \
  -of default=noprint_wrappers=1 "$OUT"
