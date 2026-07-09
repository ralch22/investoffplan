/**
 * Zero-dependency, server-rendered inline-SVG trend chart. Renders into the HTML
 * at build time — crawlable, no layout shift, no client JS, themeable via CSS.
 * Right tool for small time-series on SSG/Workers pages (vs a client chart lib).
 */
export interface TrendPoint {
  /** x-axis tick label, e.g. "J". */
  label: string;
  value: number;
  /** Native hover tooltip text, e.g. "2025-03: AED 1,493/sqft". */
  title?: string;
}

interface TrendChartProps {
  points: TrendPoint[];
  /** Accessible description of the whole series. */
  ariaLabel: string;
  /** SVG height in px (width is fluid via viewBox). */
  height?: number;
  className?: string;
}

const W = 720; // viewBox width; scales fluidly to container
const PAD_Y = 14;

export function TrendChart({ points, ariaLabel, height = 120, className }: TrendChartProps) {
  if (points.length < 2) return null;

  const H = height;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  const x = (i: number) => (points.length === 1 ? W / 2 : (i / (points.length - 1)) * W);
  const y = (v: number) => H - PAD_Y - ((v - min) / span) * (H - PAD_Y * 2);

  const linePts = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`);
  const linePath = `M${linePts.join(" L")}`;
  const areaPath = `M${x(0).toFixed(1)},${H} L${linePts.join(" L")} L${x(points.length - 1).toFixed(1)},${H} Z`;

  const maxI = values.indexOf(max);
  const minI = values.indexOf(min);
  const lastI = points.length - 1;
  const gid = `tc-${ariaLabel.replace(/[^a-z0-9]/gi, "").slice(0, 16)}`;

  return (
    <figure className={className} role="img" aria-label={ariaLabel}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        className="overflow-visible text-brand"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baseline + midline gridlines */}
        {[0.5].map((f) => (
          <line
            key={f}
            x1="0"
            x2={W}
            y1={PAD_Y + f * (H - PAD_Y * 2)}
            y2={PAD_Y + f * (H - PAD_Y * 2)}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={areaPath} fill={`url(#${gid})`} />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* min / max / latest markers with native tooltips */}
        {[minI, maxI, lastI].map((i, k) => (
          <g key={`${i}-${k}`}>
            <circle
              cx={x(i)}
              cy={y(points[i].value)}
              r={i === lastI ? 4 : 3}
              fill={i === lastI ? "currentColor" : "white"}
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {points[i].title ? <title>{points[i].title}</title> : null}
          </g>
        ))}

        {/* invisible hover targets per point for native tooltips across the whole line */}
        {points.map((p, i) => (
          <rect
            key={p.label + i}
            x={x(i) - W / points.length / 2}
            y="0"
            width={W / points.length}
            height={H}
            fill="transparent"
          >
            {p.title ? <title>{p.title}</title> : null}
          </rect>
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-0.5" aria-hidden>
        {points.map((p, i) => (
          <span key={p.label + i} className="text-[10px] tabular-nums text-muted-light">
            {p.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
