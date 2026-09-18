import { adminCourseFixtures } from "../courses/adminCourses.fixtures";
import { adminInstructorFixtures } from "../instructors/adminInstructors.fixtures";
import type { AdminBrandView, AdminOverviewBreakdownItem, AdminOverviewDashboard, AdminOverviewMetric } from "./adminApi.types";
import { eliteOverviewDashboard, medwayOverviewDashboard } from "./adminOverview.fixtures";

const percentage = (value: number, total: number) => total ? Number(((value / total) * 100).toFixed(1)) : 0;
const trend = (current: number, previous: number) => previous ? Number((((current - previous) / previous) * 100).toFixed(1)) : 0;
const metric = (id: AdminOverviewMetric["id"], medway: AdminOverviewMetric, elite: AdminOverviewMetric, value: number, sparkline = medway.sparkline.map((point, index) => point + elite.sparkline[index])): AdminOverviewMetric => { const current = medway.value + elite.value; const previous = current / (1 + ((medway.trendPercentage + elite.trendPercentage) / 200)); return { ...medway, id, value, sparkline, trendPercentage: trend(current, previous), accessibleTrend: `Up ${trend(current, previous)} percent compared with last month` }; };
const combine = (medway: readonly AdminOverviewBreakdownItem[], elite: readonly AdminOverviewBreakdownItem[]) => medway.map((item) => { const other = elite.find((candidate) => candidate.id === item.id); const value = item.value + (other?.value ?? 0); return { ...item, value }; });

export function aggregateAdminOverview(medway = medwayOverviewDashboard, elite = eliteOverviewDashboard): AdminOverviewDashboard {
  const enrollment = medway.enrollment.points.map((point, index) => { const other = elite.enrollment.points[index]; if (!other || other.label !== point.label) throw new Error("Overview fixture time buckets must match before aggregation."); return { label: point.label, current: point.current + other.current, previous: point.previous + other.previous }; });
  const trafficSources = combine(medway.traffic.sources, elite.traffic.sources); const trafficTotal = trafficSources.reduce((sum, item) => sum + item.value, 0); const statuses = combine(medway.orders.statuses, elite.orders.statuses); const ordersTotal = statuses.reduce((sum, item) => sum + item.value, 0); const paymentSegments = combine(medway.paymentStatus.segments, elite.paymentStatus.segments); const totalRevenue = paymentSegments.reduce((sum, item) => sum + item.value, 0);
  const uniqueStudents = new Set(["student-01", "student-02", "student-03", "student-04", "student-04", "student-05", "student-06", "student-07"]).size;
  const uniqueInstructors = adminInstructorFixtures.filter((instructor) => instructor.status === "active" && instructor.brandAssignments.some((assignment) => assignment.status === "active")).length;
  const activeCourses = adminCourseFixtures.filter((course) => course.status !== "archived").length;
  return {
    metrics: [metric("students", medway.metrics[0], elite.metrics[0], uniqueStudents), metric("courses", medway.metrics[1], elite.metrics[1], activeCourses), metric("instructors", medway.metrics[2], elite.metrics[2], uniqueInstructors), metric("revenue", medway.metrics[3], elite.metrics[3], medway.metrics[3].value + elite.metrics[3].value)],
    enrollment: { total: enrollment.at(-1)?.current ?? 0, trendPercentage: trend(enrollment.at(-1)?.current ?? 0, enrollment.at(-1)?.previous ?? 0), points: enrollment },
    traffic: { total: trafficTotal, trendPercentage: trend(medway.traffic.total + elite.traffic.total, (medway.traffic.total / 1.112) + (elite.traffic.total / 1.084)), sparkline: medway.traffic.sparkline.map((point, index) => point + elite.traffic.sparkline[index]), sources: trafficSources.map((item) => ({ ...item, percentage: percentage(item.value, trafficTotal) })) },
    orders: { total: ordersTotal, trendPercentage: trend(ordersTotal, (medway.orders.total / 1.093) + (elite.orders.total / 1.071)), statuses: statuses.map((item) => ({ ...item, percentage: percentage(item.value, ordersTotal) })) },
    recentActivity: [...medway.recentActivity.map((item) => ({ ...item, detail: `${item.detail} · Medway` })), ...elite.recentActivity.map((item) => ({ ...item, detail: `${item.detail} · Elite` }))].slice(0, 5),
    pendingReviews: [...medway.pendingReviews.map((item) => ({ ...item, detail: `${item.detail} · Medway` })), ...elite.pendingReviews.map((item) => ({ ...item, detail: `${item.detail} · Elite` }))].slice(0, 3),
    paymentStatus: { totalRevenue, currency: "EGP", segments: paymentSegments.map((item) => ({ ...item, percentage: percentage(item.value, totalRevenue) })) },
  };
}

export function getAdminOverviewDashboard(view: AdminBrandView): AdminOverviewDashboard { return view === "all" ? aggregateAdminOverview() : view === "medway" ? medwayOverviewDashboard : eliteOverviewDashboard; }
