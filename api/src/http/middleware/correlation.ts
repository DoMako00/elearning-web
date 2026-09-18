const safeCorrelationPattern = /^[A-Za-z0-9._:-]+$/;
export function createCorrelationId(incoming?: string): string { const candidate = incoming?.trim().slice(0, 96); if (candidate && safeCorrelationPattern.test(candidate)) return candidate; return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
