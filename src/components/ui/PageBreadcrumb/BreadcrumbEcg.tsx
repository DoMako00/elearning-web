import { useEffect, useRef } from "react";

/* ─── Tuning constants ──────────────────────────────────────────────────────── */
const CYCLE_SAMPLES   = 512;   // resolution of one cardiac cycle lookup table
const SWEEP_PX_PER_S  = 140;   // CSS pixels the trace sweeps per second
const ERASER_W        = 24;    // CSS px of blank gap ahead of the write head
const CANVAS_H        = 30;    // CSS px canvas height
const BEEP_FREQ       = 880;   // Hz
const BEEP_DUR        = 0.06;  // s
const BEEP_GAIN       = 0.10;

/* ─── Gaussian helper ───────────────────────────────────────────────────────── */
const gauss = (t: number, mu: number, sig: number, amp: number): number =>
  amp * Math.exp(-0.5 * ((t - mu) / sig) ** 2);

/* ─── Pre-computed anatomical human cardiac cycle (P-Q-R-S-T) ─────────────────── */
// Positive deviation = upward deflection (toward canvas y = 0).
// Classic human Lead II electrocardiogram morphology:
//   P-wave  : gentle upward wave (+0.22)
//   Q-dip   : crisp sharp downward dip (-0.32)
//   R-peak  : tall dramatic upward spike (+1.00)
//   S-dip   : deep dramatic downward plunge (-0.55)
//   T-wave  : smooth rounded upward dome (+0.36)
const ECG_CYCLE: Float32Array = (() => {
  const buf = new Float32Array(CYCLE_SAMPLES);
  for (let i = 0; i < CYCLE_SAMPLES; i++) {
    const t = i / CYCLE_SAMPLES;
    buf[i] =
      gauss(t, 0.160, 0.026, 0.22)   // P-wave (up)
    - gauss(t, 0.292, 0.007, 0.32)   // Q-dip (crisp down)
    + gauss(t, 0.315, 0.009, 1.00)   // R-peak (tall spike up)
    - gauss(t, 0.338, 0.010, 0.55)   // S-dip (deep plunge down)
    + gauss(t, 0.525, 0.044, 0.36);  // T-wave (dome up)
  }
  return buf;
})();

const R_PEAK_IDX: number = ECG_CYCLE.reduce(
  (best, v, i, arr) => (v > arr[best] ? i : best),
  0
);

/* ─── Web Audio beep synthesiser ────────────────────────────────────────────── */
function playBeep(ctx: AudioContext): void {
  try {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = BEEP_FREQ;
    env.gain.setValueAtTime(BEEP_GAIN, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + BEEP_DUR);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + BEEP_DUR);
  } catch {
    /* ignore if context is suspended */
  }
}

/* ─── Props ─────────────────────────────────────────────────────────────────── */
export interface BreadcrumbEcgProps {
  bpm?: number;       // heart rate — default 72
  audio?: boolean;    // enable beep on R-peak — default false
  className?: string;
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
export function BreadcrumbEcg({
  bpm = 72,
  audio = false,
  className,
}: BreadcrumbEcgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const propsRef = useRef({ bpm, audio });
  useEffect(() => {
    propsRef.current = { bpm, audio };
  }, [bpm, audio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let totalTime = 0;
    let lastTs = -1;
    let writeX = 0;

    let W = 0;
    const H = CANVAS_H;

    let audioCtx: AudioContext | null = null;
    let prevCycleIdx = -1;

    const unlockAudio = () => {
      if (!propsRef.current.audio || audioCtx) return;
      audioCtx = new AudioContext();
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown",     unlockAudio, { once: true });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      W = Math.max(Math.floor(rect.width), 80);
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = `${W}px`;
      canvas.style.height = `${H}px`;
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    const draw = (ts: number) => {
      const dt = lastTs < 0 ? 0 : Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      totalTime += dt;

      animId = requestAnimationFrame(draw);
      if (W === 0) return;

      const { bpm: currentBpm } = propsRef.current;
      const beatPeriod = 60 / currentBpm;
      const baseline   = H * 0.52;
      const amplitude  = H * 0.42;

      writeX = (writeX + SWEEP_PX_PER_S * dt) % W;
      const wxi = Math.floor(writeX);

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const traceColor = getComputedStyle(canvas).color;

      ctx.clearRect(0, 0, W, H);

      // Baseline subtle dashed guide
      ctx.save();
      ctx.strokeStyle = traceColor;
      ctx.globalAlpha = 0.12;
      ctx.lineWidth   = 0.6;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(0, baseline);
      ctx.lineTo(W, baseline);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Oscilloscope sweeping line
      ctx.save();
      ctx.strokeStyle = traceColor;
      ctx.lineWidth   = 1.7;
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";
      ctx.shadowColor = traceColor;
      ctx.shadowBlur  = 6;

      let pathOpen = false;
      let needMove = true;

      const closeSegment = () => {
        if (pathOpen) { ctx.stroke(); pathOpen = false; }
        needMove = true;
      };

      for (let x = 0; x < W; x++) {
        const aheadDist = ((x - wxi + W) % W);
        if (aheadDist > 0 && aheadDist < ERASER_W) { closeSegment(); continue; }

        const secondsAgo = ((wxi - x + W) % W) / SWEEP_PX_PER_S;
        const timeAtX    = totalTime - secondsAgo;
        if (timeAtX < 0) { closeSegment(); continue; }

        const phase = (timeAtX / beatPeriod) % 1;
        const ci    = Math.min(Math.floor(phase * CYCLE_SAMPLES), CYCLE_SAMPLES - 1);
        const y     = baseline - ECG_CYCLE[ci] * amplitude;

        if (x === wxi && audioCtx && propsRef.current.audio) {
          if (prevCycleIdx !== -1 && prevCycleIdx < R_PEAK_IDX && ci >= R_PEAK_IDX) {
            playBeep(audioCtx);
          }
          prevCycleIdx = ci;
        }

        if (needMove) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          pathOpen = true;
          needMove = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      closeSegment();
      ctx.restore();

      // Glowing dot at write head
      const headPhase = (totalTime / beatPeriod) % 1;
      const headCi    = Math.min(Math.floor(headPhase * CYCLE_SAMPLES), CYCLE_SAMPLES - 1);
      const headY     = baseline - ECG_CYCLE[headCi] * amplitude;

      ctx.save();
      ctx.shadowColor = traceColor;
      ctx.shadowBlur  = 14;
      ctx.fillStyle   = traceColor;
      ctx.beginPath();
      ctx.arc(writeX, headY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown",     unlockAudio);
      audioCtx?.close();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`page-breadcrumb__pulse-canvas${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    />
  );
}
