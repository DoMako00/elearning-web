# 🌟 RecommendedCourses Component
# توثيق كروت الكورسات المقترحة (Recommended Courses)

---

## 🇺🇸 English Documentation

### 1. Overview
The `RecommendedCourses` component renders an interactive 5-column catalog carousel of curated courses at the bottom of the Bento dashboard. Each card contains an icon, individual bookmark action, 2-line wrapped title, course level aligned left, and star rating aligned right.

### 2. File Location & Interfaces
- **Component TSX**: `src/components/ui/RecommendedCourses/RecommendedCourses.tsx`
- **Stylesheet**: `src/components/ui/RecommendedCourses/RecommendedCourses.css`
- **Course Data Array**:
  ```typescript
  const courses = [
    { title: "JavaScript Mastery", level: "Intermediate", rating: "4.8", icon: "js" },
    { title: "React Complete Guide", level: "Intermediate", rating: "4.7", icon: "react" },
    { title: "UI/UX Design Principles", level: "Beginner", rating: "4.6", icon: "design" },
    { title: "Node.js Backend Dev", level: "Intermediate", rating: "4.8", icon: "node" },
    { title: "Tailwind CSS From Zero", level: "Beginner", rating: "4.7", icon: "tailwind" },
  ];
  ```

### 3. Key Design Decisions & Code Structure
1. **Direct Transparent Icons**:
   - Instead of square background boxes, course icons (Atom, Leaf, Hexagon, Waves, JS) render with direct green strokes (`clamp(34px, 3.8cqw, 42px)`), matching modern UI guidelines.
2. **Title Constraint Wrapper (`.recommended-title-wrap`)**:
   - `width: fit-content; max-width: min(100%, 14ch)`
   - Forces clean 2-line wraps (e.g. `React` / `Complete Guide`, `UI/UX Design` / `Principles`) and avoids awkward wide single-line stretching.
3. **Card Footer Alignment**:
   - `.recommended-course-footer` uses `display: flex; justify-content: space-between;`
   - Level (`Intermediate`, `Beginner`) is positioned on the bottom left.
   - Star Rating (`⭐ 4.7`) is positioned on the bottom right with yellow star.
4. **Independent Stateful Bookmarking**:
   - State managed as a dictionary `setBookmarkedCourses(prev => ({ ...prev, [title]: !prev[title] }))` allowing independent toggling per card.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. الكارت بيعمل إيه؟
ده الشريط السفلي اللي بيعرض 5 كورسات مقترحة للطالب حسب اهتماماته، متقسمين في كروت جانبية أنيقة فيها اسم الكورس ومستواه وتقييمه بالنجوم، وزرار للحفظ المباشر.

### 2. طريقة البناء والمميزات
1. **الأيقونات الشفافة (Direct Icons)**:
   - تم إزالة المربعات الخلفية من ورا الأيقونات وبقت الأيقونة ظاهرة مباشرة بلون أخضر مريح للعين (زي أيقونة الـ React والـ Leaf).
2. **تغليف العنوان على سطرين (.recommended-title-wrap)**:
   - العنوان محطوط جوه Wrapper بيحدد عرضه بـ `14ch` عشان الكلمات تنزل على سطرين بشكل متناسق وماتسيبش فراغ في نص الكارت.
3. **محاذاة المستوى والتقييم**:
   - المستوى (Beginner / Intermediate) محاذي للشمال بلون رمادي هادي.
   - التقييم بالنجوم محاذي لليمين بنجمة صفراء ورقم التقييم واضح.
4. **حفظ الكورسات بشكل مستقل**:
   - تقدر تدوس على علامة الـ Bookmark في أي كورس يحفظه لوحده من غير ما يأثر على باقي الكروت.
