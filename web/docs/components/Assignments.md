# 📝 Assignments & Submissions System
# توثيق نظام الواجبات والتسليمات (Assignments & Submissions)

---

## 🇺🇸 English Documentation

### 1. Overview
The Assignments workspace (`/assignments`) allows students to view active coursework, filter by completion status, check upcoming deadlines, inspect grading criteria, and submit completed homework via modal file uploads and notes.

### 2. Architecture & File Structure
- **Main List Page**: `src/app/pages/student/AssignmentsPage.tsx`
- **Workspace Component**: `src/components/ui/Assignments/AssignmentsWorkspace.tsx`
- **Detail View Page**: `src/components/ui/Assignments/AssignmentDetailPage.tsx` (Route: `/assignments/:assignmentId`)
- **Submission Modal**: `src/components/ui/Assignments/SubmitAssignmentModal.tsx`
- **Mock Data & Types**: `src/components/ui/Assignments/assignments.data.ts` & `assignments.types.ts`
- **Styles**: `Assignments.css`, `AssignmentDetailPage.css`, `SubmitAssignmentModal.css`

### 3. Core Capabilities
- **Multi-Status Filtering**: Tabs for `All`, `Pending`, `Submitted`, and `Graded`.
- **Assignment Detail Screen**: Displays rubrics, deadline countdowns, attached reference materials, and instructor requirements.
- **Interactive File Upload Modal**: Allows drag-and-drop or file browsing, attaching submission notes, and instant toast confirmation upon completion.
- **Local Feedback Notifications**: Uses the unified `ToastNotification` component and `useToast` hook for status changes.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة نظام الواجبات (Overview)
صفحة الواجبات (`/assignments`) بتمكن الطالب من متابعة كل التكليفات الدراسية، ومعرفة المواعيد النهائية، وتسليم الحلول والملفات للدكاترة والمدرسين.

### 2. المميزات الرئيسية
1. **فلترة الواجبات**: تبويبات سريعة لعرض الواجبات (الكل، المعلقة والمطلوبة، اللي تم تسليمها، واللي اتصححت وخدت درجة).
2. **صفحة تفاصيل الواجب (Assignment Detail)**: بتشرح المطلوب بالتفصيل، الملفات المرفقة للتحميل، وموعد التسليم النهائي.
3. **نافذة رفع الحل (SubmitAssignmentModal)**: نافذة سهلة بتتيح للطالب يرفع ملفات الـ PDF أو الصور ويكتب ملاحظاته للدكتور، وأول ما يسلم بيظهر إشعار Toast أخضر يؤكد التسليم بنجاح.
