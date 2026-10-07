# 🛡️ Admin Dashboard & Course Builder Feature
# توثيق لوحة تحكم المشرفين ومنشئ الكورسات (Admin & Course Builder)

---

## 🇺🇸 English Documentation

### 1. Overview
The Admin subsystem provides administrative staff and academic coordinators with tools to manage institutional curricula, courses, instructors, students, payments, and course building modules.

### 2. Architecture & File Structure
- **Root Route**: `/admin`
- **Admin Layout**: `src/app/pages/admin/AdminLayout.tsx` (Features dedicated Admin Sidebar and Admin Topbar navigation).
- **Core Pages**:
  - `AdminOverviewPage.tsx` (`/admin`): Key metrics, enrollment volume, active instructors, and platform activity graphs.
  - `AdminCoursesPage.tsx` (`/admin/courses`): Master course catalog management with creation, editing, and publishing controls.
  - `AdminCourseBuilderPage.tsx` (`/admin/courses/:courseId/builder`): Interactive curriculum builder for adding modules, lessons, video uploads, and assignments.
  - `AdminInstructorsPage.tsx` (`/admin/instructors`): Instructor profiles, assigned courses, and faculty credentials.
  - `AdminCurriculumPage.tsx` (`/admin/curriculum`): University-wide syllabus structuring and departmental degree paths.
  - Placeholder modules for Commercial, Payments, Subscriptions, Access Grants, Media, Assessments, Security, and Audit.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة لوحة تحكم الإدارة (Overview)
لوحة تحكم المشرفين (`/admin`) بتسمح لإدارة المنصة والجامعة بمتابعة كل ما يخص العملية التعليمية وإدارة الكورسات والمدرسين.

### 2. الأقسام الرئيسية
1. **نظرة عامة (Admin Overview)**: إحصائيات سريعة عن عدد الطلاب، الكورسات النشطة، والدكاترة.
2. **إدارة الكورسات (Admin Courses)**: عرض وتعديل ونشر الكورسات.
3. **منشئ الكورسات (Course Builder)**: أداة متطورة لإضافة الفصول والدروس ورفع الفيديوهات والمذكرات للكورس.
4. **هيئة التدريس (Instructors)**: إدارة بيانات الدكاترة والمحاضرين وصلاحياتهم.
5. **المنهج الدراسي (Curriculum)**: تنظيم المواد حسب السنوات والفرق الدراسية في الجامعة.
