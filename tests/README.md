# IronLog regression checks

Install development dependencies with `npm install`, then `npx playwright install --with-deps webkit`, then `npm test`. The default suite uses WebKit at a 390 × 844 touch/mobile viewport. Set `TEST_CHROMIUM=1` to also run Chromium when installed.

Tests exercise V1 migration, unchanged V1 storage, V2 sessions, the A/B/C dashboard and completion dates, next-workout launch, independent Home/Gym progression, location locking, safe cancellation, timer expiry/add/stop/refresh, test audio initialization, workout completion/Home navigation, import recovery, history beyond 120 sessions, failed writes and corrupt-storage protection. Coaching scenarios include uneven reps, total-rep improvement, RIR, bad days, repeated severe misses and large isolation jumps. Tests use synthetic state in an isolated origin, never real workout data.

WebKit automation verifies browser behavior, not physical iPhone speaker output, iOS mute/power settings, or background/locked-screen playback. The app explicitly communicates those limits.

# Coaching audit

The existing A/B/C exercise selection and set counts are unchanged. Every prescribed exercise uses dumbbells, a flat/incline bench, or an ab wheel. Compound ranges favor strength plus hypertrophy; isolation ranges permit more reps, particularly with coarse Home increments. The original program contains 19–21 working sets; warm-ups, unilateral work and appropriate rests can push sessions past 60 minutes, so the dashboard no longer guarantees a duration.

Progression is a conservative programming heuristic, not a validated strength prediction. Exact 1–2-rep increments, 20% substantial-miss threshold, repeated-exposure checks and 25% isolation-jump guard are engineering/coaching choices. They should not be interpreted as experimentally established cutoffs. RIR is subjective; count clean reps with consistent technique and rest.

Evidence informing the approach:
- (2024) *Similar muscle hypertrophy following eight weeks of resistance training to momentary muscular failure or with repetitions-in-reserve in resistance-trained individuals*: https://pubmed.ncbi.nlm.nih.gov/38393985/
- Load/hypertrophy systematic review and network meta-analysis: https://pubmed.ncbi.nlm.nih.gov/33433148/
- Volume-matched load systematic review/meta-analysis: https://pubmed.ncbi.nlm.nih.gov/35015560/

These support training close to failure without requiring failure and allowing a broad range of loads/repetitions for hypertrophy. They do not validate this app's exact algorithm or guarantee individual results.
