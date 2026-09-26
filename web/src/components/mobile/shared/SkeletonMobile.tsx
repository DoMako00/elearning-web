import React from "react";
import "../../ui/Skeleton/Skeleton.css";

export interface MobileSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
}

export const MobileSkeleton: React.FC<MobileSkeletonProps> = ({
  width,
  height,
  borderRadius,
  circle = false,
  className = "",
  style,
  ...rest
}) => {
  const inlineStyle: React.CSSProperties = {
    width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
    borderRadius: circle ? "9999px" : borderRadius !== undefined ? (typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius) : "12px",
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer ${className}`}
      style={inlineStyle}
      {...rest}
    />
  );
};

/**
 * Matches mobile CourseCard.tsx (layout === "full" default):
 * Container: rounded-3xl border border-slate-100 p-3.5 sm:p-4 flex gap-3.5 sm:gap-4
 * Thumbnail: w-22 h-22 sm:w-26 sm:h-26 rounded-2xl
 */
export const SkeletonCourseCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={`w-full bg-white rounded-3xl border border-slate-100/90 p-3.5 sm:p-4 shadow-2xs flex gap-3.5 sm:gap-4 ${className}`}
    >
      <MobileSkeleton width={88} height={88} borderRadius={16} className="shrink-0 sm:w-26 sm:h-26" />
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <MobileSkeleton width={68} height={18} borderRadius={999} />
            <MobileSkeleton width={20} height={20} circle />
          </div>
          <MobileSkeleton width="85%" height={16} borderRadius={4} />
          <MobileSkeleton width="60%" height={12} borderRadius={4} />
        </div>
        <div className="pt-2 flex items-center justify-between gap-3">
          <MobileSkeleton width="70%" height={6} borderRadius={999} />
          <MobileSkeleton width={30} height={12} borderRadius={4} />
        </div>
      </div>
    </div>
  );
};

/**
 * Matches mobile AssignmentCard.tsx:
 * Container: bg-white rounded-3xl border border-slate-100 p-4 shadow-2xs space-y-3
 */
export const SkeletonAssignmentCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={`w-full bg-white rounded-3xl border border-slate-100 p-4 shadow-2xs space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileSkeleton width={64} height={20} borderRadius={999} />
          <MobileSkeleton width={52} height={20} borderRadius={999} />
        </div>
        <MobileSkeleton width={20} height={20} circle />
      </div>
      <div className="space-y-1.5">
        <MobileSkeleton width="90%" height={16} borderRadius={4} />
        <MobileSkeleton width="65%" height={12} borderRadius={4} />
      </div>
      <div className="pt-2 flex items-center justify-between border-t border-slate-50">
        <MobileSkeleton width={80} height={14} borderRadius={4} />
        <MobileSkeleton width={75} height={28} borderRadius={10} />
      </div>
    </div>
  );
};

/**
 * Matches mobile EventCard.tsx:
 * Container: bg-white rounded-3xl border border-slate-100 p-4 shadow-2xs
 */
export const SkeletonEventCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={`w-full bg-white rounded-3xl border border-slate-100 p-4 shadow-2xs space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <MobileSkeleton width={80} height={22} borderRadius={999} />
        <MobileSkeleton width={50} height={14} borderRadius={4} />
      </div>
      <div className="space-y-1.5">
        <MobileSkeleton width="85%" height={16} borderRadius={4} />
        <MobileSkeleton width="55%" height={12} borderRadius={4} />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <MobileSkeleton width={24} height={24} circle />
        <MobileSkeleton width={90} height={12} borderRadius={4} />
      </div>
    </div>
  );
};

/**
 * Matches mobile ReminderRow.tsx:
 * Container: bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3
 */
export const SkeletonReminderRow: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={`w-full bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3 ${className}`}
    >
      <MobileSkeleton width={38} height={38} borderRadius={12} className="shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <MobileSkeleton width="75%" height={14} borderRadius={4} />
        <MobileSkeleton width="45%" height={11} borderRadius={4} />
      </div>
      <MobileSkeleton width={50} height={18} borderRadius={999} className="shrink-0" />
    </div>
  );
};
