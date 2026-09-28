# 🍱 DashboardBento (Bento Grid Architecture)
# توثيق شبكة لوحة التحكم (Bento Grid)

---

## 🇺🇸 English Documentation

### 1. Overview
The `DashboardBento` component is the structural backbone of the student dashboard. It orchestrates 7 independent interactive learning cards into a 3-tier Bento grid layout that automatically adapts to varying viewport dimensions, container queries, and aspect ratios.

### 2. Architecture & Hierarchy
```
DashboardBento
├── Row 1: Top (dashboard-bento__row--top)
│   ├── ContinueLearning (Wide Hero Card: flex 1.8fr)
│   ├── AILearningGuide (AI Assistant Card: flex 1fr)
│   └── WeeklyGoalCard (Radial gauge card: flex 0.95fr)
│
├── Row 2: Middle (dashboard-bento__row--middle)
│   ├── MyProgress (Wave progress card: flex 1fr)
│   ├── Upcoming (Schedule list card: flex 1.25fr)
│   └── YourStreak (Gamified streak card: flex 1.45fr)
│
└── Row 3: Bottom (dashboard-bento__row--bottom)
    └── RecommendedCourses (5-course catalog: 100% width)
```

### 3. Source File Location
- **Component TSX**: `src/components/ui/DashboardBento/DashboardBento.tsx`
- **Stylesheet**: `src/components/ui/DashboardBento/DashboardBento.css`
- **Barrel Export**: `src/components/ui/DashboardBento/index.ts`

### 4. Key Design Decisions & Container Query System
- Every grid slot declares `container-type: size; container-name: bento-slot;` in CSS.
- Cards calculate internal paddings, font clamps, and element positions based on the exact pixel dimension of their individual slot, rather than window screen size.
- Zero horizontal or vertical cropping occurs when browser chrome/toolbars are visible on 1080p laptops.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. إيه هو الـ DashboardBento؟
مكون `DashboardBento` ده هو العمود الفقري لصفحة الطالب. بيجمع 7 كروت تعليمية في شكل شبكة متناسقة (Bento Grid) متقسمة لـ 3 صفوف رئيسية، وبتتجاوب تلقائياً مع أي مقاس شاشة من غير ما شكل التصميم يبوظ أو المحتوى يتقص.

### 2. تقسيم الصفوف والكروت
- **الصف الأول (Top Row)**: كارت متابعة الدرس الحالي `ContinueLearning` (واخد المساحة الأكبر) + كارت مرشد الذكاء الاصطناعي `AILearningGuide` + كارت متابعة الهدف الأسبوعي `WeeklyGoalCard`.
- **الصف التاني (Middle Row)**: كارت قياس التقدم العام `MyProgress` + كارت الحصص والمواعيد القادمة `Upcoming` + كارت أيام التفاعل المتواصل `YourStreak`.
- **الصف التالت (Bottom Row)**: شريط الكورسات المقترحة `RecommendedCourses` بعرض الشاشة كامل.

### 3. سر التجاوب الذكي (Container Queries)
كل خانة في الشبكة بتتعامل كـ Container مستقل باستخدام خاصية `@container bento-slot` في الـ CSS. ده معناه إن كل كارت بيغير حجم خطوطه والمسافات الداخلية بناءً على المساحة المتاحة ليه هو بالتحديد مش على حجم الشاشة كلها، وده اللي بيمنع مشكلة القص (Cropping) على اللابتوبات زي Asus TUF.
