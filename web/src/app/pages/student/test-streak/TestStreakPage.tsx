import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Flame, ShieldAlert, RotateCcw, Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { StreakAnalytics, StreakMilestoneModal } from '../../../../components/ui/StreakAnalytics';
import { 
  getStreakAnalyticsData, 
  DailyActivityLog,
  StreakMilestone,
  DEFAULT_STREAK_CONFIG 
} from '../../../../shared/utils/streakEngine';
import './TestStreakPage.css';

// Initial baseline mock data
function generateInitialLogs(): DailyActivityLog[] {
  const logs: DailyActivityLog[] = [];
  const today = new Date();
  
  // Create 180 days of realistic history
  for (let i = 0; i < 180; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Recent 14-day streak with 1 freeze pass day
    if (i === 0) {
      logs.push({ date: dateStr, minutes: 25, lessonCompleted: true }); // Today: Active
    } else if (i === 3) {
      logs.push({ date: dateStr, minutes: 0 }); // Day 3 ago: Missed -> Freeze pass used
    } else if (i <= 14) {
      logs.push({ date: dateStr, minutes: Math.floor(15 + Math.random() * 45), lessonCompleted: Math.random() > 0.4 });
    } else if (i > 14 && i < 20) {
      logs.push({ date: dateStr, minutes: 0 }); // Break
    } else if (Math.random() > 0.45) {
      logs.push({ date: dateStr, minutes: Math.floor(10 + Math.random() * 50) });
    }
  }

  return logs;
}

