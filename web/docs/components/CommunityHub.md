# 👥 Community Hub Module & Real-Time Sync
# توثيق منصة مجتمع الطلاب والتزامن الحي (Community Hub & WebSocket Sync)

---

## 🇺🇸 English Documentation

### 1. Overview
The Community Hub (`/community`) provides a collaborative learning forum and peer-to-peer networking environment for students. It replaces legacy static headers with a clean inline `CommunityBreadcrumb` (`Home / Community`) and features real-time WebSocket state synchronization.

### 2. Architecture & File Structure
- **Main Page Module**: `src/features/community/Community.tsx`
- **Route Wrapper**: `src/app/pages/student/CommunityPage.tsx` (Route: `/community`)
- **Real-Time Hook**: `src/features/community/hooks/useCommunitySocket.ts`
- **Types**: `src/features/community/types/community.ts`
- **Mock Data**: `src/features/community/data/communityMockData.ts`
- **Subcomponents (`src/features/community/components/`)**:
  - `CommunityBreadcrumb.tsx`: Inline breadcrumb navigation with live online member pulse indicator.
  - `SearchAndFilterToolbar.tsx`: Search input with category dropdown ("All topics") and pill filters (`All`, `Study Groups`, `Discussions`, `Q&A`, `Resources`, `Events`, plus `+` modal trigger).
  - `FeaturedGroupCard.tsx`: Featured study group with custom graduation cap SVG illustration, tags, overlapping member avatars, and join CTA.
  - `TrendingTopicsWidget.tsx`: Trending discussions with colored category icons, live reply counts, and quick filter triggers.
  - `DiscussionFeed.tsx`: Recent discussion threads with category badges, author credentials, time stamps, view counts, and optimistic highlight animation.
  - `MentorSpotlightCard.tsx`: Featured industry expert mentor with verified badge, bio summary, and profile CTA.
  - `CommunitySidebar.tsx`: Multi-card sidebar including active members presence, upcoming calendar sessions with join/remind triggers, and top contributor leaderboard rankings.
  - `CreateThreadModal.tsx`: Modal dialog for publishing new discussions and study groups.
  - `DiscussionDetailModal.tsx`: Thread interaction modal displaying complete discussion content, author bio, views/upvotes, threaded replies, and interactive reply composer with real-time socket updates.

### 3. Real-Time WebSocket Synchronization (`useCommunitySocket.ts`)
- Connects to room `community_feed`.
- Events Handled:
  - `NEW_DISCUSSION_POST`: Optimistically prepends new posts to the feed with a subtle highlight animation.
  - `NEW_REPLY`: Appends incoming replies to the open discussion thread and updates total reply counters in real-time.
  - `MEMBER_STATUS_CHANGED`: Dynamically updates the active member presence count and online member status dots.
  - `METRICS_UPDATED`: Live real-time updates for reply counts, view counters, and upvotes.

### 4. Single-Page Viewport Layout
- Constrained with `.student-dashboard--community` (`overflow: hidden; height: 100%`) so the entire 2-row bento grid and sidebar fit seamlessly within standard desktop display heights without vertical or horizontal scrollbars.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة الميزة (Overview)
صفحة المجتمع (`/community`) هي مساحة تفاعلية للطلاب للمناقشة، تكوين مجموعات دراسية (Study Groups)، الاستفادة من خبراء وموجهين (Mentors)، ومتابعة الفعاليات القادمة، وكل ده في شاشة واحدة منسقة بدون سكرول (Unscrollable Single Page View) مع تزامن فوري عبر WebSockets.

### 2. المكونات الرئيسية
1. **مسار التنقل المدمج (CommunityBreadcrumb)**: بيعرض المسار السريع `Home / Community` مع عداد حي للطلاب المتصلين حالياً.
2. **شريط البحث والتصنيفات (SearchAndFilterToolbar)**: بحث ذكي مع فلترة للموضوعات والأقسام وزرار `+` لإنشاء موضوع جديد.
3. **مجموعة المذاكرة المميزة (FeaturedGroupCard)**: كارت أنيق بألوان الأخضر المتدرج بيعرض تفاصيل مجموعة المذاكرة وعدد المشتركين وزرار الانضمام.
4. **الموضوعات الرائجة (TrendingTopicsWidget)**: أهم المناقشات النشطة مع عدد الردود وأيقونات ملونة.
5. **سجل المناقشات الأخيرة (DiscussionFeed)**: رسايل ومواضيع الطلاب مع عدد المشاهدات والردود؛ عند الضغط على أي مناقشة بيفتح نافذة تفاصيل المناقشة فوراً.
6. **نافذة تفاصيل المناقشة والردود اللحظية (DiscussionDetailModal)**: بتعرض نص المناقشة الكامل، ردود الطلاب السابقة، وإمكانية كتابة رد فوري بيتحدث في نفس اللحظة عبر الـ WebSocket مع زر إعجاب (Upvote).
7. **الموجه المختار (MentorSpotlightCard)**: كارت تعريفي بأحد الخبراء المعتمدين وتخصصه.
8. **القائمة الجانبية (CommunitySidebar)**: المتواجدون الآن، الفعاليات وورش العمل القادمة، ولوحة الشرف لأكثر الطلاب تفاعلاً (Leaderboard).

