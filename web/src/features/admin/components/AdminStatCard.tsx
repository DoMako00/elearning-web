import { ArrowDownRight, ArrowUpRight, MoreHorizontal, type LucideIcon } from "lucide-react";
import type { AdminOverviewMetric } from "../api";

function metricValue(metric: AdminOverviewMetric) {
  if (metric.format === "currency") return new Intl.NumberFormat("en-EG", { style: "currency", currency: metric.currency ?? "EGP", maximumFractionDigits: 0 }).format(metric.value);
  return new Intl.NumberFormat("en-EG").format(metric.value);
}

function Sparkline({ values }: { values: readonly number[] }) {
  const max = Math.max(...values); const min = Math.min(...values); const range = max - min || 1;
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 64},${32 - ((value - min) / range) * 24}`).join(" ");
  return <svg className="admin-sparkline" viewBox="0 0 64 36" aria-hidden="true" preserveAspectRatio="none"><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg>;
}

export function AdminStatCard({ metric, icon: Icon }: { metric: AdminOverviewMetric; icon: LucideIcon }) {
  const TrendIcon = metric.trendDirection === "up" ? ArrowUpRight : ArrowDownRight;
  return <article className="admin-stat-card">
    <span className="admin-stat-card__icon"><Icon aria-hidden="true" /></span>
    <div className="admin-stat-card__content"><span className="admin-stat-card__label">{metric.label}</span><strong>{metricValue(metric)}</strong><span className={`admin-trend is-${metric.trendDirection}`} aria-label={metric.accessibleTrend}><TrendIcon aria-hidden="true" />{metric.trendPercentage}% <small>{metric.comparisonLabel}</small></span></div>
    <button className="admin-card-menu" type="button" aria-label={`More options for ${metric.label}`}><MoreHorizontal aria-hidden="true" /></button>
    <Sparkline values={metric.sparkline} />
  </article>;
}

export { Sparkline as AdminTrendSparkline };
