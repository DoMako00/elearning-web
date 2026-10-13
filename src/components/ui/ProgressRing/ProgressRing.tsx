/**
 * Shared SVG progress ring primitive.
 *
 * Encapsulates only the circumference math and SVG markup — no opinions
 * about layout, label text, or surrounding wrappers. Callers pass their own
 * size / radius / colour so that each usage site can look completely different
 * while sharing the same underlying calculation.
 *
 * Usage examples
 * ──────────────
 * Home / WeeklyGoalCard (120 px ring, r=50):
 *   <ProgressRing size={120} radius={50} percentage={60} />
 *
 * Calendar / Study Goal widget (76 px ring, r=30):
 *   <ProgressRing size={76} radius={30} percentage={42}
 *                 trackColor="#eef2ef" progressColor="#087f55" strokeWidth={7} />
 */

interface ProgressRingProps {
  /** Outer size of the <svg> element in px (width = height). */
  size: number;
  /** Radius of the progress circle in px. */
  radius: number;
  /** Progress value 0–100. Values outside this range are clamped. */
  percentage: number;
  /** Width of both the track and progress strokes. @default 8 */
  strokeWidth?: number;
  /** CSS color string for the background track circle. */
  trackColor?: string;
  /** CSS color string for the progress arc. */
  progressColor?: string;
  /** Extra className applied to the <svg> element. */
  className?: string;
  /** aria-label for the <svg> (defaults to "Progress: {percentage}%"). */
  ariaLabel?: string;
}

export function ProgressRing({
  size,
  radius,
  percentage,
  strokeWidth = 8,
  trackColor = "var(--color-surface-hover)",
  progressColor = "var(--color-brand)",
  className,
  ariaLabel,
}: ProgressRingProps) {
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference * (1 - clampedPct / 100);
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      role="img"
      aria-label={ariaLabel ?? `Progress: ${clampedPct}%`}
      className={className}
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke={progressColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
