// MMG Quadrant D chart — SVG geometry ported exactly from the working
// MMG Coach Studio (mmg-coach-studio/index.html, "Quadrant chart geometry").
// The quadrant boxes divide at x=150 and y=118, and the scoring rule is
// Quadrant D = rigor>=4 AND relevance>=4, so the dividers must correspond to
// rigor 3.5 and relevance 3.5 — otherwise a dot renders in a different
// quadrant than its own caption claims. Both axes are inset by the dot radius
// (QPAD) so a perfect 6/5 doesn't draw on the border and overlap the label.
// Verified correct for all 30 rigor×relevance combos — do not re-derive.

export interface QuadrantPoint {
  rigor: number;
  relevance: number;
  quadrant: string;
}

export const QNAMES: Record<string, string> = {
  A: "Acquisition",
  B: "Application",
  C: "Assimilation",
  D: "Adaptation",
};

const QX0 = 46, QX1 = 254, QY0 = 222, QY1 = 14, QPAD = 9;
const QXMID = 150, QYMID = 118;

// relevance: 1..3 sit left of the divider, 4..5 right of it (boundary = 3.5)
function qx(rel: number): number {
  const v = Math.max(1, Math.min(5, Number(rel) || 1));
  return v <= 3.5
    ? (QX0 + QPAD) + ((v - 1) / 2.5) * (QXMID - (QX0 + QPAD))
    : QXMID + ((v - 3.5) / 1.5) * ((QX1 - QPAD) - QXMID);
}

// rigor: 1..3 below QYMID, 4..6 above (y grows downward)
function qy(rig: number): number {
  const v = Math.max(1, Math.min(6, Number(rig) || 1));
  return v <= 3.5
    ? (QY0 - QPAD) - ((v - 1) / 2.5) * ((QY0 - QPAD) - QYMID)
    : QYMID - ((v - 3.5) / 2.5) * (QYMID - (QY1 + QPAD));
}

export function QuadrantChart({
  points,
  gradientId = "mmgDgrad",
}: {
  points: QuadrantPoint[];
  // Unique per instance if two charts ever share a page
  gradientId?: string;
}) {
  const trail =
    points.length > 1
      ? points
          .map((p, i) => (i ? "L" : "M") + qx(p.relevance).toFixed(1) + "," + qy(p.rigor).toFixed(1))
          .join(" ")
      : null;

  return (
    <svg
      viewBox="0 0 300 250"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Rigor and relevance quadrant chart"
      className="w-full h-auto block"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF8BAE" stopOpacity=".28" />
          <stop offset="100%" stopColor="#FF8F8B" stopOpacity=".5" />
        </linearGradient>
      </defs>
      {/* quadrant fills: origin bottom-left (low rigor, low relevance) */}
      <rect x="46" y="118" width="104" height="104" fill="#F4F0F1" />
      <rect x="150" y="118" width="104" height="104" fill="#FFF4E2" />
      <rect x="46" y="14" width="104" height="104" fill="#EFE9F7" />
      <rect x="150" y="14" width="104" height="104" fill={`url(#${gradientId})`} stroke="#FF8BAE" strokeWidth="1.5" />
      {/* labels */}
      <text x="54" y="215" fontFamily="Open Sans, sans-serif" fontSize="9" fontWeight="700" fill="#7c7c78">A · ACQUISITION</text>
      <text x="158" y="215" fontFamily="Open Sans, sans-serif" fontSize="9" fontWeight="700" fill="#7a5410">B · APPLICATION</text>
      <text x="54" y="26" fontFamily="Open Sans, sans-serif" fontSize="9" fontWeight="700" fill="#4b2f76">C · ASSIMILATION</text>
      <text x="158" y="26" fontFamily="Open Sans, sans-serif" fontSize="9" fontWeight="800" fill="#1D1D1B">D · ADAPTATION</text>
      {/* axes */}
      <line x1="46" y1="222" x2="254" y2="222" stroke="#1D1D1B" strokeWidth="1.5" />
      <line x1="46" y1="14" x2="46" y2="222" stroke="#1D1D1B" strokeWidth="1.5" />
      <text x="150" y="242" textAnchor="middle" fontFamily="Open Sans, sans-serif" fontSize="9.5" fontWeight="700" fill="#4a4a47">RELEVANCE →</text>
      <text x="14" y="118" textAnchor="middle" fontFamily="Open Sans, sans-serif" fontSize="9.5" fontWeight="700" fill="#4a4a47" transform="rotate(-90 14 118)">RIGOR →</text>
      {/* dashed trail through earlier turns */}
      {trail && (
        <path d={trail} fill="none" stroke="#8A5FBE" strokeWidth="1.5" strokeDasharray="3 3" opacity=".5" />
      )}
      {/* one dot per scored turn — latest is large ink/pink, earlier are small white/lavender */}
      {points.map((p, i) => {
        const last = i === points.length - 1;
        return (
          <circle
            key={i}
            cx={qx(p.relevance)}
            cy={qy(p.rigor)}
            r={last ? 7 : 4}
            fill={last ? "#1D1D1B" : "#fff"}
            stroke={last ? "#FF8BAE" : "#8A5FBE"}
            strokeWidth={last ? 3 : 1.5}
          >
            <title>{`Turn ${i + 1}: rigor ${p.rigor}/6, relevance ${p.relevance}/5 → Quadrant ${p.quadrant}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}
