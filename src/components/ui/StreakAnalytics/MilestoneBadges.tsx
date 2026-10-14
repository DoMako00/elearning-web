/**
 * MilestoneBadges - Streak achievement badges showcase
 * Matches GreenLearn design system
 */

import { useMemo } from 'react';
import type { MilestoneStatus } from '../../../shared/utils/streakEngine';
import './MilestoneBadges.css';

interface MilestoneBadgesProps {
  milestones: MilestoneStatus[];
}

export function MilestoneBadge({ 
  milestone, 
  isUnlocked, 
  progress, 
  daysRemaining 
}: MilestoneStatus) {
  return (
    <article
      className={`milestone-badge ${isUnlocked ? 'milestone-badge--unlocked' : 'milestone-badge--locked'} ${milestone.color}`}
      role="listitem"
      aria-label={`${milestone.label} ${isUnlocked ? 'unlocked' : 'locked'}, ${progress}% complete`}
    >
      <div className="milestone-badge-icon-wrapper">
        <span className="milestone-badge-icon" aria-hidden="true">
          {milestone.icon}
        </span>
        {isUnlocked && (
          <span className="milestone-badge-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {!isUnlocked && (
          <span className="milestone-badge-lock" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        )}
      </div>

      <div className="milestone-badge-content">
        <h3 className="milestone-badge-label">{milestone.label}</h3>
        <p className="milestone-badge-description">{milestone.description}</p>
        
        <div className="milestone-badge-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${milestone.label} progress`}>
          <div 
            className="milestone-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="milestone-badge-progress-text">
          <span className="milestone-progress-percent">{progress}%</span>
          <span className="milestone-progress-remaining">
            {isUnlocked ? 'Unlocked!' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} to unlock`}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MilestoneBadges({ milestones }: MilestoneBadgesProps) {
  const sortedMilestones = useMemo(() => 
    [...milestones].sort((a, b) => a.milestone.requiredDays - b.milestone.requiredDays),
  [milestones]);

  return (
    <section className="milestone-badges" aria-labelledby="milestones-title">
      <header className="milestone-badges-header">
        <h2 id="milestones-title" className="milestone-badges-title">Streak Milestones</h2>
        <p className="milestone-badges-subtitle">Achieve streaks to unlock badges</p>
      </header>

      <div className="milestone-badges-grid" role="list" aria-label="Streak milestones">
        {sortedMilestones.map((status) => (
          <MilestoneBadge
            key={status.milestone.id}
            milestone={status.milestone}
            isUnlocked={status.isUnlocked}
            progress={status.progress}
            daysRemaining={status.daysRemaining}
          />
        ))}
      </div>
    </section>
  );
}