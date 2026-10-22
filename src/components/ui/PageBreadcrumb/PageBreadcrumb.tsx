import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { BreadcrumbEcg } from "./BreadcrumbEcg";
import "./PageBreadcrumb.css";

export interface BreadcrumbTrailItem {
  label: string;
  to?: string;
}

export interface PageBreadcrumbProps {
  trail: BreadcrumbTrailItem[];
  title: string;
  icon?: ReactNode;
  meta?: ReactNode;
  className?: string;
  renderH1?: boolean;
}

export function PageBreadcrumb({
  trail,
  title,
  icon,
  meta,
  className,
  renderH1 = true,
}: PageBreadcrumbProps) {
  const shouldReduceMotion = useReducedMotion();

  const chipTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.16, 1, 0.3, 1] };

  const trailTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.3, delay: 0.08, ease: "easeOut" };

  const titleTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.35, delay: 0.16, ease: [0.16, 1, 0.3, 1] };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`page-breadcrumb ${className ?? ""}`.trim()}
    >
      {icon && (
        <motion.div
          className="flex items-center"
          initial={shouldReduceMotion ? false : { scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={chipTransition}
        />
      )}

      <ol className="page-breadcrumb__list">
        {trail.map((item, index) => (
          <motion.li
            key={index}
            className="page-breadcrumb__item page-breadcrumb__item--trail"
            initial={shouldReduceMotion ? false : { opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={trailTransition}
          >
            {item.to ? (
              <Link to={item.to} className="page-breadcrumb__trail-link">
                {item.label}
              </Link>
            ) : (
              <span className="page-breadcrumb__trail-text">{item.label}</span>
            )}
            <ChevronRight
              size={13}
              strokeWidth={2.4}
              className="page-breadcrumb__chevron"
              aria-hidden="true"
            />
          </motion.li>
        ))}

        <li
          className="page-breadcrumb__item page-breadcrumb__item--current"
          aria-current="page"
        >
          <motion.div
            className="page-breadcrumb__title-wrapper"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={titleTransition}
          >
            {renderH1 ? (
              <h1 className="page-breadcrumb__title" title={title}>
                {title}
              </h1>
            ) : (
              <span
                className="page-breadcrumb__title"
                role="heading"
                aria-level={1}
                title={title}
              >
                {title}
              </span>
            )}

            {/* Animated Canvas ECG — oscilloscope sweep beneath heading */}
            <BreadcrumbEcg bpm={72} />
          </motion.div>
        </li>

        {meta && (
          <motion.li
            className="page-breadcrumb__item page-breadcrumb__item--meta"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={trailTransition}
          >
            {meta}
          </motion.li>
        )}
      </ol>
    </nav>
  );
}
