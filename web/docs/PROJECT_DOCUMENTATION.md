# 📚 E-Learning Web Application Architecture & Code Nmap
# توثيق وهندسة النظام وخريطة الكود (Nmap) لمنصة التعلم الإلكتروني

---

## 🌐 1. Project Overview & Architecture (نظرة عامة على المشروع والهندسة)

### English
This project is a high-performance, modern responsive E-Learning Student Dashboard built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. It uses a fluid **Bento Grid** architecture powered by CSS Container Queries (`@container bento-slot`) to deliver zero-compromise UX across everything from mobile phones to 4K ultra-wide monitors and constrained laptop viewports (e.g. Asus TUF A15).

### Egyptian Arabic (المصري)
المشروع ده عبارة عن لوحة تحكم تفاعلية حديثة للطلاب (Student Learning Dashboard) مبنية بأحدث تقنيات الويب: **React 19**، **TypeScript**، **Vite** و **Tailwind CSS**. النظام متصمم بنظام شبكي ذكي (Bento Grid) مع استخدام تقنية الـ Container Queries الحديثة في الـ CSS عشان تضمن إن مفيش أي كارت أو محتوى يتقص أو يبوظ سواء فتحت من لابتوب، شاشة موبايل، أو شاشة 4K كبيرة.

---

## 🗺️ 2. Comprehensive Code Nmap (خريطة الكود والوظائف بالكامل)

Below is the complete Nmap of the build and source code, mapping every directory, file, component, hook, state, and function to its physical file location.

