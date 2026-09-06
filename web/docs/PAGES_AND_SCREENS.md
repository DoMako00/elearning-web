# 📄 Platform Pages & View Structure Map
# خريطة توثيق صفحات المنصة ومحتوى كل شاشة (Pages & Screens Map)

---

## 🇺🇸 English Documentation

This document provides a breakdown of **every single page** in the application, including its URL route, physical file path, primary components rendered, and its visual/functional content.

---

### 🎓 1. Student Dashboard Pages (`/`)

#### 1. Home Dashboard (`/`)
- **Route**: `/`
- **Page File**: `src/app/pages/student/HomePage.tsx`
- **Layout**: `src/app/pages/student/StudentLayout.tsx`
- **Key Content & Components**:
  - Topbar: Centered `SearchBar`, Notifications bell (`NotificationsDropdown`), Student avatar profile quick link.
  - Bento Grid (`DashboardBento.tsx`):
    - `Continue_learning`: Active in-progress lesson card with progress bar and lesson CTA.
    - `AILearningGuide`: AI mascot assistant, quick prompt suggestions.
    - `WeeklyGoalCard`: SVG circular progress gauge, 7-day study completion indicators.
    - `MyProgress`: Wave-chart course completion percentage meter.
    - `Upcoming`: Timeline schedule of upcoming live lectures and quiz deadlines.
    - `YourStreak`: Daily consistency flame counter with milestone badges.
    - `RecommendedCourses`: 5-card carousel with tags, ratings, and course bookmarks.
  - Zero-State Fallback: `EmptyLearningState` (shown when no courses are active).

#### 2. Student Profile & Settings (`/profile`)
- **Route**: `/profile`
- **Page File**: `src/app/pages/student/ProfilePage.tsx`
- **Component Root**: `src/features/profile/Profile.tsx`
- **Key Content & Tabs**:
  - `ProfileHeader`: Cover banner, avatar image upload, full name, major, XP points, and streak flame.
  - `OverviewTab`: Enrolled courses carousel, interactive weekly goals checklist, inspirational quote banner, upcoming study calendar, recent activity timeline.
  - `AchievementsTab`: Milestone badges (Bronze, Silver, Gold, Diamond), completion certificates, accuracy stats.
  - `SavedTab`: Filterable repository of bookmarked courses, notes, and articles with 1-click removal.
  - `ActivityAnalyticsTab`: Weekly study time distribution (Donut chart), daily study hours trends (Bar chart), quiz accuracy metrics.
  - `SettingsTab`: Notification toggles, theme preferences, account privacy.
  - `EditProfileModal`: Modal dialog to edit name, bio, and social handles.

#### 3. My Courses (`/my-courses`)
- **Route**: `/my-courses`
- **Page File**: `src/app/pages/student/MyCoursesPage.tsx`
- **Key Content & Components**:
  - Hero banner with course search and filtering.
  - Learning Pace Analytics: Recharts Area Chart comparing weekly vs. monthly study pace.
  - Weekly Schedule breakdown: Upcoming study sessions and hours planned.
  - Course Library Grid: Course cards with filter tabs (`In Progress`, `Completed`, `Saved`), progress bars, and "Resume Course" buttons.

#### 4. Course Overview (`/my-courses/human-anatomy-i`)
- **Route**: `/my-courses/human-anatomy-i`
- **Page File**: `src/app/pages/student/CourseOverviewPage.tsx`
- **Key Content & Components**:
  - Course hero banner: Title, estimated completion duration, instructor credentials, and "Start Lesson 1" CTA.
  - Syllabus Explorer: Accordion of modules and expandable lessons with completion checkmarks.
  - Workspace Tabs:
    - `Overview`: Course learning outcomes, prerequisites, and syllabus.
    - `Notes`: Personal student notes synchronized with course lectures.
    - `Resources`: Downloadable lecture PDFs, slides, and cheat-sheets.
    - `Discussion`: Course Q&A forum with instructor answers.

#### 5. Interactive Lesson Player (`/my-courses/human-anatomy-i/lessons/:lessonId`)
- **Route**: `/my-courses/human-anatomy-i/lessons/:lessonId`
- **Page File**: `src/app/pages/student/LessonPlayerPage.tsx`
- **Key Content & Components**:
  - Video Player: Custom HTML5 player with play/pause, 10-second rewind/fast-forward, playback speed (0.75x–2x), captions, volume slider, and fullscreen mode.
  - Lesson Navigation: Previous/Next lesson navigation buttons.
  - Side Workspace Rails: Real-time Notes editor (`LearningNotesPanel`), downloadable resources (`CourseResourcesPanel`), and live course discussion (`CourseDiscussionPanel`).
  - Gamification Trigger: Triggers `XPRewardModal` upon completing lessons.

