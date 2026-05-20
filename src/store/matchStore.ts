import { create } from 'zustand';

export interface TrackedMatch {
  id: number;
  status: string;
  minute: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  goalCount: number;
  redCardCount: number;
}

export type MatchEvent = {
  type: 'goal' | 'redCard';
  timestamp: number;
};

export type TeamId = 'brazil' | 'argentina' | 'france' | 'germany' | 'usa' | 'mexico' | 'spain' | 'england' | null;

export const TEAM_INFO: Record<Exclude<TeamId, null>, { name: string; flag: string; ballImg: string }> = {
  brazil:    { name: 'Brazil',    flag: '🇧🇷', ballImg: '/images/ball-brazil.png' },
  argentina: { name: 'Argentina', flag: '🇦🇷', ballImg: '/images/ball-argentina.png' },
  france:    { name: 'France',    flag: '🇫🇷', ballImg: '/images/ball-france.png' },
  germany:   { name: 'Germany',   flag: '🇩🇪', ballImg: '/images/ball-germany.png' },
  usa:       { name: 'USA',       flag: '🇺🇸', ballImg: '/images/ball-usa.png' },
  mexico:    { name: 'Mexico',    flag: '🇲🇽', ballImg: '/images/ball-mexico.png' },
  spain:     { name: 'Spain',     flag: '🇪🇸', ballImg: '/images/ball-spain.png' },
  england:   { name: 'England',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ballImg: '/images/ball-england.png' },
};

interface MatchState {
  trackedMatch: TrackedMatch | null;
  selectedTeam: TeamId;
  goalRushActive: boolean;
  goalRushEndTime: number;
  multiplierBoost: number;
  recentEvents: MatchEvent[];
  rowReduction: number; // red card reduces rows

  setTrackedMatch: (match: TrackedMatch | null) => void;
  setSelectedTeam: (team: TeamId) => void;
  triggerGoalRush: () => void;
  triggerRedCard: () => void;
  tickGoalRush: () => void;
}

const GOAL_RUSH_DURATION = 5 * 60 * 1000; // 5 minutes

export const useMatchStore = create<MatchState>((set, get) => ({
  trackedMatch: null,
  selectedTeam: null,
  goalRushActive: false,
  goalRushEndTime: 0,
  multiplierBoost: 1,
  recentEvents: [],
  rowReduction: 0,

  setTrackedMatch: (match) => set({ trackedMatch: match }),

  setSelectedTeam: (team) => set({ selectedTeam: team }),

  triggerGoalRush: () => {
    const now = Date.now();
    set({
      goalRushActive: true,
      goalRushEndTime: now + GOAL_RUSH_DURATION,
      multiplierBoost: 2,
      recentEvents: [
        { type: 'goal', timestamp: now },
        ...get().recentEvents.slice(0, 9),
      ],
    });
  },

  triggerRedCard: () => {
    const current = get().rowReduction;
    set({
      rowReduction: Math.min(current + 4, 8),
      recentEvents: [
        { type: 'redCard', timestamp: Date.now() },
        ...get().recentEvents.slice(0, 9),
      ],
    });
  },

  tickGoalRush: () => {
    const { goalRushActive, goalRushEndTime } = get();
    if (goalRushActive && Date.now() >= goalRushEndTime) {
      set({
        goalRushActive: false,
        multiplierBoost: 1,
      });
    }
  },
}));
