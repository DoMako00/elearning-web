# 📚 My Courses, Course Overview & Interactive Lesson Player
# توثيق كورساتي، تفاصيل الكورس، ومُشغل الدروس التفاعلي

---

## 🇺🇸 English Documentation

### 1. Overview
This suite forms the core learning engine of the platform, enabling students to track their enrolled courses, study course curriculum hierarchies, and engage with interactive multimedia video lectures.

### 2. Architecture & File Structure
- **My Courses Catalog**:
  - `src/app/pages/student/MyCoursesPage.tsx`: Course library grid, study pace area chart (weekly vs. monthly Recharts visualization), week schedule planner, search, and status filters (`in-progress`, `completed`, `saved`).
  - `src/components/ui/CourseLibrary/`: Reusable course card library, progress indicators, and course status metadata.
- **Course Overview**:
  - `src/app/pages/student/CourseOverviewPage.tsx` (Route: `/my-courses/human-anatomy-i`): Course banner, syllabus tree, module expansion, lesson statuses, instructor bio, course resources list, and course discussion workspace.
  - `CourseOverviewPage.css`: Split workspace and syllabus layout.
- **Interactive Lesson Player**:
  - `src/app/pages/student/LessonPlayerPage.tsx` (Route: `/my-courses/human-anatomy-i/lessons/:lessonId`): Full-featured HTML5 video player with custom video controls (play/pause, 10s seek jump, playback speed 0.75x–2x, captions, volume slider, fullscreen).
  - Integrated with `LearningNotesPanel`, `CourseResourcesPanel`, and `CourseDiscussionPanel`.
  - Integrated with **XP Rewards System**: awards XP upon lesson milestones.

### 3. Core Capabilities
- **Curriculum Navigation**: Effortless switching between modules and lessons with live completion checkmarks.
- **Side Workspace Rails**: Notes tab, lecture resources, and discussion forums available alongside the video player without interrupting playback.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة الميزة (Overview)
القسم ده هو قلب المنصة التعليمية، ومسؤول عن:
1. استعراض الكورسات المسجل فيها الطالب ومعدل تقدمه فيها.
2. صفحة محتويات الكورس (المنهج والموديولات).
3. صفحة تشغيل الفيديو والدروس التفاعلية (Lesson Player).

### 2. أهم المكونات وطريقة عملها
1. **صفحة كورساتي (MyCoursesPage)**:
   - فيها رسم بياني تفاعلي (Pace Chart) بيوضح ساعات المذاكرة، وجدول الحصص الأسبوعي، وكروت الكورسات مع نسب الإنجاز.
2. **صفحة تفاصيل الكورس (CourseOverviewPage)**:
   - بتعرض الفصول والدروس، مين الدكتور المحاضر، الملاحظات والمصادر الخاصة بالكورس، وزرار "ابدأ الدرس" للمتابعة.
3. **مُشغل الدروس المتقدم (LessonPlayerPage)**:
   - مشغل فيديو احترافي بأزرار تحكم كاملة (تقديم/ترجيع 10 ثواني، سرعة الفيديو من 0.75x لـ 2x، جودة عالية، كتم وتشغيل الصوت، وشاشة كاملة).
   - جنب الفيديو فيه مساحة مخصصة لكتابة الملاحظات الدراسية وحفظها، وتنزيل ملفات الـ PDF المرفقة، والمشاركة في منتدى نقاش الدرس.
   - مرتبط بنظام مكافآت نقاط الخبرة (XP Rewards) بيدي الطالب نقاط أول ما يخلص الدرس.
