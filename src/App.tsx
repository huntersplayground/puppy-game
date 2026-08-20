/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLevelConfig, LEVEL_CONFIGS } from './lib/levels';
import { sound } from './lib/sound';
import { getPlayerProfile, getSaveData, recordGameEnd, savePlayerProfile, updateSaveData } from './lib/storage';
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

  // Keep event handlers used by the animation loop stable while still giving
  // them immediate access to the latest session totals.
  const currentLevelRef = useRef(currentLevelNumber);
  const scoreRef = useRef(score);
  const ballsCaughtRef = useRef(ballsCaught);
  const levelBallsCaughtRef = useRef(0);
  const isDeveloperRunRef = useRef(false);
  const timeRemainingRef = useRef(timeRemaining);
  const saveDataRef = useRef(saveData);
  const playerProfileRef = useRef(playerProfile);

  const levelConfig = getLevelConfig(currentLevelNumber);

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
  }, []);

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
        void submitLeaderboardScore(playerProfileRef.current, scoreRef.current, clearedLevel, ballsCaughtRef.current).catch(() => undefined);
      }
      setIsVictory(true);
      setIsRunEnded(true);
      setShowGameOver(true);
    } else {
      setShowLevelClear(true);
    }
  }, []);

  // Game over handler (out of hearts)
  const handleGameOver = useCallback(() => {
    const currentSave = saveDataRef.current;
    setIsNewHighScore(scoreRef.current > currentSave.highScore);
    if (!isDeveloperRunRef.current) {
      const newSave = recordGameEnd(
        {
          score: scoreRef.current,
          currentLevel: currentLevelRef.current,
          floorCount: getLevelConfig(currentLevelRef.current).durationSeconds - timeRemainingRef.current,
          ballsCaught: levelBallsCaughtRef.current,
          highScore: currentSave.highScore,
          bestLevel: currentSave.bestLevel,
          totalBallsEver: currentSave.totalBallsEver,
        },
        false
      );
      saveDataRef.current = newSave;
      setSaveData(newSave);
    }
    if (!isDeveloperRunRef.current) {
      void submitLeaderboardScore(playerProfileRef.current, scoreRef.current, currentLevelRef.current, ballsCaughtRef.current).catch(() => undefined);
    }
    setIsVictory(false);
    setIsRunEnded(true);
    setShowGameOver(true);
  }, []);

  useEffect(() => {
    sound.setMuted(isMuted);
  }, [isMuted]);

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
    }

    const savedProfile = savePlayerProfile(username, avatarId);
    playerProfileRef.current = savedProfile;
    setPlayerProfile(savedProfile);
    const newSave = getSaveData();
    saveDataRef.current = newSave;
    setSaveData(newSave);
    setShowProfile(false);
    if (!isRunEnded) setIsPaused(false);
    return null;
  }, [isRunEnded]);

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
        onStartNewRun={() => restartLevel(1)}
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
          onReplayLevel={() => restartLevel(currentLevelNumber)}
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
          onRestart={() => restartLevel(1)}
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
          onClose={() => {
            setShowLeaderboard(false);
            if (!isRunEnded) setIsPaused(false);
          }}
        />
      )}
    </div>
  );
}
