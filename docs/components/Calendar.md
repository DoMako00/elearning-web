# 📅 Calendar & Academic Schedule System
# توثيق نظام التقويم والجدول الدراسي (Calendar & Academic Schedule)

---

## 🇺🇸 English Documentation

### 1. Overview
The Calendar workspace (`/calendar`) provides an interactive academic agenda showing live webinars, assignment deadlines, exam schedules, and study sessions across monthly, weekly, and daily views.

### 2. Architecture & File Structure
- **Main Page**: `src/app/pages/student/CalendarPage.tsx`
- **Workspace Component**: `src/components/ui/Calendar/CalendarWorkspace.tsx`
- **Data & Types**: `calendar.data.ts` & `calendar.types.ts`
- **Stylesheet**: `Calendar.css`

### 3. Core Capabilities
- **View Modes**: Month grid view, Week timeline view, and Day breakdown view.
- **Event Categorization**: Color-coded badges for Lectures (green), Assignments (amber), Exams (rose), and Office Hours (blue).
- **Interactive Event Inspector**: Clicking an event reveals details, instructor info, Zoom/lecture links, and preparation attachments.
- **Quick Date Navigation**: Fast jumps between months, "Today" shortcut button, and mini calendar sidebar picker.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة نظام التقويم (Overview)
صفحة التقويم (`/calendar`) بتنظم وقت الطالب ومواعيده الدراسية بالكامل؛ سواء كانت محاضرات أونلاين، مواعيد تسليم واجبات، أو امتحانات قادمة.

### 2. أهم المميزات
1. **طرق عرض متعددة**: إمكانية استعراض الجدول بالشهر، بالأسبوع، أو باليوم بالتفصيل.
2. **تصنيف الفعاليات بالألوان**: كل نوع حدث واخد لون مميز (أخضر للمحاضرات، أصفر للواجبات، أحمر للامتحانات، وأزرق لمواعيد المساعدة).
3. **تفاصيل المحاضرة والروابط**: بمجرد الضغط على أي معاد، بتظهر نافذة فيها تفاصيل الدرس، اسم الدكتور، ورابط البث المباشر المباشر للحضور.
