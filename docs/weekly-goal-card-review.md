# Weekly Goal Card Review

## Review scope

This review covers the latest commit on branch `dev`:

- Commit: `3a71d92 feat(progress): add weekly goal card`
- Reference image: [`docs/reference/weekly-goal-card.png`](./reference/weekly-goal-card.png)
- Compared implementation: `web/src/components/ui/WeeklyGoalCard/WeeklyGoalCard.tsx`

الهدف من المراجعة هو التأكد من قرب المكوّن من بطاقة **Weekly Goal** الظاهرة في الصورة، مع عدم تعديل كود الواجهة أثناء التوثيق.

## Executive summary

The component is a close implementation of the isolated Weekly Goal card shown in the reference image. Its default data produces the same core values as the reference: `75%`, `9 / 12 hours`, six completed days, and one incomplete day.

However, the commit does not yet integrate `WeeklyGoalCard` into the student dashboard. The component is exported but is not referenced by any route, page, or dashboard layout. Therefore, the commit matches the card concept and its internal content, but it does not implement the full dashboard composition shown in the reference image.

## Match assessment

| Area | Result | Notes |
| --- | --- | --- |
| Card title | Match | Uses `Weekly Goal`. |
| Progress value | Match | Defaults to `9 / 12`, calculated as `75%`. |
| Progress ring | Match | Uses a green SVG ring with a muted track and rounded progress caps. |
| Supporting copy | Match | Includes `of weekly goal`, `9 / 12 hours`, and `Keep it up! 🔥`. |
| Weekly indicators | Match | Seven day indicators with six completed states and one open state. |
| Card structure | Close match | Header, options button, ring, summary, and day row follow the reference hierarchy. |
| Colors | Close match | Uses the existing green brand token and neutral surface/border tokens. |
| Options icon | Review note | The implementation uses `SlidersHorizontal`; the reference appears to use a compact settings/options glyph. This is a low-priority visual difference. |
| Dashboard integration | Not complete | No route or dashboard page currently renders the component. |

## Protected areas and risk review

- No existing animation, transition, scroll effect, timeline, GSAP, or Framer Motion logic is touched by this commit.
- No animation-dependent selectors, refs, IDs, or data attributes are changed.
- The component is self-contained and exposes only optional numeric progress props and an optional boolean day-state array.
- The options button is currently visual-only; it has an accessible label but no action handler. This is acceptable for a static card review, but it should be connected to a menu or settings flow before production use.

## Verification performed

The following checks passed against the current `web` project:

```text
npm run typecheck  PASS
npm run build      PASS
git diff --check   PASS
```

The build completed successfully with Vite after TypeScript compilation.

## Recommendation

The card implementation can be accepted as a reusable UI component for the Weekly Goal design, with the options icon treated as a minor polish item. The next implementation step should be wiring it into the student dashboard grid and validating its dimensions at the reference viewport and at mobile breakpoints.

لا يُنصح باعتبار الـ commit تنفيذًا كاملًا للصورة قبل إضافة المكوّن إلى صفحة الـ dashboard وربطه ببيانات حقيقية أو state واضح.

## Files reviewed

- `web/src/components/ui/WeeklyGoalCard/WeeklyGoalCard.tsx`
- `web/src/components/ui/WeeklyGoalCard/index.ts`
- `web/src/components/ui/WeeklyGoalCard/weekly-goal-card.types.ts`
- `web/src/app/router/student.routes.tsx`
- `web/src/components/layout/AppShell/AppShell.tsx`

## Out-of-scope workspace state

The root repository contains an unrelated untracked directory, `elearning-web/`, which appears to be a separate Git repository. It was intentionally not modified or included in this documentation commit.
