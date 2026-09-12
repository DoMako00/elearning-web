import type { AdminOverviewDashboard } from "./adminApi.types";

export const medwayOverviewDashboard: AdminOverviewDashboard = {
  metrics: [
    { id: "students", label: "Total Students", value: 3215, format: "integer", trendDirection: "up", trendPercentage: 12.4, comparisonLabel: "vs last month", sparkline: [22, 25, 24, 29, 31, 38, 41], accessibleTrend: "Up 12.4 percent compared with last month" },
    { id: "courses", label: "Active Courses", value: 84, format: "integer", trendDirection: "up", trendPercentage: 8.7, comparisonLabel: "vs last month", sparkline: [18, 21, 19, 24, 20, 22, 28], accessibleTrend: "Up 8.7 percent compared with last month" },
    { id: "instructors", label: "Instructors", value: 148, format: "integer", trendDirection: "up", trendPercentage: 6.3, comparisonLabel: "vs last month", sparkline: [17, 20, 19, 24, 22, 27, 30], accessibleTrend: "Up 6.3 percent compared with last month" },
    { id: "revenue", label: "Revenue (MTD)", value: 82350, format: "currency", currency: "EGP", trendDirection: "up", trendPercentage: 15.8, comparisonLabel: "vs last month", sparkline: [19, 24, 23, 29, 27, 35, 38], accessibleTrend: "Up 15.8 percent compared with last month" },
  ],
  enrollment: { total: 1630, trendPercentage: 14.6, points: [
    { label: "May 1", current: 180, previous: 160 }, { label: "May 5", current: 430, previous: 280 }, { label: "May 9", current: 520, previous: 390 }, { label: "May 13", current: 880, previous: 480 }, { label: "May 17", current: 670, previous: 560 }, { label: "May 21", current: 760, previous: 520 }, { label: "May 25", current: 1110, previous: 610 }, { label: "May 29", current: 1240, previous: 590 }, { label: "Jun 1", current: 1630, previous: 940 },
  ] },
  traffic: { total: 18240, trendPercentage: 11.2, sparkline: [19, 24, 21, 27, 25, 31, 29], sources: [
    { id: "organic", label: "Organic Search", value: 9820, percentage: 53.8, tone: "success" }, { id: "direct", label: "Direct", value: 5320, percentage: 29.2, tone: "success" }, { id: "referral", label: "Referral", value: 2200, percentage: 12.1, tone: "success" }, { id: "social", label: "Social Media", value: 900, percentage: 4.9, tone: "success" },
  ] },
  orders: { total: 842, trendPercentage: 9.3, statuses: [
    { id: "completed", label: "Completed", value: 708, percentage: 84.1, tone: "success" }, { id: "pending", label: "Pending", value: 96, percentage: 11.4, tone: "warning" }, { id: "cancelled", label: "Cancelled", value: 38, percentage: 4.5, tone: "danger" },
  ] },
  recentActivity: [
    { id: "med-act-1", kind: "student", title: "New student registered", detail: "Nour joined Medway", relativeTime: "2m ago" },
    { id: "med-act-2", kind: "course", title: "Course published", detail: "Cardiovascular Foundations", relativeTime: "15m ago" },
    { id: "med-act-3", kind: "instructor", title: "Instructor added", detail: "A new Medway assignment", relativeTime: "1h ago" },
    { id: "med-act-4", kind: "payment", title: "Payment received", detail: "Order MED-1842 completed", relativeTime: "2h ago" },
    { id: "med-act-5", kind: "content", title: "Content uploaded", detail: "Immunology lecture notes", relativeTime: "3h ago" },
  ],
  pendingReviews: [
    { id: "med-review-1", title: "Autonomic Disorders", detail: "Course update · Teaching team", typeLabel: "Course update", tone: "warning", relativeTime: "2h ago" },
    { id: "med-review-2", title: "Renal System — Module 3", detail: "New module · Medical sciences", typeLabel: "New module", tone: "success", relativeTime: "5h ago" },
    { id: "med-review-3", title: "Pathology of Infections", detail: "Content update · Review queue", typeLabel: "Content update", tone: "neutral", relativeTime: "1d ago" },
  ],
  paymentStatus: { totalRevenue: 82350, currency: "EGP", segments: [
    { id: "paid", label: "Paid", value: 70200, percentage: 85.2, tone: "success" }, { id: "pending", label: "Pending", value: 8950, percentage: 10.9, tone: "warning" }, { id: "failed", label: "Failed", value: 3200, percentage: 3.9, tone: "danger" },
  ] },
};

