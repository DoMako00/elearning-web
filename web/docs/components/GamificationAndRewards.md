# 🎮 Gamification: Streak Analytics & XP Rewards System
# توثيق نظام التحفيز: تحليلات الستريك ومكافآت نقاط الخبرة (Streak & XP)

---

## 🇺🇸 English Documentation

### 1. Overview
The platform incorporates a gamification system engineered to boost student retention and daily learning consistency via streak tracking, activity heatmaps, milestone popups, and instant XP reward animations.

### 2. Architecture & File Structure
- **Streak Analytics (`src/components/ui/StreakAnalytics/`)**:
  - `StreakAnalytics.tsx`: Master view assembling heatmaps, stats, and milestone cards.
  - `ActivityHeatmap.tsx`: GitHub-style calendar matrix plotting daily study consistency over weeks and months.
  - `MetricCards.tsx`: Summary tiles displaying Current Streak, Best Streak, and Total Active Days.
  - `MilestoneBadges.tsx`: Milestone awards (3-day, 7-day, 30-day, 100-day streaks).
  - `StreakMilestoneModal.tsx`: Celebratory popup triggered when reaching major consistency milestones.
- **XP Rewards System (`src/components/ui/XPRewards/`)**:
  - `useXPRewards.ts`: Custom hook managing XP balances, tier leveling, and reward queue triggers.
  - `XPRewardModal.tsx`: High-impact modal celebrating XP gains with animated particle bursts and sound/visual effects.
  - `LevelUpModal.tsx`: Prompts celebrating student level promotions with unlocked perks.

### 3. Core Capabilities
- **Habit Formation**: Encourages daily login and session completion.
- **Visual Feedback**: Real-time progress bars towards the next level and celebration modals upon course/quiz completion.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة نظام التحفيز والـ Gamification (Overview)
النظام ده مصمم مخصوص عشان يشجع الطالب يذاكر كل يوم بانتظام من خلال تتبع أيام المذاكرة المتتالية (Streak) ومكافأته بنقاط خبرة (XP) ومستويات يترقى فيها زي الألعاب.

### 2. المكونات وطريقة عملها
1. **خريطة النشاط اليومي (ActivityHeatmap)**:
   - شبكة مربعات خضرا شبيهة بنظام GitHub بتوضح للطالب الأيام اللي ذاكر فيها وكثافة مذاكرته على مدار السنة.
2. **كروت الستريك (MetricCards & MilestoneBadges)**:
   - بتوضح الستريك الحالي (مثلاً 5 أيام ورا بعض)، أطول فترة استمرار، وبادجات الإنجاز (3 أيام، أسبوع، شهر...).
3. **مكافآت الـ XP والترقية (XPRewards & LevelUpModal)**:
   - أول ما الطالب يخلص درس أو يحل كويز، بيظهر له كارت احتفالي بنقاط الـ XP المكتسبة وشريط تقدم المستوى، ولما يوصل لمستوى جديد بيفتح له Level Up بمؤثرات بصرية مميزة.
