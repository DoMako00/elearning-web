import { useState } from 'react';
import { useXPRewards, XPRewardModal, LevelUpModal } from '../../../../components/ui/XPRewards';
import type { XPRewardData } from '../../../../components/ui/XPRewards';
import { Award, Zap, Trophy, Star, ChevronLeft, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import './TestXPRewardsPage.css';

export function TestXPRewardsPage() {
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ prevLevel: 2, newLevel: 3, totalXP: 3250 });

  const {
    currentXP,
    currentLevel,
    levelInfo,
    earnXP,
    isModalOpen,
    rewardData,
    addXPSilently,
    closeRewardModal,
  } = useXPRewards({
    initialXP: 1250,
    onLevelUp: (level: number, reward: XPRewardData) => {
      console.log('🎉 Level Up!', { level, reward });
      setLevelUpData({
        prevLevel: reward.previousLevel,
        newLevel: reward.newLevel,
        totalXP: reward.totalXP,
      });
      setIsLevelUpModalOpen(true);
    },
    onXPEarned: (reward: XPRewardData) => {
      console.log('✨ XP Earned:', reward);
    },
  });

  const handleTriggerLevelUpOnly = () => {
    setLevelUpData({
      prevLevel: currentLevel,
      newLevel: currentLevel + 1,
      totalXP: currentXP + 500,
    });
    setIsLevelUpModalOpen(true);
  };

  const handleLessonComplete = () => earnXP(50, 'lesson_complete');
  const handleModuleComplete = () => earnXP(200, 'module_complete');
  const handleStreakBonus = () => earnXP(75, 'streak_bonus');
  const handlePerfectScore = () => earnXP(100, 'perfect_score');
  const handleMassiveXP = () => earnXP(1500, 'custom');
  const handleReset = () => {
    addXPSilently(-currentXP);
  };

  return (
    <section className="test-xp-page" aria-labelledby="test-xp-title">
      <header className="test-xp-header">
        <Link to="/my-courses/human-anatomy-i/lessons/human-anatomy-i-lesson-1" className="test-xp-back">
          <ChevronLeft size={20} aria-hidden="true" /> Back to Lesson
        </Link>
        <div className="test-xp-header-content">
          <h1 id="test-xp-title" className="test-xp-title">XP Reward System Test</h1>
          <p className="test-xp-subtitle">Test the gamification pipeline with live XP rewards</p>
        </div>
      </header>

      <main className="test-xp-main">
        <div className="test-xp-grid">
          <aside className="test-xp-stats-panel" aria-label="XP Statistics">
            <div className="test-xp-stat-card level-card">
              <div className="test-xp-stat-icon level-icon">
                <Trophy size={24} aria-hidden="true" />
              </div>
              <div className="test-xp-stat-content">
                <span className="test-xp-stat-label">Current Level</span>
                <span className="test-xp-stat-value level-value">{currentLevel}</span>
              </div>
            </div>

            <div className="test-xp-stat-card xp-card">
              <div className="test-xp-stat-icon xp-icon">
                <Star size={24} aria-hidden="true" />
              </div>
              <div className="test-xp-stat-content">
                <span className="test-xp-stat-label">Total XP</span>
                <span className="test-xp-stat-value xp-value">{currentXP.toLocaleString()}</span>
              </div>
            </div>

            <div className="test-xp-stat-card progress-card">
              <div className="test-xp-stat-icon progress-icon">
                <Zap size={24} aria-hidden="true" />
              </div>
              <div className="test-xp-stat-content">
                <span className="test-xp-stat-label">To Next Level</span>
                <span className="test-xp-stat-value progress-value">{levelInfo.xpNeededForNextLevel.toLocaleString()} XP</span>
              </div>
            </div>

            <div className="test-xp-stat-card progress-bar-card">
              <div className="test-xp-progress-container">
                <div className="test-xp-progress-header">
                  <span className="test-xp-progress-label">Level Progress</span>
                  <span className="test-xp-progress-percent">{levelInfo.progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="test-xp-progress-track" role="progressbar" aria-valuenow={levelInfo.progressPercentage} aria-valuemin={0} aria-valuemax={100} aria-label="Level progress">
                  <div className="test-xp-progress-fill" style={{ width: `${levelInfo.progressPercentage}%` }} />
                </div>
                <div className="test-xp-progress-detail">
                  <span>{levelInfo.currentXP.toLocaleString()} / {levelInfo.xpForNextLevel.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="test-xp-actions-panel" aria-labelledby="actions-title">
            <header className="test-xp-actions-header">
              <h2 id="actions-title" className="test-xp-section-title">Test Actions</h2>
              <p className="test-xp-section-desc">Click any button to trigger an XP reward and see the animated modal</p>
            </header>

            <div className="test-xp-actions-grid">
              <button
                onClick={handleLessonComplete}
                className="test-xp-action-btn lesson-btn"
                aria-label="Earn 50 XP for completing a lesson"
              >
                <div className="test-xp-btn-icon lesson-icon">
                  <Award size={20} aria-hidden="true" />
                </div>
                <div className="test-xp-btn-content">
                  <span className="test-xp-btn-label">Lesson Complete</span>
                  <span className="test-xp-btn-xp">+50 XP</span>
                </div>
                <span className="test-xp-btn-reason">lesson_complete</span>
              </button>

              <button
                onClick={handleModuleComplete}
                className="test-xp-action-btn module-btn"
                aria-label="Earn 200 XP for completing a module"
              >
                <div className="test-xp-btn-icon module-icon">
                  <Trophy size={20} aria-hidden="true" />
                </div>
                <div className="test-xp-btn-content">
                  <span className="test-xp-btn-label">Module Complete</span>
                  <span className="test-xp-btn-xp">+200 XP</span>
                </div>
                <span className="test-xp-btn-reason">module_complete</span>
              </button>

              <button
                onClick={handleStreakBonus}
                className="test-xp-action-btn streak-btn"
                aria-label="Earn 75 XP streak bonus"
              >
                <div className="test-xp-btn-icon streak-icon">
                  <Award size={20} aria-hidden="true" />
                </div>
                <div className="test-xp-btn-content">
                  <span className="test-xp-btn-label">Streak Bonus</span>
                  <span className="test-xp-btn-xp">+75 XP</span>
                </div>
                <span className="test-xp-btn-reason">streak_bonus</span>
              </button>

              <button
                onClick={handlePerfectScore}
                className="test-xp-action-btn perfect-btn"
                aria-label="Earn 100 XP for perfect score"
              >
                <div className="test-xp-btn-icon perfect-icon">
                  <Star size={20} aria-hidden="true" />
                </div>
                <div className="test-xp-btn-content">
                  <span className="test-xp-btn-label">Perfect Score</span>
                  <span className="test-xp-btn-xp">+100 XP</span>
                </div>
                <span className="test-xp-btn-reason">perfect_score</span>
              </button>

              <button
                onClick={handleTriggerLevelUpOnly}
                className="test-xp-action-btn levelup-only-btn"
                aria-label="Show Level Upgrade popup only"
                style={{ background: 'linear-gradient(135deg, #eff9f2 0%, #ffffff 100%)', borderColor: '#20a862' }}
              >
                <div className="test-xp-btn-icon" style={{ background: '#eff9f2', color: '#20a862' }}>
                  <Sparkles size={20} aria-hidden="true" />
                </div>
                <div className="test-xp-btn-content">
                  <span className="test-xp-btn-label">Level Upgrade Only</span>
                  <span className="test-xp-btn-xp" style={{ color: '#20a862' }}>Popup Preview</span>
                </div>
                <span className="test-xp-btn-reason">level_up_modal</span>
              </button>

              <button
                onClick={handleMassiveXP}
                className="test-xp-action-btn massive-btn"
                aria-label="Earn 1500 XP to trigger multiple level ups"
              >
                <div className="test-xp-btn-icon massive-icon">
                  <Zap size={20} aria-hidden="true" />
                </div>
                <div className="test-xp-btn-content">
                  <span className="test-xp-btn-label">Massive XP</span>
                  <span className="test-xp-btn-xp">+1500 XP</span>
                </div>
                <span className="test-xp-btn-reason">custom (multi-level)</span>
              </button>

              <button
                onClick={handleReset}
                className="test-xp-action-btn reset-btn"
                aria-label="Reset XP to zero"
              >
                <div className="test-xp-btn-icon reset-icon">
                  <X size={20} aria-hidden="true" />
                </div>
                <div className="test-xp-btn-content">
                  <span className="test-xp-btn-label">Reset XP</span>
                  <span className="test-xp-btn-xp">0 XP</span>
                </div>
                <span className="test-xp-btn-reason">debug</span>
              </button>
            </div>

            <div className="test-xp-queue-info">
              <h4>How it works:</h4>
              <ul>
                <li>Click <strong>Level Upgrade Only</strong> to preview the dedicated level upgrade window</li>
                <li>Click any action button to earn XP and trigger the reward modal</li>
                <li>Multiple rapid clicks queue rewards sequentially</li>
                <li>Level up triggers trophy animation + sound + confetti</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      <XPRewardModal
        isOpen={isModalOpen}
        onClose={closeRewardModal}
        rewardData={rewardData}
        onKeepLearning={() => console.log('Keep learning clicked')}
      />

      <LevelUpModal
        isOpen={isLevelUpModalOpen}
        onClose={() => setIsLevelUpModalOpen(false)}
        previousLevel={levelUpData.prevLevel}
        newLevel={levelUpData.newLevel}
        totalXP={levelUpData.totalXP}
        onKeepLearning={() => setIsLevelUpModalOpen(false)}
      />
    </section>
  );
}