```
src/
├── main.tsx                           # [App Entry Point / نقطة الانطلاق]
│   └── ReactDOM.createRoot()          # Mounts React DOM tree with StrictMode
│
├── app/                               # [Application Core Layer / طبقة التطبيق الأساسية]
│   ├── App.tsx                        # Root Application wrapper providing Router & Providers
│   │   └── <AppRouter />              # Injects application router
│   ├── config/                        # Environment & global settings
│   │   └── env.ts                     # Environment variable validation & type safety
│   ├── providers/                     # React Context providers (Themes, Auth, etc.)
│   │   └── AppProviders.tsx           # Combines all application context providers
│   ├── dashboard/                     # Dashboard domain logic & custom hooks
│   │   ├── useDashboardEnrollment.ts  # [Hook] Manages student enrollment lifecycle
│   │   │   ├── status                 # State: 'loading' | 'success' | 'error'
│   │   │   ├── enrolledCourses        # State: array of enrolled course objects
│   │   │   └── retry()                # Function: retries fetching enrollment data
│   │   └── dashboard.types.ts         # Type definitions for enrollment & courses
│   └── router/                        # Routing system
│       ├── AppRouter.tsx              # Router provider wrapping configured route objects
│       ├── student.routes.tsx         # [Route Module] Student dashboard route definition
│       │   ├── studentRoutes          # Route object definitions (path: '/')
│       │   ├── DashboardLoadingState  # Skeleton / spinner feedback UI during load
│       │   ├── DashboardErrorState    # Error boundary UI with retry button
│       │   ├── DashboardContent       # Conditional switcher (Bento vs Empty State)
│       │   └── StudentHeaderPreview   # Header container (Search + User profile)
│       └── student-dashboard.css      # Layout & CSS grid styling for student dashboard
│
├── components/                        # [Component Library / مكتبة المكونات]
│   │
│   ├── layout/                        # [Structural Layouts / التنسيقات الهيكلية]
│   │   ├── AppShell/                  # Outer layout wrapper (Sidebar + Content canvas)
│   │   │   ├── AppShell.tsx           # AppShell component rendering sidebar & main slot
│   │   │   ├── AppShell.css           # Grid layout, responsive transitions, viewport caps
│   │   │   └── index.ts               # Public barrel export
│   │   └── Sidebar/                   # Persistent navigation sidebar
│   │       ├── Sidebar.tsx            # Renders navigation items, branding, & collapse logic
│   │       ├── Sidebar.css            # Sidebar drawer styling, animations, active states
│   │       └── index.ts               # Public barrel export
│   │
│   └── ui/                            # [Interactive UI Cards / كروت ولوحات الواجهة]
│       │
│       ├── DashboardBento/            # [Grid Master / موزع الشبكة]
│       │   ├── DashboardBento.tsx     # Master 3-tier Bento Grid organizer
│       │   │   ├── Top Row            # ContinueLearning (wide) + AILearningGuide + WeeklyGoalCard
│       │   │   ├── Middle Row         # MyProgress + Upcoming + YourStreak
│       │   │   └── Bottom Row         # RecommendedCourses (full width 5-card row)
│       │   ├── DashboardBento.css     # Bento grid template rows/columns & container queries
│       │   └── index.ts               # Public barrel export
│       │
│       ├── Continue_Learning/         # [Feature: Continue Lesson Card]
│       │   ├── continue_learning.tsx  # Interactive lesson progress card
│       │   │   ├── [State] isBookmarked # Bookmark toggle state (boolean)
│       │   │   ├── [Prop] onContinue  # Triggered when "Continue Lesson" button clicked
│       │   │   └── [Layout] Wrap     # .continue-learning-title-metrics-wrap
│       │   └── index.css              # Fluid title clamp, progress bar constraints, 2-line wrap
│       │
│       ├── AILearningGuide/           # [Feature: AI Assistant Guide Card]
│       │   ├── AILearningGuide.tsx    # Card showcasing AI robot helper & tips
│       │   ├── AILearningGuide.css    # Card styling, illustration sizing & responsive rules
│       │   └── index.ts               # Public barrel export
│       │
│       ├── WeeklyGoalCard/            # [Feature: Weekly Study Hours Tracker]
│       │   ├── WeeklyGoalCard.tsx     # Progress ring SVG & 7-day completion indicators
│       │   │   ├── ProgressRing()     # Sub-component: Calculates SVG stroke offsets
│       │   │   └── WEEK_DAYS          # Array mapping 7-day indicators (S, M, T, W, T, F, S)
│       │   ├── WeeklyGoalCard.css     # Radial gauge sizing, fire icon micro-animations
│       │   ├── weekly-goal-card.types.ts # TypeScript interfaces (completedHours, targetHours)
│       │   └── index.ts               # Public barrel export
│       │
│       ├── MyProgress/                # [Feature: Overall Course Completion Meter]
│       │   ├── MyProgress.tsx         # Wave chart & percentage completion indicator
│       │   ├── index.css              # Container queries, badge styling, compact heights
│       │   └── index.ts               # Public barrel export
│       │
│       ├── Upcoming/                  # [Feature: Schedule & Upcoming Classes]
│       │   ├── Upcoming.tsx           # List of scheduled webinars, sessions & reminders
│       │   ├── index.css              # Custom slim scrollbar, fluid clamp, max-height queries
│       │   └── index.ts               # Public barrel export
│       │
│       ├── YourStreak/                # [Feature: Gamified Learning Streak]
│       │   ├── YourStreak.tsx         # Active day streaks, flame badge & trophy banner
│       │   ├── YourStreak.css         # Streak counter layout & container query scaling
│       │   └── index.ts               # Public barrel export
│       │
│       ├── RecommendedCourses/        # [Feature: Recommended Course Catalog]
│       │   ├── RecommendedCourses.tsx # Carousel of curated course recommendations
│       │   │   ├── CourseIcon()       # Icon resolver (React Atom, Leaf, Hexagon, JS)
│       │   │   ├── [State] bookmarkedCourses # Dictionary of bookmarked courses
│       │   │   └── toggleBookmark()   # Toggles individual course bookmark state
│       │   ├── RecommendedCourses.css # Transparent icon rules, left-level & right-rating footer
│       │   └── index.ts               # Public barrel export
│       │
│       ├── SearchBar/                 # [Feature: Global Header Search]
│       │   ├── SearchBar.tsx          # Accessible search input with icon & keyboard triggers
│       │   ├── SearchBar.css          # Pill styling, focus ring, glassmorphism
│       │   └── index.ts               # Public barrel export
│       │
│       ├── UserHeaderActions/         # [Feature: Profile, Notifications & Settings]
│       │   ├── UserHeaderActions.tsx  # Avatar image, notification bell with badge dot
│       │   ├── UserHeaderActions.css  # Dropdown triggers, badge position & avatar rings
│       │   └── index.ts               # Public barrel export
│       │
│       └── EmptyLearningState/        # [Feature: Zero Data Fallback]
│           ├── EmptyLearningState.tsx # Clean illustration & CTA when no courses enrolled
│           ├── EmptyLearningState.css # Centered flex layout with illustration container
│           └── index.ts               # Public barrel export
│
└── styles/                            # [Global Design System / التصميم العام]
    ├── globals.css                    # Tailwind imports, CSS root variables, typography tokens
    └── variables.css                  # Color palette (greens, grays, surface colors, radii)
```

