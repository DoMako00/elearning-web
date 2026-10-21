import React, { useMemo, useState } from "react";
import { BookOpen, ChevronRight, GraduationCap, MessageSquare, ThumbsUp, Users } from "lucide-react";
import { TopAppBar } from "../TopAppBar";
import { useScreenStack } from "../ScreenStack";
import { HeroBand } from "../shared/HeroBand";
import { MobileSearchBar } from "../shared/MobileSearchBar";
import { CategoryChipsRow } from "../shared/CategoryChipsRow";
import { SectionHeader } from "../shared/SectionHeader";
import { MobileToast } from "../shared/MobileToast";
import { CreateThreadModal } from "../../../features/community/components/CreateThreadModal";
import type { TopicCategory } from "../../../features/community/types/community";
import { mapCommunityPost, mapCommunityComment } from "../../../features/student/api/studentCommunityMapper";
import { useCreateStudentCommunityPost, useCreateStudentCommunityComment, useSetStudentCommunityReaction, useStudentCommunityComments, useStudentCommunityPosts, useStudentCommunityRooms } from "../../../features/student/api/useStudentCommunity";
import { useStudentProfile } from "../../../features/student/api/useStudentLearning";

const categories = [
  { key: "all", label: "All" },
  { key: "discussions", label: "Discussions" },
  { key: "qa", label: "Q&A" },
];

