# 💬 Real-Time Messages & Chat System
# توثيق نظام الرسائل والمحادثات المباشرة (Messages & Chat System)

---

## 🇺🇸 English Documentation

### 1. Overview
The Messages workspace (`/messages`) delivers a full-featured real-time chat interface connecting students with course instructors, study group peers, and academic advisors.

### 2. Architecture & File Structure
- **Main Page**: `src/app/pages/student/MessagesPage.tsx`
- **Layout Shell**: `src/components/ui/Messages/MessagesLayout.tsx`
- **Chat Components**:
  - `ConversationList.tsx`: Left sidebar showing recent active threads, search filter, online status indicators, and unread badges.
  - `ChatWindow.tsx`: Central chat view with message bubbles, attachment actions, audio recordings, and text input bar.
  - `MessageBubble.tsx`: Individual chat bubble rendering text, timestamps, read receipts, and file attachments.
  - `ChatContextSidebar.tsx`: Right-hand contextual rail displaying shared media, member lists, course affiliations, and notification muting.
- **Provider & State**: `src/app/providers/MessagesProvider.tsx` (Provides global `unreadChatsCount` reflected on the main navigation sidebar).
- **Data & Styles**: `messages.data.ts`, `Messages.css`

### 3. Core Capabilities
- **Unread Badge Integration**: Live badge counts calculated by `MessagesProvider` and displayed on the persistent Sidebar navigation link.
- **Rich Media Support**: Image attachments, PDF course references, and voice note playback.
- **Instant Search**: Quick filtering of conversations by peer/instructor name or recent messages.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة نظام الرسائل (Overview)
صفحة الرسائل (`/messages`) بتوفر شات متكامل وسريع للتواصل بين الطالب والأساتذة أو زملاء الدراسة في مجموعات الكورسات.

### 2. تقسيم مكونات الشات
1. **قائمة المحادثات (ConversationList)**: على الشمال، بتعرض كل الشاتات مع علامات الحالة (أونلاين)، وعدد الرسائل غير المقروءة، وبحث سريع بالاسم.
2. **نافذة المحادثة (ChatWindow)**: في المنتصف، بتعرض الرسايل، إمكانية كتابة رد، إرسال ملفات ومرفقات، ورسائل صوتية.
3. **الشريط الجانبي لمعلومات المحادثة (ChatContextSidebar)**: على اليمين، بيعرض ملفات الميديا المشتركة بينكم، ومعلومات المدرس أو المجموعة.
4. **عداد الرسائل في السايدبار (MessagesProvider)**: بيعد الرسائل غير المقروءة ويحط بادج رقمي على زرار الرسائل في القائمة الرئيسية للمنصة كلها.