---

## 🧩 3. Features & Component Documentation Index (فهرس ملفات التوثيق المنفصلة)

> 💡 **Tip:** For a complete screen-by-screen breakdown of all URLs, layouts, and page contents, see [PAGES_AND_SCREENS.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/PAGES_AND_SCREENS.md) (دليل الشاشات والصفحات بالكامل).

Each individual feature has its own dedicated documentation file in the `docs/components/` directory:

| Component / Feature | English Documentation | التوثيق بالعربي المصري |
| :--- | :--- | :--- |
| **Bento Dashboard Grid** | [docs/components/DashboardBento.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/DashboardBento.md) | شرح وتصميم شبكة البنتو جارد |
| **Continue Learning** | [docs/components/ContinueLearning.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/ContinueLearning.md) | كارت متابعة الدرس الحالي |
| **Recommended Courses** | [docs/components/RecommendedCourses.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/RecommendedCourses.md) | كروت الكورسات المقترحة |
| **Weekly Goal** | [docs/components/WeeklyGoalCard.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/WeeklyGoalCard.md) | عداد الهدف الأسبوعي والدايرة |
| **Upcoming Schedule** | [docs/components/Upcoming.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/Upcoming.md) | جدول الحصص والمواعيد القادمة |
| **My Progress & Streak** | [docs/components/ProgressAndStreak.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/ProgressAndStreak.md) | كروت تقدم الطالب والتفاعل اليومي |
| **AI Learning Guide & Header**| [docs/components/AIAndHeader.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/AIAndHeader.md) | المساعد الذكي، شريط البحث والبروفايل |
| **Student Profile & Settings** | [docs/components/ProfileAndSettings.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/ProfileAndSettings.md) | الملف الشخصي، الأوسمة، والمحفوظات |
| **Assignments & Submissions** | [docs/components/Assignments.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/Assignments.md) | نظام الواجبات والتسليمات |
| **Messages & Real-time Chat** | [docs/components/Messages.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/Messages.md) | المحادثات المباشرة والشات مع المدرسين |
| **Calendar & Schedule** | [docs/components/Calendar.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/Calendar.md) | التقويم والجدول الدراسي التفاعلي |
| **Explore & Course Discovery** | [docs/components/Explore.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/Explore.md) | استكشاف الكورسات والمسارات التعليمية |
| **My Courses & Lesson Player** | [docs/components/MyCoursesAndLessonPlayer.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/MyCoursesAndLessonPlayer.md) | كورساتي ومُشغل الدروس والمحاضرات |
| **Gamification (Streak & XP)** | [docs/components/GamificationAndRewards.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/GamificationAndRewards.md) | تحليلات الستريك ومكافآت نقاط الخبرة |
| **Auth & Onboarding** | [docs/components/AuthenticationAndOnboarding.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/AuthenticationAndOnboarding.md) | تسجيل الدخول، التحقق، وتخصيص الجامعة |
| **Admin & Course Builder** | [docs/components/AdminDashboardAndBuilder.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/AdminDashboardAndBuilder.md) | لوحة تحكم المشرفين ومنشئ الكورسات |
| **Toast & Inactivity Monitor**| [docs/components/ToastAndInactivity.md](file:///c:/Users/shehab/OneDrive/Desktop/E-learning%20stage/elearning-web/web/docs/components/ToastAndInactivity.md) | نظام التنبيهات الموحد ومراقبة عدم النشاط |

---

## ⚡ 4. Build, Development & Execution Guide (طريقة التشغيل والبناء)

### Running Locally (التشغيل محلياً)
```bash
# Navigate to web directory (ادخل فولدر الويب)
cd elearning-web/web

# Install dependencies (تثبيت الحزم)
npm install

# Start Vite live development server (تشغيل سيرفر التطوير السريع)
npm run dev
```

### Production Build (بناء نسخة الإنتاج)
```bash
# TypeScript verification + Vite production bundling
npm run build
```
The output will be generated inside the `dist/` directory, ready to deploy to any modern CDN or static web server.
