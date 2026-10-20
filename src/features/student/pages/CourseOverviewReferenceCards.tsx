import { Skeleton, SkeletonText, SkeletonAvatar } from "../../../components/ui/Skeleton";
import { ArrowRight, FolderOpen, Paperclip } from "lucide-react";
import heroBackground from "../../../Assets/dashboard/my-courses-hero-background.webp";
import type { mapCourseResources } from "../../../components/learning-space/learningSpaceMappers";

export function CourseHeroArt({ artwork }: { artwork: string }) {
  return (
    <div className="course-overview-hero__art" aria-hidden="true">
      <img src={heroBackground} alt="" className="course-overview-hero__art-bg" />
      {artwork ? <img src={artwork} alt="" className="course-overview-hero__art-anatomy" /> : null}
    </div>
  );
}

interface CourseMaterialsCardProps {
  resources: ReturnType<typeof mapCourseResources>;
  canOpen: boolean;
  onOpenLesson: (lessonId: string) => void;
  onViewAll: () => void;
}

export function CourseMaterialsCard({ resources, canOpen, onOpenLesson, onViewAll }: CourseMaterialsCardProps) {
  return (
    <article className="course-overview-card course-overview-materials course-overview-materials--primary">
      <header>
        <h2>Recent materials</h2>
        <button type="button" onClick={onViewAll}>View all materials <ArrowRight aria-hidden="true" /></button>
      </header>
      {resources.length ? (
        <div className="course-overview-materials__grid">
          {resources.slice(0, 3).map(resource => (
            <button className="course-overview-material" key={resource.id} disabled={!canOpen || !resource.available} onClick={() => onOpenLesson(resource.lessonId)}>
              <span className="course-overview-material__icon"><Paperclip aria-hidden="true" /><small>{resource.extension}</small></span>
              <span className="course-overview-material__copy"><strong>{resource.title}</strong><small>{resource.chapterTitle}</small></span>
            </button>
          ))}
        </div>
      ) : (
        <div className="course-overview-materials__empty"><FolderOpen aria-hidden="true" /><p>No materials are attached yet.</p></div>
      )}
    </article>
  );
}

export function CourseOverviewSkeleton() {
  return (
    <section className="course-overview-page" aria-busy="true" aria-label="Loading course overview">
      <div className="course-overview-layout">
        <div className="course-overview-primary">
          <div className="course-overview-hero bg-white border border-[#dfe9e4] rounded-2xl p-6 flex flex-col justify-between" style={{ minHeight: "340px" }}>
            <div className="space-y-4 max-w-xl">
              <Skeleton width={160} height={24} borderRadius={999} />
              <Skeleton width="85%" height={32} borderRadius={6} />
              <div className="flex gap-3">
                <Skeleton width={120} height={16} borderRadius={4} />
                <Skeleton width={100} height={16} borderRadius={4} />
              </div>
            </div>
            <div className="pt-6 border-t border-[#edf3f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonAvatar size={44} />
                <div className="space-y-1.5">
                  <Skeleton width={140} height={14} borderRadius={4} />
                  <Skeleton width={90} height={12} borderRadius={4} />
                </div>
              </div>
              <Skeleton width={150} height={40} borderRadius={10} />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Skeleton width={100} height={36} borderRadius={8} />
            <Skeleton width={90} height={36} borderRadius={8} />
            <Skeleton width={100} height={36} borderRadius={8} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-5 rounded-2xl border border-[#dfe9e4] bg-white space-y-3">
              <Skeleton width="40%" height={20} borderRadius={4} />
              <SkeletonText lines={3} />
            </div>
            <div className="p-5 rounded-2xl border border-[#dfe9e4] bg-white space-y-3">
              <Skeleton width="50%" height={20} borderRadius={4} />
              <SkeletonText lines={3} />
            </div>
          </div>
        </div>

        <aside className="course-overview-rail space-y-3" style={{ minWidth: "300px" }}>
          <div className="p-5 rounded-2xl border border-[#dfe9e4] bg-white space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton width={120} height={18} borderRadius={4} />
              <Skeleton width={60} height={14} borderRadius={4} />
            </div>
            <div className="space-y-2.5">
              <Skeleton width="100%" height={44} borderRadius={10} />
              <Skeleton width="100%" height={44} borderRadius={10} />
              <Skeleton width="100%" height={44} borderRadius={10} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
