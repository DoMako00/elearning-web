# 🔔 Toast Notification System & Inactivity Prompt
# توثيق نظام التنبيهات الموحد ونافذة عدم النشاط (Toast & Inactivity)

---

## 🇺🇸 English Documentation

### 1. Overview
This module covers global UI feedback and session monitoring utilities:
1. The centralized **Toast Notification System** (`useToast` + `ToastNotification.tsx`) used across all dashboard features.
2. The **Inactivity Prompt** (`InactivityModal.tsx` + `useInactivityPrompt.ts`) that protects student session progress during idle periods.

### 2. Toast Notification Architecture
- **Hook**: `src/hooks/useToast.ts`
  - Provides `{ toastMessage, showToast }`.
  - Automatically resets notifications after 3000ms.
- **Component**: `src/components/ui/ToastNotification.tsx`
  - Rendered with accessible role `status` and `aria-live="polite"`.
  - Styled with Emerald/green badge palette (`bg-[#15803d]`), `CheckCircle2` icon, soft green border, and smooth `toastPop` keyframe animation.
  - Supports both `fixed` (default top-right of screen) and `absolute` positioning.
- **Standard Usage Across All Pages**:
  - Replaced third-party toast libraries (e.g. `react-hot-toast`) with a consistent, lightweight, dependency-free component across Profile, Overview, Saved, Header, Courses, and Assignments.

### 3. Inactivity Prompt Architecture
- **Hook**: `src/components/ui/InactivityPrompt/useInactivityPrompt.ts`
  - Detects mouse, keyboard, touch, and scroll inactivity.
- **Modal Component**: `src/components/ui/InactivityPrompt/InactivityModal.tsx`
  - Displays countdown timer asking if the student is still learning.
  - Pauses media playback or saves current study progress if unresponded.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. نظام التنبيهات الموحد (Toast Notifications)
- نظام إشعارات أخضر أنيق وموحد على مستوى كل صفحات المنصة (البروفايل، الواجبات، الكورسات، والهيدر).
- مبني بالـ Hook الخفيف `useToast` ومكون `ToastNotification.tsx` من غير أي مكتبات خارجية ثقيلة.
- بيظهر في أعلى يمين الشاشة بأيقونة صح خضرا وحركة ظهور سلسة (Pop animation) وبيختفي تلقائياً بعد 3 ثواني.

### 2. نافذة عدم النشاط (Inactivity Prompt)
- نظام ذكي بيتابع حركة الطالب على الشاشة؛ لو الطالب ساب الكورس مفتوح ومتحركش لفترة، بتظهر له نافذة تسأله هل لسه بتذاكر؟
- الميزة دي بتحافظ على حفظ وقت المذاكرة بدقة وبتوقف الفيديو لو الطالب قام وسابه شغال.
