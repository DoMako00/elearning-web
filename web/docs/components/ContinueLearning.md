# 📖 ContinueLearning Component
# توثيق كارت متابعة التعلم (Continue Learning)

---

## 🇺🇸 English Documentation

### 1. Overview
The `Continue_learning` component is the primary focal point of the dashboard. It displays the student's active course, image thumbnail with hover play button, status badge, two-line responsive course title, a progress bar matching the title width, and action buttons ("Continue Lesson" + stateful Bookmark toggle).

### 2. File Location & Interfaces
- **Component TSX**: `src/components/ui/Continue_Learning/continue_learning.tsx`
- **Stylesheet**: `src/components/ui/Continue_Learning/index.css`
- **Component Props**:
  ```typescript
  interface Continue_learningProps {
    title?: string;               // Section title (Default: "Continue Learning")
    courseName?: string;          // Course name (Default: "Advanced UI/UX Design")
    status?: string;              // Badge text (Default: "In Progress")
    currentLesson?: number;       // Current lesson number (Default: 6)
    totalLessons?: number;        // Total lesson count (Default: 12)
    progressPercentage?: number;  // Percentage value 0-100 (Default: 60)
    imageSrc?: string;            // Thumbnail asset URL
    onContinue?: () => void;      // Action handler for primary CTA button
  }
  ```

### 3. Key Features & Implementation Logic
1. **Interactive Bookmark Toggle**:
   - Managed via React `useState<boolean>(false)`.
   - Clicking toggles green filled state (`fill-current`), active border, and accessible `aria-pressed` state.
2. **Constrained 2-Line Heading & Progress Wrapper**:
   - Encapsulated within `.continue-learning-title-metrics-wrap`.
   - Uses `max-width: min(100%, 20.5ch)` to ensure the heading breaks into two natural lines (e.g. "Advanced" on line 1, "UI/UX Design" on line 2).
   - The progress track bar (`.continue-learning-progress-track`) is bound inside this wrapper so its width matches the heading width.
3. **Play Button Micro-Interactions**:
   - Features a smooth zoom scale (`scale-110`) and glowing backdrop on thumbnail hover.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. الكارت بيعمل إيه؟
ده أهم كارت في الصفحة ومكانه في أول سطر على الشمال. بيعرض للكورس اللي الطالب شغال فيه دلوقتي ومستواه، مع صورة الكورس وزرار التشغيل السريع، ونسبة الإنجاز (60% مثلاً)، وزرار المتابعة وزرار الحفظ (Bookmark).

### 2. المميزات وطريقة بنائه البرمجية
1. **عنوان الكورس والتقسيم على سطرين**:
   - العنوان واخد خط كبير واضح وبيلف تلقائياً على سطرين عشان يظهر بشكل جذاب.
   - شريط التقدم الأخضر (Progress Bar) متغلف في Container اسمه `.continue-learning-title-metrics-wrap` واخد نفس عرض العنوان بالضبط ومابيمتدش لآخر الكارت.
2. **زرار الحفظ التفاعلي (Bookmark)**:
   - مبني بـ `useState` في React، أول ما تدوس عليه بيتلون بالأخضر ويتملى ويعرف المتصفح بحالة الحفظ عشان الـ Accessibility.
3. **تأثيرات الصورة والتشغيل (Play Button)**:
   - أول ما الماوس يجي على الصورة بتكبر بنعومة ويظهر زرار الـ Play متوهج.
