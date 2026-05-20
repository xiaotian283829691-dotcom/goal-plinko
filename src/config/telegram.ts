/**
 * Telegram Mini App SDK initialization & configuration.
 *
 * All SDK calls are wrapped in try/catch so the app works gracefully
 * in a normal browser (outside Telegram).
 *
 * IMPORTANT: The bot token must NEVER appear in frontend code.
 * It is only used server-side / in Bot API curl calls.
 */

import {
  init,
  mountMiniApp,
  miniAppReady,
  setMiniAppHeaderColor,
  setMiniAppBackgroundColor,
  expandViewport,
  mountViewport,
  mountClosingBehavior,
  enableClosingConfirmation,
  disableClosingConfirmation,
  mountBackButton,
  showBackButton,
  hideBackButton,
  onBackButtonClick,
  offBackButtonClick,
  hapticFeedbackImpactOccurred,
  hapticFeedbackNotificationOccurred,
  retrieveLaunchParams,
} from '@telegram-apps/sdk-react';

// ---------------------------------------------------------------------------
// Public configuration (safe for frontend)
// ---------------------------------------------------------------------------

/** Bot username (without @) — used for deep links, share URLs, etc. */
export const BOT_USERNAME = 'GoalPlinkoBot';

/** The deployed Mini App URL on Cloudflare Pages */
export const WEBAPP_URL = 'https://goal-plinko.pages.dev';

// ---------------------------------------------------------------------------
// SDK state
// ---------------------------------------------------------------------------

let sdkInitialized = false;

/**
 * Initialize the Telegram WebApp SDK.
 * Safe to call outside Telegram — will silently fail.
 */
export function initTelegramApp(): boolean {
  try {
    init();
    sdkInitialized = true;
  } catch {
    console.warn('[TG SDK] Not running inside Telegram, SDK init skipped.');
    return false;
  }

  try {
    // Mount and configure mini app appearance
    mountMiniApp();
    setMiniAppHeaderColor('#111111');
    setMiniAppBackgroundColor('#0a0a0a');
    miniAppReady();
  } catch (e) {
    console.warn('[TG SDK] Mini app mount failed:', e);
  }

  try {
    // Expand viewport to full height
    mountViewport();
    expandViewport();
  } catch (e) {
    console.warn('[TG SDK] Viewport expand failed:', e);
  }

  try {
    // Mount closing behavior (will be toggled by game state)
    mountClosingBehavior();
  } catch (e) {
    console.warn('[TG SDK] Closing behavior mount failed:', e);
  }

  try {
    // Mount back button (hidden by default)
    mountBackButton();
  } catch (e) {
    console.warn('[TG SDK] Back button mount failed:', e);
  }

  return true;
}

/**
 * Enable or disable the close confirmation dialog.
 * Should be enabled when there's an active bet.
 */
export function setCloseConfirmation(enabled: boolean): void {
  if (!sdkInitialized) return;
  try {
    if (enabled) {
      enableClosingConfirmation();
    } else {
      disableClosingConfirmation();
    }
  } catch {
    // Not in Telegram
  }
}

/**
 * Show/hide the Telegram back button.
 */
export function setBackButtonVisible(visible: boolean): void {
  if (!sdkInitialized) return;
  try {
    if (visible) {
      showBackButton();
    } else {
      hideBackButton();
    }
  } catch {
    // Not in Telegram
  }
}

/**
 * Register a handler for the back button.
 * Returns a cleanup function.
 */
export function onBackButton(handler: () => void): () => void {
  if (!sdkInitialized) return () => {};
  try {
    onBackButtonClick(handler);
    return () => {
      try {
        offBackButtonClick(handler);
      } catch {
        // Ignore
      }
    };
  } catch {
    return () => {};
  }
}

// --- Haptic Feedback ---

let lastHapticTime = 0;

/**
 * Light impact — for ball drop.
 */
export function hapticLight(): void {
  if (!sdkInitialized) return;
  try {
    hapticFeedbackImpactOccurred('light');
  } catch {
    // Not in Telegram
  }
}

/**
 * Medium impact — for pin collision (throttled to avoid spam).
 */
export function hapticMedium(): void {
  if (!sdkInitialized) return;
  const now = performance.now();
  if (now - lastHapticTime < 100) return; // Throttle to 10/sec max
  lastHapticTime = now;
  try {
    hapticFeedbackImpactOccurred('medium');
  } catch {
    // Not in Telegram
  }
}

/**
 * Success notification — for wins (multiplier >= 2x).
 */
export function hapticSuccess(): void {
  if (!sdkInitialized) return;
  try {
    hapticFeedbackNotificationOccurred('success');
  } catch {
    // Not in Telegram
  }
}

/**
 * Error notification — for losses (multiplier < 0.5x).
 */
export function hapticError(): void {
  if (!sdkInitialized) return;
  try {
    hapticFeedbackNotificationOccurred('error');
  } catch {
    // Not in Telegram
  }
}

// ---------------------------------------------------------------------------
// Launch params & initData (for server-side validation)
// ---------------------------------------------------------------------------

/**
 * Retrieve the raw initData string from Telegram launch params.
 * This should be sent to a backend for HMAC validation before trusting
 * any user identity claims.
 *
 * Returns undefined when running outside Telegram.
 */
export function getInitData(): string | undefined {
  if (!sdkInitialized) return undefined;
  try {
    const params = retrieveLaunchParams();
    return params.initDataRaw as string | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Retrieve basic user info from launch params.
 * NOTE: Do NOT trust this on the client for anything auth-sensitive.
 * Always validate initData server-side first.
 */
export function getTelegramUser(): {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
} | undefined {
  if (!sdkInitialized) return undefined;
  try {
    const params = retrieveLaunchParams();
    const initData = params.initData as Record<string, unknown> | undefined;
    const user = initData?.user as {
      id: number;
      firstName: string;
      lastName?: string;
      username?: string;
      languageCode?: string;
      photoUrl?: string;
    } | undefined;
    if (!user) return undefined;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      languageCode: user.languageCode,
      photoUrl: user.photoUrl,
    };
  } catch {
    return undefined;
  }
}

export { sdkInitialized as isTelegramEnv };
