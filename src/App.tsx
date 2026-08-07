/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLevelConfig, LEVEL_CONFIGS } from './lib/levels';
import { sound } from './lib/sound';
import { getSaveData, recordGameEnd, updateSaveData } from './lib/storage';
import { HeaderBar } from './components/HeaderBar';
import { TouchControls } from './components/TouchControls';
import { GameCanvas } from './components/GameCanvas';
import { LevelClearModal } from './components/LevelClearModal';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';

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

  // Modals
  const [showLevelClear, setShowLevelClear] = useState<boolean>(false);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Keep event handlers used by the animation loop stable while still giving
  // them immediate access to the latest session totals.
  const currentLevelRef = useRef(currentLevelNumber);
  const scoreRef = useRef(score);
  const ballsCaughtRef = useRef(ballsCaught);
  const levelBallsCaughtRef = useRef(0);
  const isDeveloperRunRef = useRef(false);
  const timeRemainingRef = useRef(timeRemaining);
  const saveDataRef = useRef(saveData);

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
    if (!isDeveloperRunRef.current) {
      const currentSave = saveDataRef.current;
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
      setIsVictory(true);
      setShowGameOver(true);
    } else {
      setShowLevelClear(true);
    }
  }, []);

  // Game over handler (out of hearts)
  const handleGameOver = useCallback(() => {
    if (!isDeveloperRunRef.current) {
      const currentSave = saveDataRef.current;
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
    setIsVictory(false);
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
        timeRemaining={timeRemaining}
        score={score}
        ballsCaught={ballsCaught}
        hearts={hearts}
        maxHearts={maxHearts}
        isPaused={isPaused}
        isMuted={isMuted}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onToggleMute={handleToggleMute}
        onOpenHelp={() => {
          setIsPaused(true);
          setShowHelp(true);
        }}
      />

      {/* Main Game Viewport Canvas */}
      <GameCanvas
        levelConfig={levelConfig}
        isPaused={
          isPaused || showLevelClear || showGameOver || showHelp
        }
        moveLeftPressed={moveLeftPressed}
        moveRightPressed={moveRightPressed}
        onTimeChange={handleTimeChange}
        onScoreChange={handleScoreChange}
        onBallCaught={handleBallCaught}
        onHeartChange={handleHeartChange}
        onLevelClear={handleLevelClear}
        onGameOver={handleGameOver}
        hearts={hearts}
        maxHearts={maxHearts}
      />

      {/* Mobile touch controls */}
      <TouchControls
        onMoveLeft={(pressed) => setMoveLeftPressed(pressed)}
        onMoveRight={(pressed) => setMoveRightPressed(pressed)}
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
          levelConfig={levelConfig}
          onRestart={() => restartLevel(1)}
        />
      )}

      {showHelp && (
        <HowToPlayModal
          onDeveloperSkip={() => {
            const nextLevel = currentLevelRef.current >= LEVEL_CONFIGS.length
              ? 1
              : currentLevelRef.current + 1;
            restartLevel(nextLevel, false, true);
            setShowHelp(false);
          }}
          onClose={() => {
            setShowHelp(false);
            setIsPaused(false);
          }}
        />
      )}
    </div>
  );
}
