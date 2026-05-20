import { create } from 'zustand';
import { type RiskLevel, type RowCount } from '../config/multipliers';
import { CREDIT_BET_OPTIONS, FREE_CREDITS } from '../config/game';
import { soundManager } from '../engine/sound';

export interface ResultEntry {
  multiplier: number;
  payout: number;
  isWin: boolean;
  timestamp: number;
}

interface GameState {
  // Balance (virtual credits)
  balance: number;

  // Bet config (amounts in credits)
  betAmount: number;
  riskLevel: RiskLevel;
  rows: RowCount;

  // Mode
  mode: 'manual' | 'auto';
  autoCount: number;       // total auto bets requested
  autoRemaining: number;   // remaining auto bets
  autoRunning: boolean;

  // History
  history: ResultEntry[];
  totalProfit: number;

  // Active balls count
  activeBalls: number;

  // Win streak tracking
  streak: number;

  // Actions
  setBetAmount: (amount: number) => void;
  setRiskLevel: (risk: RiskLevel) => void;
  setRows: (rows: RowCount) => void;
  setMode: (mode: 'manual' | 'auto') => void;
  setAutoCount: (count: number) => void;

  /** Refill balance back to FREE_CREDITS (for when user runs out) */
  resetBalance: () => void;

  /** Returns true if bet was placed successfully */
  placeBet: () => boolean;

  /** Called when a ball lands in a bin */
  onResult: (multiplier: number) => void;

  /** Auto-bet controls */
  startAuto: () => void;
  stopAuto: () => void;
  tickAuto: () => boolean; // returns false if should stop
}

export const useGameStore = create<GameState>((set, get) => ({
  balance: FREE_CREDITS,
  betAmount: CREDIT_BET_OPTIONS[0],
  riskLevel: 'low',
  rows: 8,
  mode: 'manual',
  autoCount: 10,
  autoRemaining: 0,
  autoRunning: false,
  history: [],
  totalProfit: 0,
  activeBalls: 0,
  streak: 0,

  setBetAmount: (amount) => set({ betAmount: amount }),
  setRiskLevel: (risk) => set({ riskLevel: risk }),
  setRows: (rows) => set({ rows }),
  setMode: (mode) => set({ mode }),
  setAutoCount: (count) => set({ autoCount: Math.max(1, Math.floor(count)) }),

  resetBalance: () => {
    set({
      balance: FREE_CREDITS,
      totalProfit: 0,
      history: [],
      streak: 0,
    });
  },

  placeBet: () => {
    const { balance, betAmount } = get();
    if (balance < betAmount) return false;

    set({
      balance: +(balance - betAmount).toFixed(4),
      activeBalls: get().activeBalls + 1,
    });
    return true;
  },

  onResult: (multiplier) => {
    const { betAmount, balance, history, totalProfit, activeBalls, streak } = get();
    const payout = +(betAmount * multiplier).toFixed(4);
    const profit = +(payout - betAmount).toFixed(4);
    const isWin = multiplier >= 1;

    const entry: ResultEntry = {
      multiplier,
      payout,
      isWin,
      timestamp: Date.now(),
    };

    // Update streak
    const newStreak = isWin ? streak + 1 : 0;

    // Play streak sound when hitting 3 wins in a row
    if (newStreak === 3) {
      soundManager.playStreakSound();
    }

    set({
      balance: +(balance + payout).toFixed(4),
      totalProfit: +(totalProfit + profit).toFixed(4),
      history: [entry, ...history].slice(0, 50),
      activeBalls: Math.max(0, activeBalls - 1),
      streak: newStreak,
    });
  },

  startAuto: () => {
    const { autoCount } = get();
    set({ autoRunning: true, autoRemaining: autoCount });
  },

  stopAuto: () => {
    set({ autoRunning: false, autoRemaining: 0 });
  },

  tickAuto: () => {
    const { autoRemaining, autoRunning, balance, betAmount } = get();
    if (!autoRunning || autoRemaining <= 0 || balance < betAmount) {
      set({ autoRunning: false, autoRemaining: 0 });
      return false;
    }
    set({ autoRemaining: autoRemaining - 1 });
    return true;
  },
}));