export const eliteOverviewDashboard: AdminOverviewDashboard = {
  metrics: [
    { id: "students", label: "Total Students", value: 1677, format: "integer", trendDirection: "up", trendPercentage: 9.1, comparisonLabel: "vs last month", sparkline: [18, 20, 23, 22, 28, 30, 33], accessibleTrend: "Up 9.1 percent compared with last month" },
    { id: "courses", label: "Active Courses", value: 44, format: "integer", trendDirection: "up", trendPercentage: 5.2, comparisonLabel: "vs last month", sparkline: [20, 18, 21, 23, 22, 26, 27], accessibleTrend: "Up 5.2 percent compared with last month" },
    { id: "instructors", label: "Instructors", value: 88, format: "integer", trendDirection: "up", trendPercentage: 7.4, comparisonLabel: "vs last month", sparkline: [16, 18, 17, 21, 25, 24, 29], accessibleTrend: "Up 7.4 percent compared with last month" },
    { id: "revenue", label: "Revenue (MTD)", value: 46190, format: "currency", currency: "EGP", trendDirection: "up", trendPercentage: 10.6, comparisonLabel: "vs last month", sparkline: [18, 21, 20, 24, 28, 27, 32], accessibleTrend: "Up 10.6 percent compared with last month" },
  ],
  enrollment: { total: 715, trendPercentage: 10.8, points: [
    { label: "May 1", current: 90, previous: 72 }, { label: "May 5", current: 160, previous: 118 }, { label: "May 9", current: 210, previous: 170 }, { label: "May 13", current: 340, previous: 220 }, { label: "May 17", current: 300, previous: 260 }, { label: "May 21", current: 410, previous: 310 }, { label: "May 25", current: 520, previous: 390 }, { label: "May 29", current: 580, previous: 430 }, { label: "Jun 1", current: 715, previous: 510 },
  ] },
  traffic: { total: 10480, trendPercentage: 8.4, sparkline: [17, 20, 18, 23, 26, 25, 29], sources: [
    { id: "organic", label: "Organic Search", value: 4860, percentage: 46.4, tone: "success" }, { id: "direct", label: "Direct", value: 3720, percentage: 35.5, tone: "success" }, { id: "referral", label: "Referral", value: 1320, percentage: 12.6, tone: "success" }, { id: "social", label: "Social Media", value: 580, percentage: 5.5, tone: "success" },
  ] },
  orders: { total: 445, trendPercentage: 7.1, statuses: [
    { id: "completed", label: "Completed", value: 372, percentage: 83.6, tone: "success" }, { id: "pending", label: "Pending", value: 51, percentage: 11.5, tone: "warning" }, { id: "cancelled", label: "Cancelled", value: 22, percentage: 4.9, tone: "danger" },
  ] },
  recentActivity: [
    { id: "elite-act-1", kind: "course", title: "Clinical track updated", detail: "Elite case-based learning", relativeTime: "4m ago" },
    { id: "elite-act-2", kind: "student", title: "New student registered", detail: "Kareem joined Elite", relativeTime: "21m ago" },
    { id: "elite-act-3", kind: "instructor", title: "Instructor assigned", detail: "Elite clinical teaching team", relativeTime: "1h ago" },
    { id: "elite-act-4", kind: "payment", title: "Payment received", detail: "Order ELT-0945 completed", relativeTime: "2h ago" },
    { id: "elite-act-5", kind: "content", title: "Case brief uploaded", detail: "Clinical Reasoning — Case 4", relativeTime: "4h ago" },
  ],
  pendingReviews: [
    { id: "elite-review-1", title: "Clinical Reasoning — Case 4", detail: "Case update · Clinical team", typeLabel: "Case update", tone: "warning", relativeTime: "1h ago" },
    { id: "elite-review-2", title: "Integrated OSCE Practice", detail: "New course · Skills team", typeLabel: "New course", tone: "success", relativeTime: "6h ago" },
    { id: "elite-review-3", title: "Emergency Medicine Notes", detail: "Content update · Review queue", typeLabel: "Content update", tone: "neutral", relativeTime: "1d ago" },
  ],
  paymentStatus: { totalRevenue: 46190, currency: "EGP", segments: [
    { id: "paid", label: "Paid", value: 39150, percentage: 84.8, tone: "success" }, { id: "pending", label: "Pending", value: 5040, percentage: 10.9, tone: "warning" }, { id: "failed", label: "Failed", value: 2000, percentage: 4.3, tone: "danger" },
  ] },
};
