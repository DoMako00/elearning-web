import React from "react";
import "./Skeleton.css";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
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
    borderRadius: circle ? "9999px" : borderRadius !== undefined ? (typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius) : "8px",
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

export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number | string;
  gap?: number | string;
  lastLineWidth?: string;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 14,
  gap = 8,
  lastLineWidth = "70%",
  className = "",
}) => {
  return (
    <div
      aria-hidden="true"
      className={`flex flex-col ${className}`}
      style={{ gap: typeof gap === "number" ? `${gap}px` : gap }}
    >
      {Array.from({ length: lines }).map((_, index) => {
        const isLast = index === lines - 1 && lines > 1;
        return (
          <Skeleton
            key={index}
            height={lineHeight}
            width={isLast ? lastLineWidth : "100%"}
            borderRadius={4}
          />
        );
      })}
    </div>
  );
};

export interface SkeletonAvatarProps {
  size?: number | string;
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 40,
  className = "",
}) => {
  return <Skeleton width={size} height={size} circle className={className} />;
};

export interface SkeletonCardProps {
  className?: string;
}

/**
 * Matches exact course card dimensions in CourseLibrary (.course-library__card).
 * Height: clamp(265px, 29vh, 290px), art area: 138px.
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={`flex flex-col overflow-hidden rounded-2xl border border-[#dfe9e4] bg-white shadow-2xs ${className}`}
      style={{ minHeight: "265px", height: "100%" }}
    >
      {/* Top Banner / Art area matching 138px */}
      <Skeleton height={138} borderRadius={0} className="w-full shrink-0" />
      {/* Body Content */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div className="space-y-2">
          {/* Category / Level tag skeleton */}
          <div className="flex gap-2">
            <Skeleton width={60} height={18} borderRadius={4} />
            <Skeleton width={50} height={18} borderRadius={4} />
          </div>
          {/* Title */}
          <Skeleton width="85%" height={18} borderRadius={4} />
          {/* Subtitle */}
          <Skeleton width="60%" height={14} borderRadius={4} />
        </div>
        {/* Progress bar and lesson count */}
        <div className="space-y-2 pt-3">
          <div className="flex justify-between items-center">
            <Skeleton width={70} height={12} borderRadius={4} />
            <Skeleton width={30} height={12} borderRadius={4} />
          </div>
          <Skeleton width="100%" height={6} borderRadius={999} />
        </div>
      </div>
    </div>
  );
};

export interface SkeletonListRowProps {
  className?: string;
}

/**
 * Matches list row in CourseLibrary or assignments (.course-library__list-item).
 */
export const SkeletonListRow: React.FC<SkeletonListRowProps> = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-4 p-3.5 rounded-xl border border-[#dfe9e4] bg-white ${className}`}
    >
      <Skeleton width={56} height={56} borderRadius={12} className="shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton width="45%" height={16} borderRadius={4} />
        <Skeleton width="30%" height={12} borderRadius={4} />
      </div>
      <div className="w-32 hidden sm:flex flex-col gap-1.5 shrink-0">
        <Skeleton width="100%" height={6} borderRadius={999} />
        <Skeleton width="40%" height={10} borderRadius={4} className="self-end" />
      </div>
    </div>
  );
};
