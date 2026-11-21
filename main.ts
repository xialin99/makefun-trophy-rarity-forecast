import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type Trophy = { id: number; description: string; tier: string; secret: boolean };
type Read = { at: string; players_tracked: number; rates: (number | null)[] };
export type ForecastCase = {
  at: string; target: string; horizon_minutes: number; levels: number[];
  game: { release_date: string }; trophies: Trophy[]; history: Read[];
};

export const levels = [0.05, 0.25, 0.5, 0.75, 0.95];
export const z = [-1.645, -0.674, 0, 0.674, 1.645];
const hour = 3_600_000;
const bound = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
export const logit = (x: number) => {
  const p = bound(x, 0.01, 99.99);
  return Math.log(p / (100 - p));
};
export const percent = (x: number) => Math.round(1e6 / (1 + Math.exp(-x))) / 1e4;

function median(xs: number[]) {
  const sorted = [...xs].sort((a, b) => a - b);
  return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2;
}

// Deterministic quadrature for a mixture of possible page states, in logit units.
function quantiles(scenarios: { center: number; spread: number; weight: number }[]) {
  const samples = scenarios.flatMap(({ center, spread, weight }) =>
    Array.from({ length: 41 }, (_, i) => {
      const p = (i + 0.5) / 41;
      return { value: center + spread * Math.log(p / (1 - p)) / 1.7, mass: weight / 41 };
    }));
  samples.sort((a, b) => a.value - b.value);
  return levels.map(level => {
    let cumulative = 0;
    const sample = samples.find(({ mass }) => (cumulative += mass) >= level);
    return percent(sample?.value ?? samples.at(-1)!.value);
  });
}

function progression(trophy: Trophy) {
  const description = trophy.description.toLowerCase();
  if (/complete gone fishing\./.test(description)) return 'starter';
  if (trophy.tier === 'platinum' || /100% completion|\ball\b|\bevery\b|\b250 stunts\b/.test(description)) return 'completion';
  if (/complete chapter|complete the final mission\.$/.test(description)) return 'story';
  return 'activity';
}

export function forecast(c: ForecastCase) {
  const reads = c.history.filter((read, index) => {
    if (!index) return true;
    const previous = c.history[index - 1];
    return read.players_tracked !== previous.players_tracked ||
      read.rates.some((rate, i) => rate !== previous.rates[i]);
  });
  const first = reads[0];
  const last = reads.at(-1)!;
  const hours = c.horizon_minutes / 60;
  const launch = Date.parse(c.game.release_date);
  const age = (read: Read) => Math.max(0, (Date.parse(read.at) - launch) / hour);
  const clock = (h: number) => Math.log1p(h / 12);
  const staleHours = Math.max(0, (Date.parse(c.at) - Date.parse(last.at)) / hour);
  const intervals = reads.slice(1).map((r, i) => (Date.parse(r.at) - Date.parse(reads[i].at)) / hour);
  const cadence = intervals.length ? bound(median(intervals.slice(-12)), 1 / 6, 18) : 4;
  const ahead = Math.max(0, hours + staleHours - cadence / 2);
  const growthClock = clock(age(last) + ahead) - clock(age(last));

  const trophies = c.trophies.map((trophy, i) => {
    const known = reads.filter(r => r.rates[i] != null);
    const anchor = known.at(-1) ?? last;
    const rate = anchor.rates[i] ?? 0;
    const kind = progression(trophy);
    const raw = logit(rate);
    if (kind === 'starter' && known.every(r => r.rates[i]! >= 99.99) && rate >= 99.99) {
      return { id: trophy.id, q: [99.8, 99.99, 100, 100, 100] };
    }

    const prior = { starter: 0.1, completion: 0.48, story: 1.55, activity: 0.95 }[kind];
    const slopes: number[] = [];
    const recent = known.filter(r => age(anchor) - age(r) <= 30 &&
      (age(r) >= 12 || r.players_tracked >= 1.45 * first.players_tracked)).slice(-14);
    for (const [j, earlier] of recent.entries()) {
      for (const later of recent.slice(j + 1)) {
        const dx = clock(age(later)) - clock(age(earlier));
        if (dx < 0.075) continue;
        slopes.push((logit(later.rates[i]!) - logit(earlier.rates[i]!)) / dx);
      }
    }
    const slope = slopes.length ? bound(median(slopes), -1.25, 4) : prior;
    const span = recent.length > 1 ? age(recent.at(-1)!) - age(recent[0]) : 0;
    const weight = Math.min(0.92, span / (span + 5)) * Math.min(1, slopes.length / 3);
    const rateSlope = prior * (1 - weight) + slope * weight;
    const count = Math.max(1, rate * anchor.players_tracked / 100);
    const spread = Math.hypot(0.28 / Math.sqrt(count), 0.48 * Math.sqrt(hours / 24), 0.35 * growthClock);
    const refreshProbability = hours === 0 ? 0 :
      1 - Math.exp(-(hours / cadence) * (1 + Math.min(3, staleHours / cadence)));
    const launchCohort = age(anchor) < 7 && anchor.players_tracked < 1.45 * first.players_tracked;
    const center = raw + rateSlope * growthClock;
    const unchanged = { center: raw, spread: 0, weight: 1 - refreshProbability };
    if (launchCohort) {
      // Fast denominator growth can precede any new earners for demanding trophies.
      const dilution = Math.log1p(Math.min(5, 0.85 * (ahead + 1)));
      const susceptibility = { starter: 0.1, story: 0.8, activity: 0.92, completion: 1 }[kind];
      return { id: trophy.id, q: quantiles([
        unchanged,
        { center: center - dilution * susceptibility, spread: Math.hypot(spread, 0.34), weight: refreshProbability },
      ]) };
    }
    const stable = span >= 8 && Math.abs(slope) < 0.12;
    const delayedGrowth = stable && hours >= 12 ? (age(anchor) < 24 ? 0.35 : 0.15) : 0;
    const stableCenter = stable ? raw + slope * growthClock : center;
    // Use observed slope dispersion for the stable regime. The separate
    // delayed-growth component already carries the full extrapolation spread.
    const stableSpread = stable
      ? Math.hypot(0.15, 0.28 / Math.sqrt(count),
        median(slopes.map(s => Math.abs(s - slope))) * growthClock)
      : spread;
    return { id: trophy.id, q: quantiles([
      unchanged,
      { center: stableCenter, spread: stableSpread, weight: refreshProbability * (1 - delayedGrowth) },
      { center: raw + prior * growthClock, spread, weight: refreshProbability * delayedGrowth },
    ]) };
  });
  return { trophies };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const input = process.env.MAKEFUN_INPUT_DIR ?? '/input';
  const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(output, { recursive: true });
  for (const file of readdirSync(input).filter(file => file.endsWith('.in')).sort()) {
    const c = JSON.parse(readFileSync(join(input, file), 'utf8')) as ForecastCase;
    writeFileSync(join(output, file.replace(/\.in$/, '.out')), JSON.stringify(forecast(c)) + '\n');
  }
}
