import { useInactivityPrompt, InactivityModal } from '../../../../components/ui/InactivityPrompt';
import { Clock, AlertCircle, PlayCircle, X, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './TestInactivityPromptPage.css';

export function TestInactivityPromptPage() {
  const {
    state,
    countdown,
    openModal,
    closeModal,
    handleResume,
    triggerIdleTimeout,
  } = useInactivityPrompt({
    initialCountdown: 10,
    onTimeout: () => {
      console.log('⏰ Session paused - timeout reached');
    },
    onResume: () => {
      console.log('▶️ Resumed - user clicked "I\'m still here"');
    },
  });

  return (
    <section className="test-inactivity-page" aria-labelledby="test-inactivity-title">
      <header className="test-inactivity-header">
        <Link to="/my-courses/human-anatomy-i/lessons/human-anatomy-i-lesson-1" className="test-inactivity-back">
          <ChevronLeft size={20} aria-hidden="true" /> Back to Lesson
        </Link>
        <div className="test-inactivity-header-content">
          <h1 id="test-inactivity-title" className="test-inactivity-title">Inactivity Prompt Test</h1>
          <p className="test-inactivity-subtitle">Test the inactivity warning modal with Web Worker integration</p>
        </div>
      </header>

      <main className="test-inactivity-main">
        <div className="test-inactivity-grid">
          <aside className="test-inactivity-status-panel" aria-label="Inactivity Status">
            <div className="test-inactivity-status-card">
              <div className={`test-inactivity-status-indicator ${state}`}>
                <span className="test-inactivity-status-dot" aria-hidden="true"></span>
              </div>
              <div className="test-inactivity-status-content">
                <span className="test-inactivity-status-label">Current State</span>
                <span className="test-inactivity-status-value state-value">
                  {state === 'hidden' ? 'Active' : state === 'countdown' ? 'Warning' : 'Paused'}
                </span>
              </div>
            </div>

            <div className="test-inactivity-countdown-card" aria-live="polite" aria-atomic="true">
              <div className="test-inactivity-countdown-icon">
                <Clock size={28} aria-hidden="true" />
              </div>
              <div className="test-inactivity-countdown-content">
                <span className="test-inactivity-countdown-label">Countdown</span>
                <span className="test-inactivity-countdown-value">{countdown}s</span>
              </div>
              <div className="test-inactivity-mini-progress" role="progressbar" aria-valuenow={state === 'countdown' ? Math.round((countdown / 10) * 100) : state === 'paused' ? 0 : 100} aria-valuemin={0} aria-valuemax={100}>
                <div className="test-inactivity-mini-progress-fill" style={{ width: state === 'countdown' ? `${(countdown / 10) * 100}%` : state === 'paused' ? '0%' : '100%' }} />
              </div>
            </div>

            <div className="test-inactivity-info-card">
              <h4 className="test-inactivity-info-title">How it works</h4>
              <ul className="test-inactivity-info-list">
                <li><strong>Idle detection:</strong> Worker monitors mouse, keyboard, touch, scroll, and tab visibility</li>
                <li><strong>Idle threshold:</strong> 5 minutes of no activity triggers the warning</li>
                <li><strong>Countdown:</strong> 60-second visual countdown with sound</li>
                <li><strong>"I'm still here":</strong> Resumes tracking, closes modal</li>
                <li><strong>Timeout (0s):</strong> Freezes tracking, marks session paused</li>
              </ul>
            </div>
          </aside>

          <section className="test-inactivity-actions-panel" aria-labelledby="actions-title">
            <header className="test-inactivity-actions-header">
              <h2 id="actions-title" className="test-inactivity-section-title">Test Controls</h2>
              <p className="test-inactivity-section-desc">Trigger the inactivity warning manually or simulate worker events</p>
            </header>

            <div className="test-inactivity-actions-grid">
              <button
                onClick={triggerIdleTimeout}
                className="test-inactivity-trigger-btn worker-btn"
                aria-label="Simulate worker idle timeout event"
              >
                <div className="test-inactivity-btn-icon worker-icon">
                  <AlertCircle size={22} aria-hidden="true" />
                </div>
                <div className="test-inactivity-btn-content">
                  <span className="test-inactivity-btn-label">Simulate Worker Timeout</span>
                  <span className="test-inactivity-btn-desc">Triggers IDLE_TIMEOUT_TRIGGERED directly</span>
                </div>
              </button>

              <button
                onClick={openModal}
                disabled={state !== 'hidden'}
                className="test-inactivity-trigger-btn manual-btn"
                aria-label="Manually open inactivity modal"
              >
                <div className="test-inactivity-btn-icon manual-icon">
                  <AlertCircle size={22} aria-hidden="true" />
                </div>
                <div className="test-inactivity-btn-content">
                  <span className="test-inactivity-btn-label">Open Modal Manually</span>
                  <span className="test-inactivity-btn-desc">Opens 10s countdown modal directly</span>
                </div>
              </button>

              <button
                onClick={triggerIdleTimeout}
                className="test-inactivity-trigger-btn video-btn"
                aria-label="Simulate video paused idle timeout"
              >
                <div className="test-inactivity-btn-icon video-icon">
                  <PlayCircle size={22} aria-hidden="true" />
                </div>
                <div className="test-inactivity-btn-content">
                  <span className="test-inactivity-btn-label">Simulate Video Pause</span>
                  <span className="test-inactivity-btn-desc">Video paused + idle timeout</span>
                </div>
              </button>

              <button
                onClick={triggerIdleTimeout}
                className="test-inactivity-trigger-btn tab-btn"
                aria-label="Simulate tab hidden idle timeout"
              >
                <div className="test-inactivity-btn-icon tab-icon">
                  <X size={22} aria-hidden="true" />
                </div>
                <div className="test-inactivity-btn-content">
                  <span className="test-inactivity-btn-label">Simulate Tab Hidden</span>
                  <span className="test-inactivity-btn-desc">User switched tabs + idle timeout</span>
                </div>
              </button>
            </div>

            <div className="test-inactivity-status-display">
              <h4>Current State Details</h4>
              <dl className="test-inactivity-details">
                <div><dt>Modal State</dt><dd><code>{state}</code></dd></div>
                <div><dt>Countdown</dt><dd><code>{countdown}s</code></dd></div>
                <div><dt>Modal Open</dt><dd><code>{state === 'countdown' ? 'Yes' : 'No'}</code></dd></div>
              </dl>
            </div>

            <div className="test-inactivity-dev-note">
              <h4>Developer Notes</h4>
              <ul>
                <li>Open DevTools Console to see <code>console.log</code> outputs for timeout/resume events</li>
                <li>Buttons above call <code>triggerIdleTimeout()</code> directly (bypasses worker for testing)</li>
                <li>The worker runs automatically and monitors: mouse, keyboard, touch, scroll, visibility</li>
                <li>Default idle threshold is 5 minutes (300,000ms) - reduced to 10s for this test</li>
                <li>Press <kbd>Esc</kbd> to dismiss modal, <kbd>Enter</kbd> or <kbd>Space</kbd> to resume</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      <InactivityModal
        isOpen={state === 'countdown'}
        onClose={closeModal}
        onResume={handleResume}
        countdown={countdown}
        totalCountdown={10}
      />
    </section>
  );
}