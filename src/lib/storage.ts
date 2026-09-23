import { AvatarId, GameStats, PlayerProfile } from '../types';

const STORAGE_KEY = 'puppy_down_game_save_v1';

export interface GameSaveData {
  highScore: number;
  bestLevel: number; // 1 to 10
  totalBallsEver: number;
  levelHighScores: Record<number, number>; // levelNumber -> best score
  unlockedLevels: number; // 1 to 10
  soundMuted: boolean;
  hasSeenHowToPlay: boolean;
  playerProfile?: PlayerProfile;
  pendingLeaderboardScore?: PendingLeaderboardScore;
}

export interface PendingLeaderboardScore {
  score: number;
  levelReached: number;
  ballsCaught: number;
}

const DEFAULT_SAVE: GameSaveData = {
  highScore: 0,
  bestLevel: 1,
  totalBallsEver: 0,
  levelHighScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  unlockedLevels: 1,
  soundMuted: false,
  hasSeenHowToPlay: false,
};

export function getSaveData(): GameSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw);
    const { tiltEnabled: _removedTiltSetting, ...savedData } = parsed;
    return {
      ...DEFAULT_SAVE,
      ...savedData,
      levelHighScores: {
        ...DEFAULT_SAVE.levelHighScores,
        ...(parsed.levelHighScores || {}),
      },
    };
  } catch (e) {
    console.warn('Failed to read save data from localStorage:', e);
    return { ...DEFAULT_SAVE };
  }
}

export function updateSaveData(updates: Partial<GameSaveData>): GameSaveData {
  const current = getSaveData();
  const next: GameSaveData = {
    ...current,
    ...updates,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('Failed to write save data to localStorage:', e);
  }
  return next;
}

function createBrowserId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getPlayerProfile(): PlayerProfile {
  const current = getSaveData();
  if (current.playerProfile) return current.playerProfile;

  const profile: PlayerProfile = {
    browserId: createBrowserId(),
    username: '',
    avatarId: 'golden-pup',
  };
  updateSaveData({ playerProfile: profile });
  return profile;
}

export function savePlayerProfile(username: string, avatarId: AvatarId): PlayerProfile {
  const current = getPlayerProfile();
  const profile: PlayerProfile = {
    ...current,
    username,
    avatarId,
  };
  updateSaveData({ playerProfile: profile });
  return profile;
}

export function savePendingLeaderboardScore(
  attempt: PendingLeaderboardScore
): PendingLeaderboardScore {
  const current = getSaveData().pendingLeaderboardScore;
  const shouldReplace =
    !current ||
    attempt.score > current.score ||
    (attempt.score === current.score && attempt.levelReached > current.levelReached) ||
    (attempt.score === current.score &&
      attempt.levelReached === current.levelReached &&
      attempt.ballsCaught > current.ballsCaught);
  const pending = shouldReplace ? attempt : current;
  updateSaveData({ pendingLeaderboardScore: pending });
  return pending;
}

export function getPendingLeaderboardScore(): PendingLeaderboardScore | undefined {
  return getSaveData().pendingLeaderboardScore;
}

export function clearPendingLeaderboardScore(submitted: PendingLeaderboardScore): void {
  const current = getSaveData().pendingLeaderboardScore;
  if (!current) return;

  // An older request must not clear a better score that was queued while it
  // was in flight.
  if (
    current.score > submitted.score ||
    (current.score === submitted.score && current.levelReached > submitted.levelReached) ||
    (current.score === submitted.score &&
      current.levelReached === submitted.levelReached &&
      current.ballsCaught > submitted.ballsCaught)
  ) {
    return;
  }
  updateSaveData({ pendingLeaderboardScore: undefined });
}

export function recordAttemptBest(score: number, levelReached: number): GameSaveData {
  const save = getSaveData();
  return updateSaveData({
    highScore: Math.max(save.highScore, score),
    bestLevel: Math.max(save.bestLevel, levelReached),
    levelHighScores: {
      ...save.levelHighScores,
      [levelReached]: Math.max(save.levelHighScores[levelReached] || 0, score),
    },
  });
}

export function recordGameEnd(stats: GameStats, levelCleared: boolean): GameSaveData {
  const save = getSaveData();
  const nextUnlocked = levelCleared && stats.currentLevel < 10
    ? Math.max(save.unlockedLevels, stats.currentLevel + 1)
    : save.unlockedLevels;

  const levelBest = Math.max(
    save.levelHighScores[stats.currentLevel] || 0,
    stats.score
  );

  return updateSaveData({
    highScore: Math.max(save.highScore, stats.score),
    bestLevel: Math.max(save.bestLevel, stats.currentLevel),
    totalBallsEver: save.totalBallsEver + stats.ballsCaught,
    levelHighScores: {
      ...save.levelHighScores,
      [stats.currentLevel]: levelBest,
    },
    unlockedLevels: nextUnlocked,
  });
}