#### 6. Explore & Course Catalog (`/explore`)
- **Route**: `/explore`
- **Page File**: `src/app/pages/student/ExplorePage.tsx`
- **Key Content & Components**:
  - `ExploreHero`: Search engine for discovering courses by keyword, topic, or instructor.
  - `ExploreCategories`: Category pills with medical & academic icons (Anatomy, Biochemistry, Physiology...).
  - `ExploreTrending`: Top-rated and trending enrolled courses.
  - `ExploreCourses`: Complete course catalog with level filters and direct enrollment.
  - `ExploreDirections`: Guided degree and career pathways (Pre-Med, Clinical, Surgical).

#### 7. Assignments & Homework (`/assignments`)
- **Route**: `/assignments`
- **Page File**: `src/app/pages/student/AssignmentsPage.tsx`
- **Component Root**: `src/components/ui/Assignments/AssignmentsWorkspace.tsx`
- **Key Content & Components**:
  - Status Filter Tabs: `All`, `Pending`, `Submitted`, and `Graded`.
  - Assignment Cards: Due date countdowns, course badge, point values, and submission status.
  - Submission modal trigger with upload support.

#### 8. Assignment Details (`/assignments/:assignmentId`)
- **Route**: `/assignments/:assignmentId`
- **Page File**: `src/components/ui/Assignments/AssignmentDetailPage.tsx`
- **Key Content & Components**:
  - Detailed project guidelines, rubrics, and instructor attachments.
  - `SubmitAssignmentModal`: Drag-and-drop file upload, student notes, and instant submission confirmation toast.

#### 9. Calendar & Schedule (`/calendar`)
- **Route**: `/calendar`
- **Page File**: `src/app/pages/student/CalendarPage.tsx`
- **Component Root**: `src/components/ui/Calendar/CalendarWorkspace.tsx`
- **Key Content & Components**:
  - Monthly calendar matrix, Weekly timeline, and Daily agenda views.
  - Event badges: Lectures (Green), Assignments (Amber), Exams (Rose), Office hours (Blue).
  - Quick event inspector with lecture streaming links and preparation notes.

#### 10. Messages & Chat (`/messages`)
- **Route**: `/messages`
- **Page File**: `src/app/pages/student/MessagesPage.tsx`
- **Component Root**: `src/components/ui/Messages/MessagesLayout.tsx`
- **Key Content & Components**:
  - `ConversationList`: Left sidebar with thread search, online status, and unread counters.
  - `ChatWindow`: Live message bubbles, text input, audio voice recordings, image/PDF attachments.
  - `ChatContextSidebar`: Right sidebar showing shared media files, participants, and course affiliations.

---

### 🔐 2. Authentication & Onboarding Pages (`/auth/*`)

#### 1. Sign In (`/auth/sign-in`)
- **Route**: `/auth/sign-in`
- **Page File**: `src/features/auth/pages/SignInPage.tsx`
- **Content**: University credentials login, student ID / email inputs, password visibility toggle, remember me, forgot password link.

#### 2. Register (`/auth/register`)
- **Route**: `/auth/register`
- **Page File**: `src/features/auth/pages/RegisterPage.tsx`
- **Content**: Student registration form, faculty selection, academic year selection, password security checks.

#### 3. Verify OTP (`/auth/verify-otp`)
- **Route**: `/auth/verify-otp`
- **Page File**: `src/features/auth/pages/VerifyOtpPage.tsx`
- **Content**: 6-digit verification code input boxes with auto-advance and resend timer.

#### 4. Complete Profile (`/auth/complete-profile`)
- **Route**: `/auth/complete-profile`
- **Page File**: `src/features/auth/pages/CompleteProfilePage.tsx`
- **Content**: Avatar upload, academic interests, bio, and campus department selection.

#### 5. Choose Brand / University Portal (`/auth/choose-brand`)
- **Route**: `/auth/choose-brand`
- **Page File**: `src/features/auth/pages/ChooseBrandPage.tsx`
- **Content**: Multi-brand institutional portal picker (e.g. BUC Badr University in Cairo) customizing themes and navigation logos.

#### 6. Access Pending Review (`/auth/access-pending`)
- **Route**: `/auth/access-pending`
- **Page File**: `src/features/auth/pages/AccessPendingPage.tsx`
- **Content**: Waiting room screen notifying students that their academic enrollment is under administrative review.

