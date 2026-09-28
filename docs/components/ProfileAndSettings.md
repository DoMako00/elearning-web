# 👤 Student Profile & Settings Feature
# توثيق صفحة الملف الشخصي والإعدادات للطالب (Profile & Settings)

---

## 🇺🇸 English Documentation

### 1. Overview
The Student Profile (`Profile.tsx`) is a centralized dashboard feature providing comprehensive insights into student learning identity, enrolled courses, academic achievements, streak rewards, saved materials, detailed study analytics, and customizable personal settings.

### 2. Architecture & File Structure
- **Main Page**: `src/features/profile/Profile.tsx` (wrapped by `src/app/pages/student/ProfilePage.tsx` at route `/profile`)
- **Custom Hook**: `src/features/profile/hooks/useProfileTabs.ts` (manages active tab, mock data, filtering, and state persistence)
- **Header Component**: `src/features/profile/components/ProfileHeader.tsx` (Profile avatar, banner, student metadata, XP/Streak indicators, edit profile modal trigger)
- **Modals**:
  - `EditProfileModal.tsx`: Real-time editing of student name, headline, bio, and social links.
  - `EditGoalsModal.tsx`: Updating active weekly & monthly targets.
- **Tabs (`src/features/profile/components/tabs/`)**:
  1. **`OverviewTab.tsx`**: High-level learning overview, current enrolled courses carousel, weekly study goals checklist, quote banner, upcoming calendar schedule, and recent study activity timeline.
  2. **`AchievementsTab.tsx`**: Gamified accomplishments, milestone badges (Bronze/Silver/Gold/Diamond), XP milestones, and accuracy statistics.
  3. **`SavedTab.tsx`**: Curated repository of bookmarked courses, notes, and articles with category filters (`All`, `Courses`, `Articles`, `Notes`) and instant unsave actions.
  4. **`ActivityAnalyticsTab.tsx`**: Data visualizations including weekly subject distribution (Donut chart), daily study hours trends (Bar chart), quiz accuracy, and total time metrics.
  5. **`SettingsTab.tsx`**: Account preferences, notification settings, theme/display modes, and security controls.

### 3. Key Functionality & Interaction Logic
- **Direct Sidebar & Header Access**: Direct navigation to `/profile` from the bottom-left sidebar avatar and the topbar header actions.
- **Toast Feedback**: Synchronized feedback using `useToast` and `ToastNotification` on goal toggling, profile saves, avatar changes, and item removals.
- **Responsive Layout**: Designed to adapt gracefully to mobile, iPad Air/Mini portrait/landscape (scrollable containers), and widescreen monitors without layout breaks.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة الميزة (Overview)
صفحة البروفايل (`/profile`) هي لوحة متكاملة لبيانات الطالب التعليمية؛ بتعرض ملخص الكورسات، الإنجازات والأوسمة، المواد المحفوظة، التحليلات البيانية لساعات المذاكرة، وتعديل بيانات الحساب.

### 2. تقسيم الملفات والأقسام (Tabs)
1. **الترويسة (ProfileHeader)**:
   - بتعرض صورة الطالب، الاسم، التخصص، رصيد الـ XP، وأيام التفاعل المستمر (Streak)، مع زرار لتعديل البروفايل وتغيير الصورة الشخصية.
2. **تبويب الملخص (OverviewTab)**:
   - بيعرض ملخص الكورسات الحالية، الأهداف الأسبوعية (مع إمكانية تحديد الهدف كمنتهي)، الحصص والمواعيد القادمة، وسجل الأنشطة الأخيرة.
3. **تبويب الإنجازات (AchievementsTab)**:
   - بيعرض أوسمة الشرف والمستويات اللي حققها الطالب (برونزي، فضي، ذهبي، ماسي) ونسب الدقة والـ XP.
4. **تبويب العناصر المحفوظة (SavedTab)**:
   - كل الدروس والكورسات والمقالات والملفات اللي الطالب عملها Bookmark، مع فلترة سريعة وإمكانية حذف أي عنصر بضغطة واحدة وتنبيه Toast أخضر.
5. **تبويب تحليلات النشاط (ActivityAnalyticsTab)**:
   - رسومات بيانية ذكية بتوضح توزيع المذاكرة على المواد (Donut Chart) ومعدل الساعات اليومية (Bar Chart) ونسبة حل الكويزات.
6. **تبويب الإعدادات (SettingsTab)**:
   - ضبط الإشعارات، إعدادات الخصوصية، والتحكم في الحساب.
