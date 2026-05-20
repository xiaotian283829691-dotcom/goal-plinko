/**
 * React hook for Telegram Mini App features.
 *
 * Provides a safe interface to Telegram features that gracefully
 * degrades when running outside Telegram (e.g., in Chrome dev mode).
 */

import { useEffect, useRef, useMemo } from 'react';
import {
  setCloseConfirmation,
  setBackButtonVisible,
  onBackButton,
  hapticLight,
  hapticMedium,
  hapticSuccess,
  hapticError,
  isTelegramEnv,
  getInitData,
  getTelegramUser,
} from '../config/telegram';

interface UseTelegramOptions {
  /** Show close confirmation when there are active bets */
  activeBets?: number;
  /** Show back button */
  showBackButton?: boolean;
  /** Callback when back button is pressed */
  onBack?: () => void;
}

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
}

interface UseTelegramReturn {
  /** Whether we're running inside Telegram */
  isTelegram: boolean;
  /** Telegram user info (undefined outside Telegram or if unavailable) */
  user: TelegramUser | undefined;
  /**
   * Raw initData string for server-side HMAC validation.
   * Send this to your backend to verify user identity.
   */
  initData: string | undefined;
  /** Haptic feedback helpers (no-op outside Telegram) */
  haptic: {
    light: () => void;
    medium: () => void;
    success: () => void;
    error: () => void;
  };
}

export function useTelegram(options: UseTelegramOptions = {}): UseTelegramReturn {
  const { activeBets = 0, showBackButton = false, onBack } = options;
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  // Toggle close confirmation based on active bets
  useEffect(() => {
    setCloseConfirmation(activeBets > 0);
  }, [activeBets]);

  // Toggle back button visibility
  useEffect(() => {
    setBackButtonVisible(showBackButton);
  }, [showBackButton]);

  // Register back button handler
  useEffect(() => {
    if (!showBackButton || !onBackRef.current) return;
    const handler = () => onBackRef.current?.();
    return onBackButton(handler);
  }, [showBackButton]);

  const haptic = useMemo(
    () => ({
      light: () => hapticLight(),
      medium: () => hapticMedium(),
      success: () => hapticSuccess(),
      error: () => hapticError(),
    }),
    [],
  );

  // Retrieve user & initData once (stable across renders)
  const user = useMemo(() => getTelegramUser(), []);
  const initData = useMemo(() => getInitData(), []);

  return {
    isTelegram: isTelegramEnv,
    user,
    initData,
    haptic,
  };
}
