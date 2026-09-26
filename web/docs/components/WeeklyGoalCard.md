# 🎯 WeeklyGoalCard Component
# توثيق كارت الهدف الأسبوعي (Weekly Goal Card)

---

## 🇺🇸 English Documentation

### 1. Overview
The `WeeklyGoalCard` tracks the student's study hours towards their weekly target. It features a prominent radial progress ring (SVG gauge) indicating completion percentage (e.g. 75%), target hours display (e.g. "9 / 12 hours"), motivational micro-copy with a fire emoji, and a 7-day dot completion tracker (S M T W T F S).

### 2. File Location & Types
- **Component TSX**: `src/components/ui/WeeklyGoalCard/WeeklyGoalCard.tsx`
- **Stylesheet**: `src/components/ui/WeeklyGoalCard/WeeklyGoalCard.css`
- **TypeScript Types**: `src/components/ui/WeeklyGoalCard/weekly-goal-card.types.ts`
- **Props Interface**:
  ```typescript
  export interface WeeklyGoalCardProps {
    completedHours?: number;       // Hours completed this week (Default: 9)
    targetHours?: number;          // Target hours for the week (Default: 12)
    completedDays?: boolean[];     // Array of 7 booleans for S-M-T-W-T-F-S
  }
  ```

### 3. Key Features & Implementation Logic
1. **Mathematical SVG Progress Ring**:
   - Calculated dynamically using circle circumference formula:
     ```typescript
     const RING_RADIUS = 50;
     const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~314.159
     const progressOffset = RING_CIRCUMFERENCE * (1 - percentage / 100);
     ```
   - Scaled with CSS variables `--weekly-goal-ring-size` to fit nicely without cutting off text.
2. **7-Day Status Indicator Dots**:
   - Maps through `WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"]`.
   - Completed days render with green brand background + halo glow (`shadow-[0_0_0_1.5px_#d1fae5]`).
   - Incomplete days render with hollow outline (`border-[#94a3b8]`).
3. **Container Query Scaling**:
   - `@container bento-slot (max-height: 300px)` scales the ring and compacts vertical margins to guarantee zero content clipping on compact laptop displays.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. الكارت بيعمل إيه؟
الكارت ده بيتابع ساعات المذاكرة بتاعت الطالب أسبوعياً. فيه دايرة كبيرة خضرا (SVG Progress Ring) بتعرض نسبة الإنجاز (مثلاً 75%)، وعدد الساعات اللي ذاكرها من الإجمالي (9 من 12 ساعة)، مع أيام الأسبوع السبعة بنقط خضرا للأيام اللي ذاكر فيها.

### 2. طريقة الحساب والتصميم
1. **الدايرة والنسبة المئوية (SVG Ring)**:
   - بتتحسب تلقائياً من المعادلة الرياضية لمحيط الدايرة (`2 * π * r`) وتغير طول الخط الأخضر بالظبط حسب عدد الساعات.
2. **شريط الأيام السبعة (S M T W T F S)**:
   - كل يوم الطالب ذاكر فيه بيظهر بنقطة خضرا منورة بهالة خفيفة، واليوم اللي ما ذاكرش فيه بيفضل دايرة رمادية مفرغة.
3. **التجاوب مع الشاشات**:
   - حجم الدايرة والمسافات بيتغيروا تلقائياً مع حجم الخانة عشان مفيش كلام يختفي في الشاشات الصغيرة.
