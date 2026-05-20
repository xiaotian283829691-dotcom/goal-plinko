import { useMatchStore } from '../store/matchStore';
import {
  FOOTBALL_API_TOKEN,
  FOOTBALL_API_BASE,
  FOOTBALL_COMPETITION,
  WC_START_DATE,
} from '../config/football';

let pollTimer: number | null = null;

// ─── API Types ───────────────────────────────────────────

interface ApiGoal {
  minute: number;
  type: string;
  team: { id: number; name: string };
  scorer: { name: string };
}

interface ApiBooking {
  minute: number;
  card: 'YELLOW' | 'YELLOW_RED' | 'RED';
  player: { name: string };
  team: { id: number; name: string };
}

interface ApiMatch {
  id: number;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  utcDate: string;
  minute: number;
  homeTeam: { id: number; name: string; crest: string };
  awayTeam: { id: number; name: string; crest: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  goals?: ApiGoal[];
  bookings?: ApiBooking[];
}

// ─── Fetch helpers ───────────────────────────────────────

async function fetchApi<T>(endpoint: string): Promise<T | null> {
  if (!FOOTBALL_API_TOKEN) return null;
  try {
    const res = await fetch(`${FOOTBALL_API_BASE}${endpoint}`, {
      headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchLiveMatches(): Promise<ApiMatch[]> {
  const data = await fetchApi<{ matches: ApiMatch[] }>(
    `/competitions/${FOOTBALL_COMPETITION}/matches?status=LIVE`,
  );
  return data?.matches ?? [];
}

export async function fetchTodayMatches(): Promise<ApiMatch[]> {
  const today = todayStr();
  const data = await fetchApi<{ matches: ApiMatch[] }>(
    `/competitions/${FOOTBALL_COMPETITION}/matches?status=SCHEDULED,TIMED,IN_PLAY,PAUSED,FINISHED&dateFrom=${today}&dateTo=${today}`,
  );
  return data?.matches ?? [];
}

export async function fetchMatchDetail(matchId: number): Promise<ApiMatch | null> {
  return fetchApi<ApiMatch>(`/matches/${matchId}`);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Event processing ────────────────────────────────────

function processMatchEvents(match: ApiMatch) {
  const store = useMatchStore.getState();
  const prev = store.trackedMatch;

  if (!prev || prev.id !== match.id) {
    store.setTrackedMatch({
      id: match.id,
      status: match.status,
      minute: match.minute,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.score.fullTime.home ?? 0,
      awayScore: match.score.fullTime.away ?? 0,
      goalCount: match.goals?.length ?? 0,
      redCardCount: match.bookings?.filter((b) => b.card === 'RED').length ?? 0,
    });
    return;
  }

  const newGoals = (match.goals?.length ?? 0) - prev.goalCount;
  const newRedCards = (match.bookings?.filter((b) => b.card === 'RED').length ?? 0) - prev.redCardCount;

  if (newGoals > 0) {
    for (let i = 0; i < newGoals; i++) {
      store.triggerGoalRush();
    }
  }

  if (newRedCards > 0) {
    store.triggerRedCard();
  }

  store.setTrackedMatch({
    ...prev,
    status: match.status,
    minute: match.minute,
    homeScore: match.score.fullTime.home ?? 0,
    awayScore: match.score.fullTime.away ?? 0,
    goalCount: match.goals?.length ?? 0,
    redCardCount: match.bookings?.filter((b) => b.card === 'RED').length ?? 0,
  });
}

// ─── Polling: real API ───────────────────────────────────

/**
 * Start polling real football-data.org API.
 *
 * Strategy per cycle:
 *  1. Try live WC matches first
 *  2. If none live, try today's scheduled/finished matches (show in ticker)
 *  3. If nothing today either, fall back to mock
 *
 * Returns true if real match data was found on the first attempt,
 * false if it fell back to mock immediately.
 */
export async function startMatchPolling(matchId?: number): Promise<boolean> {
  stopMatchPolling();

  // First attempt: check if we can get real data
  const foundReal = await pollOnce(matchId);

  if (!foundReal) {
    // No real data available right now -- start mock as fallback
    startMockMatchPolling();
    return false;
  }

  // Real data found, set up recurring poll (60s interval)
  pollTimer = window.setInterval(async () => {
    const ok = await pollOnce(matchId);
    if (!ok) {
      // Matches ended or no longer available -- switch to mock
      stopMatchPolling();
      startMockMatchPolling();
    }
  }, 60_000);

  return true;
}

async function pollOnce(matchId?: number): Promise<boolean> {
  try {
    if (matchId) {
      const match = await fetchMatchDetail(matchId);
      if (match) {
        processMatchEvents(match);
        return true;
      }
      return false;
    }

    // 1) Try live matches
    const live = await fetchLiveMatches();
    if (live.length > 0) {
      processMatchEvents(live[0]);
      return true;
    }

    // 2) Try today's matches (scheduled, finished, etc.)
    const today = await fetchTodayMatches();
    if (today.length > 0) {
      // Prefer IN_PLAY/PAUSED, then SCHEDULED/TIMED, then FINISHED
      const sorted = [...today].sort((a, b) => {
        const priority: Record<string, number> = {
          IN_PLAY: 0,
          PAUSED: 1,
          TIMED: 2,
          SCHEDULED: 3,
          FINISHED: 4,
        };
        return (priority[a.status] ?? 5) - (priority[b.status] ?? 5);
      });
      processMatchEvents(sorted[0]);
      return true;
    }

    // 3) Nothing found
    return false;
  } catch {
    return false;
  }
}

// ─── Polling: stop ───────────────────────────────────────

export function stopMatchPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// ─── Smart initializer (called from App.tsx) ─────────────

/**
 * Initialize match data with the right strategy:
 *  - Before WC start date (June 11 2026): always mock
 *  - After WC start date: try real API first, mock fallback
 *  - No token configured: always mock
 */
export async function initMatchData(): Promise<void> {
  const now = new Date();
  const wcHasStarted = now >= WC_START_DATE;
  const hasToken = Boolean(FOOTBALL_API_TOKEN);

  if (!wcHasStarted || !hasToken) {
    console.log(
      `[Football] Using mock mode (WC started: ${wcHasStarted}, token: ${hasToken})`,
    );
    startMockMatchPolling();
    return;
  }

  console.log('[Football] WC is live, trying real API...');
  const foundReal = await startMatchPolling();
  if (foundReal) {
    console.log('[Football] Real match data active.');
  } else {
    console.log('[Football] No live/today matches, fell back to mock.');
  }
}

// ─── Mock data for development (before WC 2026 starts) ──

const MOCK_TEAMS = [
  { home: 'Brazil', away: 'Germany' },
  { home: 'Argentina', away: 'France' },
  { home: 'USA', away: 'Mexico' },
  { home: 'Spain', away: 'England' },
];

export function startMockMatchPolling() {
  stopMatchPolling();

  const matchPick = MOCK_TEAMS[Math.floor(Math.random() * MOCK_TEAMS.length)];
  let minute = Math.floor(Math.random() * 70) + 10;
  let homeScore = Math.floor(Math.random() * 3);
  let awayScore = Math.floor(Math.random() * 2);
  let goalCount = homeScore + awayScore;
  let redCardCount = 0;

  const store = useMatchStore.getState();
  store.setTrackedMatch({
    id: 99999,
    status: 'IN_PLAY',
    minute,
    homeTeam: matchPick.home,
    awayTeam: matchPick.away,
    homeScore,
    awayScore,
    goalCount,
    redCardCount,
  });

  pollTimer = window.setInterval(() => {
    minute += 1;
    if (minute > 90) {
      minute = 90;
      useMatchStore.getState().setTrackedMatch({
        id: 99999,
        status: 'FINISHED',
        minute,
        homeTeam: matchPick.home,
        awayTeam: matchPick.away,
        homeScore,
        awayScore,
        goalCount,
        redCardCount,
      });
      stopMatchPolling();
      return;
    }

    // Random events: ~5% chance of goal per minute, ~1% red card
    const rand = Math.random();
    if (rand < 0.05) {
      if (Math.random() < 0.5) homeScore++;
      else awayScore++;
      goalCount++;
      useMatchStore.getState().triggerGoalRush();
    } else if (rand < 0.06) {
      redCardCount++;
      useMatchStore.getState().triggerRedCard();
    }

    useMatchStore.getState().setTrackedMatch({
      id: 99999,
      status: 'IN_PLAY',
      minute,
      homeTeam: matchPick.home,
      awayTeam: matchPick.away,
      homeScore,
      awayScore,
      goalCount,
      redCardCount,
    });
  }, 3_000); // 3 seconds = 1 match minute in dev mode
}
