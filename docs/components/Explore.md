# 🧭 Explore & Course Discovery
# توثيق صفحة اكتشاف الكورسات والمسارات (Explore & Course Discovery)

---

## 🇺🇸 English Documentation

### 1. Overview
The Explore page (`/explore`) offers course discovery, curriculum categorization, search filtering, trending course carousels, and directional learning paths tailored to student majors.

### 2. Architecture & File Structure
- **Main Page**: `src/app/pages/student/ExplorePage.tsx`
- **Feature Sub-components (`src/components/ui/Explore/`)**:
  - `ExploreHero.tsx`: Dynamic search banner, motivational heading, and popular query tags.
  - `ExploreCourses.tsx`: Filterable grid of available courses with level badges, ratings, and bookmarking.
  - `ExploreCategories.tsx`: Subject category chips with icons (Anatomy, Biochemistry, Physiology, Pathology, etc.).
  - `ExploreTrending.tsx`: Highlighted popular courses with high enrollment momentum.
  - `ExploreDirections.tsx`: Guided career and academic learning tracks (e.g., Clinical Pre-Med, Surgical Foundations).
- **Data & Styles**: `exploreData.ts` & `Explore.css`

### 3. Core Capabilities
- **Dynamic Search & Filtering**: Multi-criteria filtering by category, difficulty level, and keywords.
- **Fast Course Enrolment & Preview**: Quick navigation to course overview pages.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة صفحة الاستكشاف (Overview)
صفحة الاستكشاف (`/explore`) هي معرض الكورسات المفتوحة، بتمكّن الطالب من تصفح مجالات جديدة، البحث عن كورسات متخصصة، والاشتراك فيها.

### 2. المكونات الرئيسية
1. **بانر البحث (ExploreHero)**: فيه محرك بحث سريع مع كلمات بحث مقترحة وأكثر طلباً.
2. **التصنيفات (ExploreCategories)**: أقسام طبية وأكاديمية واضحة (تشريح، كيمياء حيوية، فسيولوجيا...).
3. **الكورسات الرائجة (ExploreTrending)**: الكورسات الأكثر تسجيلاً وتقييماً في المنصة.
4. **المسارات التعليمية (ExploreDirections)**: خريطة طريق متكاملة بتوجه الطالب يدرس إيه خطوة بخطوة عشان يوصل لهدف أكاديمي معين.
