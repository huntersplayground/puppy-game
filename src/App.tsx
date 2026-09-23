/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLevelConfig, LEVEL_CONFIGS } from './lib/levels';
import { sound } from './lib/sound';
import {
  clearPendingLeaderboardScore,
  getPendingLeaderboardScore,
  getPlayerProfile,
  getSaveData,
  PendingLeaderboardScore,
  recordAttemptBest,
  recordGameEnd,
  savePendingLeaderboardScore,
  savePlayerProfile,
  updateSaveData,
} from './lib/storage';
import { saveRemoteProfile, submitLeaderboardScore } from './lib/leaderboard';
import { AvatarId, PlayerProfile } from './types';
import { HeaderBar } from './components/HeaderBar';
import { GameCanvas } from './components/GameCanvas';
import { LevelClearModal } from './components/LevelClearModal';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { LeaderboardModal } from './components/LeaderboardModal';

export default function App() {
  // Saved storage state
  const [saveData, setSaveData] = useState(() => getSaveData());

  // Current game session state
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [ballsCaught, setBallsCaught] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(5);
  const maxHearts = 5;

  // Controls state
  const [moveLeftPressed, setMoveLeftPressed] = useState<boolean>(false);
  const [moveRightPressed, setMoveRightPressed] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => getSaveData().soundMuted);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => getPlayerProfile());

  // Modals
  const [showLevelClear, setShowLevelClear] = useState<boolean>(false);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isRunEnded, setIsRunEnded] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(() => !saveData.hasSeenHowToPlay);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [gameInstanceKey, setGameInstanceKey] = useState<number>(0);
  const [leaderboardNotice, setLeaderboardNotice] = useState<string>('');

  // Keep event handlers used by the animation loop stable while still giving
  // them immediate access to the latest session totals.
  const currentLevelRef = useRef(currentLevelNumber);
  const scoreRef = useRef(score);
  const ballsCaughtRef = useRef(ballsCaught);
  const levelBallsCaughtRef = useRef(0);
  const levelStartScoreRef = useRef(0);
  const levelStartBallsCaughtRef = useRef(0);
  const isDeveloperRunRef = useRef(false);
  const runFinalizedRef = useRef(false);
  const timeRemainingRef = useRef(timeRemaining);
  const saveDataRef = useRef(saveData);
  const playerProfileRef = useRef(playerProfile);
  const leaderboardNoticeTimeoutRef = useRef<number | null>(null);

  const levelConfig = getLevelConfig(currentLevelNumber);

  const showLeaderboardNotice = useCallback((message: string) => {
    setLeaderboardNotice(message);
    if (leaderboardNoticeTimeoutRef.current !== null) {
      window.clearTimeout(leaderboardNoticeTimeoutRef.current);
    }
    leaderboardNoticeTimeoutRef.current = window.setTimeout(() => {
      setLeaderboardNotice('');
      leaderboardNoticeTimeoutRef.current = null;
    }, 5000);
  }, []);

  const syncPendingLeaderboardScore = useCallback(async (showFailureMessage = false) => {
    const pending = getPendingLeaderboardScore();
    const profile = playerProfileRef.current;
    if (!pending || !profile.username) return;

    try {
      // Older versions could save a profile locally even when the server
      // request failed. Upserting it here makes those players self-repair
      // before their pending score is submitted.
      await saveRemoteProfile(profile);
      await submitLeaderboardScore(
        profile,
        pending.score,
        pending.levelReached,
        pending.ballsCaught
      );
      clearPendingLeaderboardScore(pending);
    } catch {
      if (showFailureMessage) {
        showLeaderboardNotice('Score saved on this device. We’ll retry the leaderboard later.');
      }
    }
  }, [showLeaderboardNotice]);

  const submitScoreReliably = useCallback((attempt: PendingLeaderboardScore) => {
    if (attempt.score <= 0 || isDeveloperRunRef.current) return;
    savePendingLeaderboardScore(attempt);
    void syncPendingLeaderboardScore(true);
  }, [syncPendingLeaderboardScore]);

  const syncBeforeLeaderboardLoad = useCallback(async () => {
    await syncPendingLeaderboardScore(true);
  }, [syncPendingLeaderboardScore]);

  // Reset session when starting or replaying a level
  const restartLevel = useCallback((levelNum: number, preserveRunScore: boolean = false, isDeveloperRun: boolean = false) => {
    isDeveloperRunRef.current = isDeveloperRun;
    currentLevelRef.current = levelNum;
    if (!preserveRunScore) {
      scoreRef.current = 0;
      ballsCaughtRef.current = 0;
      setScore(0);
      setBallsCaught(0);
    }
    levelStartScoreRef.current = scoreRef.current;
    levelStartBallsCaughtRef.current = ballsCaughtRef.current;
    levelBallsCaughtRef.current = 0;
    timeRemainingRef.current = getLevelConfig(levelNum).durationSeconds;
    setCurrentLevelNumber(levelNum);
    setTimeRemaining(getLevelConfig(levelNum).durationSeconds);
    setHearts(maxHearts);
    setIsPaused(false);
    setShowLevelClear(false);
    setShowGameOver(false);
    setIsVictory(false);
    setIsRunEnded(false);
    setIsNewHighScore(false);
    runFinalizedRef.current = false;
    // Replaying the current level does not change levelNum, so explicitly
    // remount the canvas to clear its completed/paused animation state.
    setGameInstanceKey((current) => current + 1);
  }, []);

  const retryCurrentLevel = useCallback(() => {
    scoreRef.current = levelStartScoreRef.current;
    ballsCaughtRef.current = levelStartBallsCaughtRef.current;
    setScore(levelStartScoreRef.current);
    setBallsCaught(levelStartBallsCaughtRef.current);
    restartLevel(currentLevelRef.current, true, isDeveloperRunRef.current);
  }, [restartLevel]);

  const handleTimeChange = useCallback((seconds: number) => {
    timeRemainingRef.current = seconds;
    setTimeRemaining(seconds);
  }, []);

  const handleScoreChange = useCallback((delta: number) => {
    scoreRef.current += delta;
    setScore(scoreRef.current);
  }, []);

  const handleBallCaught = useCallback(() => {
    ballsCaughtRef.current += 1;
    levelBallsCaughtRef.current += 1;
    setBallsCaught(ballsCaughtRef.current);
  }, []);

  const handleHeartChange = useCallback((newHearts: number) => {
    setHearts(newHearts);
  }, []);

  // Level clear handler
  const handleLevelClear = useCallback(() => {
    const clearedLevel = currentLevelRef.current;
    const clearedConfig = getLevelConfig(clearedLevel);
    const currentSave = saveDataRef.current;
    setIsNewHighScore(scoreRef.current > currentSave.highScore);
    if (!isDeveloperRunRef.current) {
      const newSave = recordGameEnd(
        {
          score: scoreRef.current,
          currentLevel: clearedLevel,
          floorCount: clearedConfig.durationSeconds - timeRemainingRef.current,
          ballsCaught: levelBallsCaughtRef.current,
          highScore: currentSave.highScore,
          bestLevel: currentSave.bestLevel,
          totalBallsEver: currentSave.totalBallsEver,
        },
        true
      );
      saveDataRef.current = newSave;
      setSaveData(newSave);
    }

    if (clearedLevel >= LEVEL_CONFIGS.length) {
      if (!isDeveloperRunRef.current) {
        submitScoreReliably({
          score: scoreRef.current,
          levelReached: clearedLevel,
          ballsCaught: ballsCaughtRef.current,
        });
      }
      runFinalizedRef.current = true;
      setIsVictory(true);
      setIsRunEnded(true);
      setShowGameOver(true);
    } else {
      setShowLevelClear(true);
    }
  }, [submitScoreReliably]);

  // Game over handler (out of hearts)
  const handleGameOver = useCallback(() => {
    const currentSave = saveDataRef.current;
    const isNewBest = scoreRef.current > currentSave.highScore;
    setIsNewHighScore(isNewBest);
    if (!isDeveloperRunRef.current) {
      const newSave = recordAttemptBest(scoreRef.current, currentLevelRef.current);
      saveDataRef.current = newSave;
      setSaveData(newSave);
      submitScoreReliably({
        score: scoreRef.current,
        levelReached: currentLevelRef.current,
        ballsCaught: ballsCaughtRef.current,
      });
    }
    setIsVictory(false);
    setIsRunEnded(true);
    setShowGameOver(true);
  }, [submitScoreReliably]);

  const finalizeFailedRun = useCallback(() => {
    if (runFinalizedRef.current || isDeveloperRunRef.current) return;
    const currentSave = saveDataRef.current;
    const newSave = recordGameEnd(
      {
        score: scoreRef.current,
        currentLevel: currentLevelRef.current,
        floorCount:
          getLevelConfig(currentLevelRef.current).durationSeconds -
          timeRemainingRef.current,
        ballsCaught: levelBallsCaughtRef.current,
        highScore: currentSave.highScore,
        bestLevel: currentSave.bestLevel,
        totalBallsEver: currentSave.totalBallsEver,
      },
      false
    );
    saveDataRef.current = newSave;
    setSaveData(newSave);
    runFinalizedRef.current = true;
  }, []);

  const startNewRun = useCallback(() => {
    if (isRunEnded && !isVictory) finalizeFailedRun();
    restartLevel(1);
  }, [finalizeFailedRun, isRunEnded, isVictory, restartLevel]);

  useEffect(() => {
    sound.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    void syncPendingLeaderboardScore();
    const handleOnline = () => void syncPendingLeaderboardScore(true);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      if (leaderboardNoticeTimeoutRef.current !== null) {
        window.clearTimeout(leaderboardNoticeTimeoutRef.current);
      }
    };
  }, [syncPendingLeaderboardScore]);

  useEffect(() => {
    const preventPressCallout = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('input, textarea, [contenteditable="true"]')
      ) {
        return;
      }
      event.preventDefault();
    };

    document.addEventListener('contextmenu', preventPressCallout, true);
    document.addEventListener('selectstart', preventPressCallout, true);
    return () => {
      document.removeEventListener('contextmenu', preventPressCallout, true);
      document.removeEventListener('selectstart', preventPressCallout, true);
    };
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    const newSave = updateSaveData({ soundMuted: muted });
    saveDataRef.current = newSave;
    setSaveData(newSave);
  }, []);

  const markHowToPlaySeen = useCallback(() => {
    if (saveDataRef.current.hasSeenHowToPlay) return;
    const newSave = updateSaveData({ hasSeenHowToPlay: true });
    saveDataRef.current = newSave;
    setSaveData(newSave);
  }, []);

  const handleSaveProfile = useCallback(async (username: string, avatarId: AvatarId): Promise<string | null> => {
    const candidate: PlayerProfile = { ...playerProfileRef.current, username, avatarId };
    try {
      await saveRemoteProfile(candidate);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save your profile';
      if (message === 'That nickname is already taken') return message;
      return 'Couldn’t connect to the leaderboard. Please try again.';
    }

    const savedProfile = savePlayerProfile(username, avatarId);
    playerProfileRef.current = savedProfile;
    setPlayerProfile(savedProfile);
    const newSave = getSaveData();
    saveDataRef.current = newSave;
    setSaveData(newSave);
    setShowProfile(false);
    void syncPendingLeaderboardScore(true);
    if (!isRunEnded) setIsPaused(false);
    return null;
  }, [isRunEnded, syncPendingLeaderboardScore]);

  // Keyboard shortcut for pause / reset
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="w-full h-[100dvh] bg-slate-950 flex flex-col items-center justify-between overflow-hidden select-none font-sans">
      {/* Top HUD Header */}
      <HeaderBar
        levelConfig={levelConfig}
        totalLevels={LEVEL_CONFIGS.length}
        score={score}
        ballsCaught={ballsCaught}
        hearts={hearts}
        maxHearts={maxHearts}
        isPaused={isPaused}
        isRunEnded={isRunEnded}
        isMuted={isMuted}
        playerProfile={playerProfile}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onStartNewRun={startNewRun}
        onToggleMute={handleToggleMute}
        onOpenHelp={() => {
          setIsPaused(true);
          setShowHelp(true);
        }}
        onOpenLeaderboard={() => {
          setIsPaused(true);
          setShowLeaderboard(true);
        }}
        onOpenProfile={() => {
          setIsPaused(true);
          setShowProfile(true);
        }}
      />

      {/* Main Game Viewport Canvas */}
      <GameCanvas
        key={gameInstanceKey}
        levelConfig={levelConfig}
        isPaused={
          isPaused || isRunEnded || showLevelClear || showGameOver || showHelp || showProfile || showLeaderboard
        }
        moveLeftPressed={moveLeftPressed}
        moveRightPressed={moveRightPressed}
        onTouchMoveLeft={setMoveLeftPressed}
        onTouchMoveRight={setMoveRightPressed}
        onTimeChange={handleTimeChange}
        onScoreChange={handleScoreChange}
        onBallCaught={handleBallCaught}
        onHeartChange={handleHeartChange}
        onLevelClear={handleLevelClear}
        onGameOver={handleGameOver}
        hearts={hearts}
        maxHearts={maxHearts}
      />

      {/* --- Modals --- */}
      {showLevelClear && (
        <LevelClearModal
          levelConfig={levelConfig}
          score={score}
          ballsCaught={ballsCaught}
          onNextLevel={() => restartLevel(currentLevelNumber + 1, true, isDeveloperRunRef.current)}
          onReplayLevel={retryCurrentLevel}
        />
      )}
      {showGameOver && (
        <GameOverModal
          isVictory={isVictory}
          score={score}
          ballsCaught={ballsCaught}
          elapsedSeconds={levelConfig.durationSeconds - timeRemaining}
          currentLevel={currentLevelNumber}
          highScore={saveData.highScore}
          isNewHighScore={isNewHighScore}
          levelConfig={levelConfig}
          onRetryLevel={retryCurrentLevel}
          onRestart={startNewRun}
          onClose={() => setShowGameOver(false)}
        />
      )}

      {showHelp && (
        <HowToPlayModal
          onDeveloperSkip={() => {
            const nextLevel = currentLevelRef.current >= LEVEL_CONFIGS.length
              ? 1
              : currentLevelRef.current + 1;
            restartLevel(nextLevel, false, true);
            markHowToPlaySeen();
            setShowHelp(false);
          }}
          onClose={() => {
            markHowToPlaySeen();
            setShowHelp(false);
            if (playerProfileRef.current.username && !isRunEnded) {
              setIsPaused(false);
            } else {
              if (!playerProfileRef.current.username) setShowProfile(true);
            }
          }}
        />
      )}
      {showProfile && (
        <PlayerProfileModal
          profile={playerProfile}
          onSave={handleSaveProfile}
          onClose={playerProfile.username ? () => {
            setShowProfile(false);
            if (!isRunEnded) setIsPaused(false);
          } : undefined}
        />
      )}
      {showLeaderboard && (
        <LeaderboardModal
          profile={playerProfile}
          beforeLoad={syncBeforeLeaderboardLoad}
          onClose={() => {
            setShowLeaderboard(false);
            if (!isRunEnded) setIsPaused(false);
          }}
        />
      )}
      {leaderboardNotice && (
        <div
          className="absolute bottom-5 left-1/2 z-[70] w-[min(90%,24rem)] -translate-x-1/2 rounded-2xl border border-amber-400/40 bg-slate-900/95 px-4 py-3 text-center text-sm font-semibold text-amber-100 shadow-2xl backdrop-blur"
          role="status"
          aria-live="polite"
        >
          {leaderboardNotice}
        </div>
      )}
    </div>
  );
}