export const CommunityScreen: React.FC = () => {
  const stack = useScreenStack();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TopicCategory>("all");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const profile = useStudentProfile();
  const roomsQuery = useStudentCommunityRooms();
  const rooms = roomsQuery.data ?? [];
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? rooms.find((room) => room.kind === "course") ?? rooms[0] ?? null;
  const feed = useStudentCommunityPosts(selectedRoom?.id ?? null);
  const createPost = useCreateStudentCommunityPost();
  const posts = feed.data ?? [];
  const filtered = useMemo(() => posts.filter((post) => {
    const q = search.trim().toLowerCase();
    const matchesQuery = !q || `${post.title ?? ""} ${post.body} ${post.authorName} ${post.categoryKey}`.toLowerCase().includes(q);
    const matchesCategory = category === "all" || category === "discussions" || (category === "qa" && (post.title ?? "").includes("?"));
    return matchesQuery && matchesCategory;
  }), [posts, search, category]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const submitPost = async (input: { title: string; body: string; categoryKey: string }) => {
    setCreateError(null);
    if (!selectedRoom) {
      const message = "No discussion room is available for your account.";
      setCreateError(message);
      throw new Error(message);
    }
    try {
      const post = await createPost.mutateAsync({ id: crypto.randomUUID(), title: input.title, body: input.body, categoryKey: input.categoryKey as "react" | "design" | "datascience" | "backend" | "general", roomId: selectedRoom.id });
      setCreateOpen(false);
      showToast("Discussion saved in this room.");
      stack.push({
        id: `community-${post.id}`,
        title: "Discussion",
        tabRoot: "settings",
        variant: "detail",
        backLabel: "Community",
        component: <CommunityDetailScreen postId={post.id} roomId={selectedRoom.id} />,
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Discussion could not be saved.");
      throw error;
    }
  };

  const openPost = (postId: string) => stack.push({
    id: `community-${postId}`,
    title: "Discussion",
    tabRoot: "settings",
    variant: "detail",
    backLabel: "Community",
    component: <CommunityDetailScreen postId={postId} roomId={selectedRoom?.id ?? undefined} />,
  });

  const topicCounts = posts.reduce<Record<string, number>>((acc, post) => {
    acc[post.categoryKey] = (acc[post.categoryKey] ?? 0) + 1;
    return acc;
  }, {});
  const comments = posts.reduce((sum, post) => sum + post.commentCount, 0);
  const likes = posts.reduce((sum, post) => sum + post.reactionCount, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <MobileToast message={toast} />
      <TopAppBar variant="main" />
      <div className="flex-1 overflow-y-auto">
        <HeroBand
          eyebrow="Student Network"
          heading="Community"
          subtitle="Learn together. Share ideas. Grow further."
          illustration={<div className="relative w-32 h-24 sm:w-36 sm:h-28 flex items-center justify-end"><div className="w-16 h-16 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center shadow-xs"><Users className="w-8 h-8" /></div></div>}
        />
        <div className="px-4 pb-20 space-y-5 max-w-lg mx-auto">
          <MobileSearchBar value={search} onChange={setSearch} placeholder="Search discussions..." />
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar"><CategoryChipsRow categories={categories} activeKey={category} onChange={(key) => setCategory(key as TopicCategory)} /></div>
            <button type="button" onClick={() => { setCreateError(null); setCreateOpen(true); }} aria-label="Create discussion" className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors shrink-0 cursor-pointer">+</button>
          </div>
          <section className="p-4 bg-linear-to-br from-emerald-900 via-emerald-800 to-emerald-700 rounded-3xl text-white shadow-sm border border-emerald-700/60 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-200">{selectedRoom?.kind === "course" ? <GraduationCap className="size-3.5" /> : <Users className="size-3.5" />}{selectedRoom?.kind === "course" ? "Course room" : "Your community"}</span>
            <h3 className="text-base font-bold">{roomsQuery.isPending ? "Loading your rooms…" : selectedRoom?.title ?? "Learning community"}</h3>
            <p className="text-xs text-emerald-100/80 leading-relaxed">{selectedRoom?.kind === "course" ? [selectedRoom.code, selectedRoom.semesterTitle].filter(Boolean).join(" · ") : profile.data ? `${profile.data.institution.name} · ${profile.data.brand.name}` : "Shared with students in your active academic community."}</p>
          </section>
          <section className="space-y-2.5">
            <SectionHeader title="Your rooms" />
            {roomsQuery.isPending ? <p role="status" className="p-3 bg-white rounded-2xl border border-slate-100 text-xs text-slate-500">Loading rooms…</p> : null}
            {roomsQuery.isError ? <p role="alert" className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-700">Course rooms could not be loaded.</p> : null}
            {roomsQuery.isSuccess && rooms.length === 0 ? <p className="p-3 bg-white rounded-2xl border border-slate-100 text-xs text-slate-500">No rooms are available for your current course access.</p> : rooms.map((room) => <button key={room.id} type="button" onClick={() => { setSelectedRoomId(room.id); setCategory("all"); }} aria-pressed={selectedRoom?.id === room.id} className={`w-full flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-colors ${selectedRoom?.id === room.id ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-white"}`}><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><BookOpen className="size-4" /></span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{room.title}</span><span className="text-[10px] text-slate-400">{room.discussionCount}</span></button>)}
          </section>
          <section className="space-y-2.5">
            <SectionHeader title="Topics in discussions" />
            {feed.isPending ? <p role="status" className="p-3 bg-white rounded-2xl border border-slate-100 text-xs text-slate-500">Loading topics…</p> : feed.isError ? <p role="alert" className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-700">Topics could not be loaded.</p> : Object.entries(topicCounts).length === 0 ? <p className="p-3 bg-white rounded-2xl border border-slate-100 text-xs text-slate-500">Topics appear as Students create discussions.</p> : Object.entries(topicCounts).map(([key, count]) => <div key={key} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 text-xs"><span className="font-semibold text-slate-700">{key === "datascience" ? "Data Science & AI" : key === "backend" ? "Backend & APIs" : key === "react" ? "React & Next.js" : key === "design" ? "UI/UX Design" : "General"}</span><span className="text-slate-500">{count} threads</span></div>)}
          </section>
          <section className="space-y-2.5">
            <SectionHeader title="Recent discussions" actionLabel="Create" onAction={() => setCreateOpen(true)} />
            {feed.isPending ? <p role="status" className="p-4 bg-white rounded-2xl border border-slate-100 text-xs text-slate-500">Loading persisted discussions…</p> : feed.isError ? <p role="alert" className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-700">Community discussions could not be loaded.</p> : filtered.length === 0 ? <p className="p-4 bg-white rounded-2xl border border-slate-100 text-xs text-slate-500">No discussions in this view yet.</p> : filtered.map((dto) => {
              const post = mapCommunityPost(dto);
              return <button key={post.id} type="button" onClick={() => openPost(post.id)} className="w-full text-left p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-emerald-200 transition-all space-y-2.5">
                <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2 min-w-0"><span aria-hidden="true" className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center text-xs font-bold">{post.author.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="text-xs font-bold text-slate-900 truncate">{post.author.name}</p><p className="text-[10px] text-slate-400 mt-0.5">{post.timeAgo}</p></div></div><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9.5px] font-bold border border-emerald-200">{post.category.label}</span></div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{post.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2">{post.content}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50"><span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{post.repliesCount} replies <span className="mx-1">·</span><ThumbsUp className="w-3.5 h-3.5" />{post.upvotesCount} likes</span><ChevronRight className="w-4 h-4 text-slate-300" /></div>
              </button>;
            })}
          </section>
          <section className="p-4 bg-white rounded-3xl border border-slate-100 shadow-2xs"><SectionHeader title="Community activity" /><div className="mt-3 grid grid-cols-3 gap-2 text-center"><div><strong className="block text-sm text-slate-900">{feed.isPending || feed.isError ? "—" : posts.length}</strong><span className="text-[10px] text-slate-500">discussions</span></div><div><strong className="block text-sm text-slate-900">{feed.isPending || feed.isError ? "—" : comments}</strong><span className="text-[10px] text-slate-500">replies</span></div><div><strong className="block text-sm text-slate-900">{feed.isPending || feed.isError ? "—" : likes}</strong><span className="text-[10px] text-slate-500">likes</span></div></div></section>
        </div>
      </div>
      <CreateThreadModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSubmit={submitPost} isSubmitting={createPost.isPending} errorMessage={createError} />
    </div>
  );
};

function CommunityDetailScreen({ postId, roomId }: { postId: string; roomId?: string }) {
  const { pop } = useScreenStack();
  const postQuery = useStudentCommunityPosts(roomId ?? null);
  const commentsQuery = useStudentCommunityComments(postId);
  const addComment = useCreateStudentCommunityComment(postId);
  const reaction = useSetStudentCommunityReaction();
  const [reply, setReply] = useState("");
  const dto = postQuery.data?.find((post) => post.id === postId);
  const post = dto ? mapCommunityPost(dto, commentsQuery.data) : null;

  if (!postQuery.isPending && !post) return <div className="flex-1 flex flex-col min-h-0"><TopAppBar variant="detail" title="Discussion" backLabel="Community" onBack={pop} /><p className="m-4 p-4 bg-white rounded-2xl text-sm text-slate-500">This discussion is unavailable in your current community scope.</p></div>;

  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reply.trim() || addComment.isPending) return;
    await addComment.mutateAsync({ id: crypto.randomUUID(), body: reply.trim() });
    setReply("");
  };

  return <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50"><TopAppBar variant="detail" title="Discussion" backLabel="Community" onBack={pop} />{!post ? <p role="status" className="m-4 p-4 bg-white rounded-2xl text-xs text-slate-500">Loading saved discussion…</p> : <><div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-24"><article className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 space-y-3 shadow-2xs"><div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span aria-hidden="true" className="size-9 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center text-sm font-bold">{post.author.name.slice(0, 1).toUpperCase()}</span><div><p className="text-xs font-bold text-slate-900">{post.author.name}</p><p className="text-[10px] text-slate-400 mt-0.5">{post.timeAgo}</p></div></div><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">{post.category.label}</span></div><h2 className="text-sm sm:text-base font-bold text-slate-900">{post.title}</h2><p className="text-xs text-slate-700 leading-relaxed border-t border-slate-100 pt-2.5 whitespace-pre-line">{post.content}</p><button type="button" onClick={() => dto && reaction.mutate({ postId, active: !dto.reacted })} disabled={reaction.isPending} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><ThumbsUp className="w-3.5 h-3.5" />{post.upvotesCount ?? 0} likes</button></article><section className="space-y-2.5"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Replies ({post.repliesCount})</h3>{commentsQuery.isPending ? <p role="status" className="p-4 bg-white rounded-2xl text-xs text-slate-500">Loading saved replies…</p> : commentsQuery.isError ? <p role="alert" className="p-4 bg-rose-50 rounded-2xl text-xs text-rose-700">Replies could not be loaded.</p> : (commentsQuery.data ?? []).length === 0 ? <p className="p-4 bg-white rounded-2xl border border-slate-100 text-xs text-slate-500">No replies yet. Be the first to join the conversation.</p> : commentsQuery.data!.map((item) => { const comment = mapCommunityComment(item); return <article key={comment.id} className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-1.5"><div className="flex items-center gap-2"><span aria-hidden="true" className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 grid place-items-center text-[9px] font-bold">{comment.author.name.slice(0, 1).toUpperCase()}</span><span className="text-xs font-bold text-slate-800">{comment.author.name}</span><span className="text-[10px] text-slate-400">{comment.timeAgo}</span></div><p className="text-xs text-slate-600 leading-relaxed pl-8">{comment.content}</p></article>; })}</section></div><form onSubmit={submitReply} className="shrink-0 p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2 max-w-lg mx-auto w-full"><input type="text" placeholder="Write a reply…" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={10000} className="flex-1 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500" /><button type="submit" disabled={!reply.trim() || addComment.isPending} className="p-2 rounded-xl bg-emerald-600 disabled:opacity-50 text-white"><MessageSquare className="w-4 h-4" /></button></form></>}</div>;
}