#### 7. Access Granted (`/auth/access-granted`)
- **Route**: `/auth/access-granted`
- **Page File**: `src/features/auth/pages/AccessGrantedPage.tsx`
- **Content**: Celebratory welcome page directing students to their personalized dashboard.

---

### 🛡️ 3. Admin & Management Portal (`/admin/*`)

#### 1. Admin Overview (`/admin`)
- **Route**: `/admin`
- **Page File**: `src/app/pages/admin/AdminOverviewPage.tsx`
- **Layout**: `src/app/pages/admin/AdminLayout.tsx`
- **Content**: High-level platform KPIs, total student count, active courses, enrollment velocity, and instructor counts.

#### 2. Courses Directory (`/admin/courses`)
- **Route**: `/admin/courses`
- **Page File**: `src/app/pages/admin/AdminCoursesPage.tsx`
- **Content**: Administrative course management table, publish/unpublish toggles, department filters, and "Create New Course" actions.

#### 3. Course Builder (`/admin/courses/:courseId/builder`)
- **Route**: `/admin/courses/:courseId/builder`
- **Page File**: `src/app/pages/admin/AdminCourseBuilderPage.tsx`
- **Content**: Interactive curriculum authoring suite: add/reorder modules, attach lessons, configure video streams, attach assignment rubrics, and publish syllabus.

#### 4. Instructors Directory (`/admin/instructors`)
- **Route**: `/admin/instructors`
- **Page File**: `src/app/pages/admin/AdminInstructorsPage.tsx`
- **Content**: Faculty profiles, assigned courses, teaching loads, and instructor credentials.

#### 5. Academic Curriculum (`/admin/curriculum`)
- **Route**: `/admin/curriculum`
- **Page File**: `src/app/pages/admin/AdminCurriculumPage.tsx`
- **Content**: University-wide curriculum hierarchy and degree track management.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

هذا الملف يوفر جرد شامل ومفصل **لكل صفحة في المشروع بالكامل**، بالرابط الخاص بيها ومحتواها التفصيلي:

1. **صفحة الهوم الرئيسية (`/`)**: فيها شبكة البنتو جارد، كارت الدرس الحالي، المساعد الذكي، الهدف الأسبوعي، جدول الحصص القادمة، عداد الستريك، والكورسات المقترحة.
2. **صفحة البروفايل (`/profile`)**: فيها 5 تبويبات (الملخص، الإنجازات، المحفوظات، تحليلات المذاكرة، والإعدادات) مع إمكانية تعديل بيانات الحساب.
3. **صفحة كورساتي (`/my-courses`)**: كروت الكورسات الحالية والمنتهية مع رسم بياني لمعدل المذاكرة وجدول المواعيد الأسبوعي.
4. **صفحة تفاصيل الكورس (`/my-courses/human-anatomy-i`)**: المنهج والموديولات، معلومات المحاضر، الملاحظات، والمصادر.
5. **مُشغل الدروس (`/my-courses/.../lessons/:id`)**: مشغل فيديو متطور بأزرار سرعة وتحكم كاملة مع مساحة ملاحظات ومصادر ونقاشات مدمجة.
6. **صفحة الاستكشاف (`/explore`)**: محرك بحث الكورسات، التصنيفات الطبية، الكورسات الرائجة، والمسارات الأكاديمية.
7. **صفحة الواجبات (`/assignments`)**: فلترة الواجبات (معلقة، تم التسليم، مقيمة) ومتابعة مواعيد التسليم.
8. **صفحة تسليم الواجب (`/assignments/:id`)**: تفاصيل التكليف ونافذة رفع ملفات الحل والملاحظات.
9. **صفحة النتيجة والتقويم (`/calendar`)**: جدول دراسي شهري وأسبوعي ويومي بمواعيد المحاضرات والامتحانات وروابط البث.
10. **صفحة الشات والرسائل (`/messages`)**: محادثات فورية مع المدرسين والزملاء مع دعم الرسائل الصوتية والملفات.
11. **صفحات تسجيل الدخول (`/auth/*`)**: الدخول، التسجيل، كود الـ OTP، استكمال البروفايل، اختيار الجامعة، وشاشات تأكيد الحساب.
12. **صفحات لوحة الإدارة (`/admin/*`)**: إحصائيات المنصة، إدارة الكورسات، منشئ الكورسات التفاعلي، وهيئة التدريس.
