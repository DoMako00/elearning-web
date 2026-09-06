# 📅 Upcoming Component
# توثيق كارت المواعيد والحصص القادمة (Upcoming Card)

---

## 🇺🇸 English Documentation

### 1. Overview
The `Upcoming` component displays scheduled live webinars, assignment deadlines, and upcoming course sessions. It contains a count badge in the header, a vertically scrollable list of class items with colored icons, titles, and time labels, followed by a full-width action button.

### 2. File Location & Interfaces
- **Component TSX**: `src/components/ui/Upcoming/Upcoming.tsx`
- **Stylesheet**: `src/components/ui/Upcoming/index.css`
- **Upcoming Items Schema**:
  ```typescript
  interface UpcomingItem {
    id: string;
    title: string;          // e.g. "UI/UX Design Session"
    time: string;           // e.g. "Tomorrow, 10:00 AM"
    type: "video" | "code" | "quiz";
  }
  ```

### 3. Key Design Decisions & Crop-Free Scaling
1. **Fluid Container Query Heights**:
   - Includes breakpoints for `@container bento-slot (max-height: 265px)` and `(max-height: 220px)`.
   - Scales icon box size (`34px` to `46px`), title typography (`12px` to `14px`), and button heights dynamically.
2. **Scroll Safety (`overflow-y: auto`)**:
   - `.upcoming-body` includes custom slim scrollbars (`scrollbar-width: thin;`) so that even if more items are dynamically loaded, content never gets clipped off.
3. **Adaptive Count Badge**:
   - Fluid badge in header displaying the item count (`clamp(44px, 20cqw, 54px)`).

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. الكارت بيعمل إيه؟
كارت `Upcoming` بيعرض للدروس والمحاضرات المباشرة والمواعيد المهمة اللي جاية في جدول الطالب، مع وقت كل جلسة والأيقونة الخاصة بنوع المحاضرة، وزرار لعرض كل المواعيد.

### 2. طريقة حل مشكلة القص والتجاوب
1. **التعامل مع الشاشات القصيرة (Laptop Viewports)**:
   - تم ضبط الـ CSS بحيث لما الكارت يضيق في الارتفاع، حجم الأيقونات والنصوص بيصغر بنعومة وسلاسة.
2. **شريط تمرير نحيف أنيق (Slim Scrollbar)**:
   - لو عدد الحصص زاد، الكارت بيشغل Scrollbar نحيف ومريح للعين يمنع أي عنصر إنه يتقص أو يختفي برة حدود الشاشة.