export function TestStreakPage() {
  const [logs, setLogs] = useState<DailyActivityLog[]>(generateInitialLogs);
  const [freezePasses, setFreezePasses] = useState(3);
  const [activeTodayMinutes, setActiveTodayMinutes] = useState(25);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Streak milestone popup modal state
  const [activeMilestoneModal, setActiveMilestoneModal] = useState<StreakMilestone | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const previousStreakRef = useRef<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Update today's activity log when activeTodayMinutes changes
  const currentLogs = useMemo(() => {
    const updated = logs.filter(l => l.date !== todayStr);
    if (activeTodayMinutes > 0) {
      updated.push({
        date: todayStr,
        minutes: activeTodayMinutes,
        lessonCompleted: activeTodayMinutes >= 15,
        quizCompleted: activeTodayMinutes >= 30,
      });
    }
    return updated;
  }, [logs, activeTodayMinutes, todayStr]);

  const analyticsData = useMemo(() => {
    return getStreakAnalyticsData(currentLogs, {
      streakFreezePasses: freezePasses,
      minDailyActivityMinutes: DEFAULT_STREAK_CONFIG.minDailyActivityMinutes,
    });
  }, [currentLogs, freezePasses]);

  // Automatically trigger streak level-up popup if a new milestone threshold is crossed
  useEffect(() => {
    const current = analyticsData.streak.currentStreak;
    const prev = previousStreakRef.current;

    if (prev > 0 && current > prev) {
      const newlyUnlocked = analyticsData.milestones.find(
        m => current >= m.milestone.requiredDays && prev < m.milestone.requiredDays
      );
      if (newlyUnlocked) {
        setActiveMilestoneModal(newlyUnlocked.milestone);
        setIsMilestoneModalOpen(true);
      }
    }
    previousStreakRef.current = current;
  }, [analyticsData.streak.currentStreak, analyticsData.milestones]);

  const handleTriggerMilestonePopup = (milestoneId: string) => {
    const target = analyticsData.milestones.find(m => m.milestone.id === milestoneId)?.milestone;
    if (target) {
      setActiveMilestoneModal(target);
      setIsMilestoneModalOpen(true);
    }
  };

  // Actions for interactive simulation
  const handleAddTodayMinutes = (mins: number) => {
    setActiveTodayMinutes(prev => prev + mins);
    showToast(`Added +${mins} minutes to today's activity!`);
  };

  const handleSimulateMissToday = () => {
    setActiveTodayMinutes(0);
    showToast("Set today's activity to 0 minutes.");
  };

  const handleSimulateYesterdayMiss = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];

    setLogs(prev => prev.map(l => l.date === yStr ? { ...l, minutes: 0, lessonCompleted: false, quizCompleted: false } : l));
    showToast("Simulated missed activity for yesterday (tests freeze mechanics)!");
  };

  const handleIncrementStreak = () => {
    // Add one consecutive active day immediately preceding the earliest current streak day
    setLogs(prev => {
      // Scan backward to find next day to fill
      let targetDate = todayStr;
      let d = new Date();
      for (let i = 0; i < 365; i++) {
        const curDateStr = d.toISOString().split('T')[0];
        const log = prev.find(l => l.date === curDateStr);
        if (!log || log.minutes < 5) {
          targetDate = curDateStr;
          break;
        }
        d.setDate(d.getDate() - 1);
      }

      const existingIndex = prev.findIndex(l => l.date === targetDate);
      if (existingIndex >= 0) {
        return prev.map((l, i) => i === existingIndex ? { ...l, minutes: 30, lessonCompleted: true } : l);
      } else {
        return [{ date: targetDate, minutes: 30, lessonCompleted: true }, ...prev];
      }
    });

    setActiveTodayMinutes(prev => (prev < 5 ? 30 : prev));
    showToast("🔥 Incremented streak by +1 day!");
  };

  const handleSetStreakDays = (targetDays: number) => {
    const newLogs: DailyActivityLog[] = [];
    const now = new Date();
    for (let i = 0; i < targetDays; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      newLogs.push({
        date: d.toISOString().split('T')[0],
        minutes: 30,
        lessonCompleted: true,
      });
    }
    setLogs(newLogs);
    setActiveTodayMinutes(30);
    showToast(`Loaded ${targetDays}-day streak scenario!`);
  };

  const handleReset = () => {
    setLogs(generateInitialLogs());
    setFreezePasses(3);
    setActiveTodayMinutes(25);
    showToast("Reset simulation to default state.");
  };

  return (
    <div className="test-streak-page">
      <header className="test-streak-header">
        <div className="test-streak-header-top">
          <Link to="/" className="test-streak-back">
            <ChevronLeft size={18} /> Back to Dashboard
          </Link>
          {toastMessage && (
            <div className="test-streak-toast">
              <CheckCircle2 size={16} /> {toastMessage}
            </div>
          )}
        </div>
        <div className="test-streak-title-row">
          <div>
            <h1 className="test-streak-title">🔥 Streak Engine & Analytics Test Playground</h1>
            <p className="test-streak-subtitle">
              Simulate daily activity, streak increments, missed days, freeze passes, and milestone badge unlocks.
            </p>
          </div>
        </div>
      </header>

      {/* Interactive Control Console */}
      <section className="test-streak-controls" aria-label="Interactive Controls">
        <h2 className="test-streak-controls-title">🎮 Simulator Controls</h2>
        
        <div className="test-streak-controls-grid">
          {/* Daily Activity Simulator */}
          <div className="test-control-card">
            <h3 className="test-control-heading">Today's Learning Activity</h3>
            <p className="test-control-desc">Active threshold is ≥ 5 mins or 1 quiz/lesson completed.</p>
            <div className="test-control-status">
              Current Today: <strong>{activeTodayMinutes} mins</strong> ({activeTodayMinutes >= 5 ? '✅ Active' : '❌ Inactive'})
            </div>
            <div className="test-control-actions">
              <button 
                className="test-btn test-btn-primary" 
                onClick={handleIncrementStreak}
                style={{ background: 'linear-gradient(135deg, #20a862 0%, #16a34a 100%)', width: '100%', justifyContent: 'center' }}
              >
                <Flame size={14} /> Increase Streak (+1 Day)
              </button>
              <button className="test-btn test-btn-primary" onClick={() => handleAddTodayMinutes(15)}>
                <Plus size={14} /> +15 Mins
              </button>
              <button className="test-btn test-btn-primary" onClick={() => handleAddTodayMinutes(30)}>
                <Plus size={14} /> +30 Mins (Quiz)
              </button>
              <button className="test-btn test-btn-outline" onClick={handleSimulateMissToday}>
                Miss Today (0 mins)
              </button>
            </div>
          </div>

          {/* Quick Scenario Jumps */}
          <div className="test-control-card">
            <h3 className="test-control-heading">Milestone Quick Jumps</h3>
            <p className="test-control-desc">Test milestone badge unlock states & popups instantly.</p>
            <div className="test-control-actions">
              <button className="test-btn test-btn-scenario" onClick={() => handleSetStreakDays(5)}>
                5 Days (Nearly Rookie)
              </button>
              <button className="test-btn test-btn-scenario" onClick={() => handleSetStreakDays(7)}>
                🥉 7 Days (Unlock Rookie)
              </button>
              <button className="test-btn test-btn-scenario" onClick={() => handleSetStreakDays(30)}>
                🥈 30 Days (Unlock Scholar)
              </button>
              <button className="test-btn test-btn-scenario" onClick={() => handleSetStreakDays(100)}>
                🥇 100 Days (Master Learner)
              </button>
              <button 
                className="test-btn test-btn-scenario" 
                onClick={() => handleTriggerMilestonePopup('rookie')}
                style={{ background: '#eff9f2', borderColor: '#20a862', color: '#20a862', width: '100%', justifyContent: 'center' }}
              >
                <Sparkles size={14} /> Preview Milestone Unlock Popup
              </button>
            </div>
          </div>

          {/* Freeze Pass & Missed Day Mechanics */}
          <div className="test-control-card">
            <h3 className="test-control-heading">Grace Freeze Pass Mechanics</h3>
            <p className="test-control-desc">When yesterday is missed, 1 freeze pass is consumed to preserve streak.</p>
            <div className="test-control-status">
              Available Passes: <strong>{freezePasses}</strong>
            </div>
            <div className="test-control-actions">
              <button className="test-btn test-btn-warning" onClick={handleSimulateYesterdayMiss}>
                <ShieldAlert size={14} /> Miss Yesterday
              </button>
              <button className="test-btn test-btn-outline" onClick={() => setFreezePasses(p => Math.max(0, p - 1))}>
                -1 Freeze Pass
              </button>
              <button className="test-btn test-btn-outline" onClick={() => setFreezePasses(p => p + 1)}>
                +1 Freeze Pass
              </button>
              <button className="test-btn test-btn-reset" onClick={handleReset}>
                <RotateCcw size={14} /> Reset All
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Streak Analytics Dashboard */}
      <main className="test-streak-dashboard">
        <StreakAnalytics data={analyticsData} />
      </main>

      {/* Streak Milestone / Level Up Modal */}
      <StreakMilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestone={activeMilestoneModal}
        currentStreak={analyticsData.streak.currentStreak}
        bonusFreezePasses={1}
        onContinue={() => setIsMilestoneModalOpen(false)}
      />
    </div>
  );
}
