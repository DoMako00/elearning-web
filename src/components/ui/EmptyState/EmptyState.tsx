import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./EmptyState.css";

export interface EmptyStateProps {
  size?: "page" | "card";
  illustration?: ReactNode;
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({
  size = "page",
  illustration,
  icon,
  title,
  description,
  actions,
  className = "",
}: EmptyStateProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 8,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.25,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const floatVariants = {
    animate: {
      y: shouldReduceMotion ? [0, 0] : [0, -4, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1] as const,
      },
    },
  };

  return (
    <motion.div
      className={`gl-empty-state gl-empty-state--${size} ${className}`.trim()}
      role="region"
      aria-live="polite"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {size === "page" && illustration ? (
        <motion.div
          className="gl-empty-state__illustration"
          aria-hidden="true"
          variants={floatVariants}
          animate="animate"
        >
          {illustration}
        </motion.div>
      ) : null}

      {size === "card" && icon ? (
        <div className="gl-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}

      <div className="gl-empty-state__content">
        <h2 className="gl-empty-state__title">{title}</h2>
        {description ? (
          <p className="gl-empty-state__description">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="gl-empty-state__actions">{actions}</div> : null}
    </motion.div>
  );
}

export default EmptyState;
