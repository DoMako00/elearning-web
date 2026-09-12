# 📈 MyProgress & YourStreak Components
# توثيق كروت متابعة التقدم والأيام المتواصلة (Progress & Streak)

---

## 🇺🇸 English Documentation

### 1. MyProgress Component
- **Path**: `src/components/ui/MyProgress/MyProgress.tsx` & `index.css`
- **Purpose**: Displays the student's cumulative completion percentage (e.g. 72%), an SVG trend line/wave chart illustrating weekly velocity, and a "View Details" CTA button.
- **Responsive Handling**: Uses container query `@container bento-slot (max-height: 265px)` to scale percentage text and wave chart height without breaking the middle row layout.

### 2. YourStreak Component
- **Path**: `src/components/ui/YourStreak/YourStreak.tsx` & `YourStreak.css`
- **Purpose**: Gamifies student engagement by tracking active daily study streaks (e.g. 14 Days), rendering a prominent Flame icon badge, motivational streak summary, and trophy illustration.
- **Layout Architecture**: Employs a 2-column grid (`grid-template-columns: minmax(0, 1.45fr) minmax(0, 0.8fr)`) in desktop view, collapsing smoothly to a single stacked layout on mobile.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. كارت تقدم الطالب (MyProgress)
- الكارت ده بيوضح للطالب إجمالي نسبة التقدم في كل كورساته (مثلاً 72%)، مع رسم بياني انسيابي موجي (Wave Chart) بيوضح سرعة الإنجاز خلال الأسابيع، وزرار لعرض التفاصيل الكاملة.
- الكارت متظبط عشان يتجاوب مع شاشات اللابتوب ويحافظ على محاذاة الصف الأوسط في الشبكة.

### 2. كارت أيام الاستمرار والتحدي (YourStreak)
- كارت تحفيزي بيحسب للطالب عدد الأيام المتواصلة اللي دخل فيها ذاكر (مثلاً 14 يوم Streak).
- فيه أيقونة الشعلة (Flame) ورسمة الكأس (Trophy) عشان تشجع الطالب إنه يفضل مكمل مذاكرة كل يوم من غير ما يقطع.
