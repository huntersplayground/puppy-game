import { GameStats } from '../types';

const STORAGE_KEY = 'puppy_down_game_save_v1';

export interface GameSaveData {
  highScore: number;
  bestLevel: number; // 1 to 10
  totalBallsEver: number;
  levelHighScores: Record<number, number>; // levelNumber -> best score
  unlockedLevels: number; // 1 to 10
  soundMuted: boolean;
  tiltEnabled: boolean;
}

const DEFAULT_SAVE: GameSaveData = {
  highScore: 0,
  bestLevel: 1,
  totalBallsEver: 0,
  levelHighScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  unlockedLevels: 1,
  soundMuted: false,
  tiltEnabled: false,
};

export function getSaveData(): GameSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE,
      ...parsed,
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
