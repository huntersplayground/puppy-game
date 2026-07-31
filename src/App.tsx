/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLevelConfig } from './lib/levels';
import { sound } from './lib/sound';
import { getSaveData, recordGameEnd, updateSaveData } from './lib/storage';
import { HeaderBar } from './components/HeaderBar';
import { TouchControls } from './components/TouchControls';
import { GameCanvas } from './components/GameCanvas';
import { LevelClearModal } from './components/LevelClearModal';
import { GameOverModal } from './components/GameOverModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { HowToPlayModal } from './components/HowToPlayModal';

export default function App() {
  // Saved storage state
  const [saveData, setSaveData] = useState(() => getSaveData());

  // Current game session state
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [ballsCaught, setBallsCaught] = useState<number>(0);
  const [floorCount, setFloorCount] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(5);
  const maxHearts = 5;

  // Controls state
  const [moveLeftPressed, setMoveLeftPressed] = useState<boolean>(false);
  const [moveRightPressed, setMoveRightPressed] = useState<boolean>(false);
  const [tiltEnabled, setTiltEnabled] = useState<boolean>(() => getSaveData().tiltEnabled);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => getSaveData().soundMuted);

  // Modals
  const [showLevelClear, setShowLevelClear] = useState<boolean>(false);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Keep event handlers used by the animation loop stable while still giving
  // them immediate access to the latest session totals.
  const currentLevelRef = useRef(currentLevelNumber);
  const scoreRef = useRef(score);
  const ballsCaughtRef = useRef(ballsCaught);
  const floorCountRef = useRef(floorCount);
  const saveDataRef = useRef(saveData);

  const levelConfig = getLevelConfig(currentLevelNumber);

  // Reset session when starting or replaying a level
  const restartLevel = useCallback((levelNum: number) => {
    currentLevelRef.current = levelNum;
    scoreRef.current = 0;
    ballsCaughtRef.current = 0;
    floorCountRef.current = 0;
    setCurrentLevelNumber(levelNum);
    setScore(0);
    setBallsCaught(0);
    setFloorCount(0);
    setHearts(maxHearts);
    setIsPaused(false);
    setShowLevelClear(false);
    setShowGameOver(false);
    setIsVictory(false);
  }, []);

  const handleFloorChange = useCallback((floor: number) => {
    floorCountRef.current = floor;
    setFloorCount(floor);
  }, []);

  const handleScoreChange = useCallback((delta: number) => {
    scoreRef.current += delta;
    setScore(scoreRef.current);
  }, []);

  const handleBallCaught = useCallback(() => {
    ballsCaughtRef.current += 1;
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
    const newSave = recordGameEnd(
      {
        score: scoreRef.current,
        currentLevel: clearedLevel,
        floorCount: clearedConfig.targetFloors,
        ballsCaught: ballsCaughtRef.current,
        highScore: currentSave.highScore,
        bestLevel: currentSave.bestLevel,
        totalBallsEver: currentSave.totalBallsEver,
      },
      true
    );
    saveDataRef.current = newSave;
    setSaveData(newSave);

    if (clearedLevel >= 5) {
      // Beating level 5 is Ultimate Champion Victory!
      setIsVictory(true);
      setShowGameOver(true);
    } else {
      setShowLevelClear(true);
    }
  }, []);

  // Game over handler (out of hearts)
  const handleGameOver = useCallback(() => {
    const currentSave = saveDataRef.current;
    const newSave = recordGameEnd(
      {
        score: scoreRef.current,
        currentLevel: currentLevelRef.current,
        floorCount: floorCountRef.current,
        ballsCaught: ballsCaughtRef.current,
        highScore: currentSave.highScore,
        bestLevel: currentSave.bestLevel,
        totalBallsEver: currentSave.totalBallsEver,
      },
      false
    );
    saveDataRef.current = newSave;
    setSaveData(newSave);
    setIsVictory(false);
    setShowGameOver(true);
  }, []);

  // Handle proceed to next level
  const handleNextLevel = () => {
    if (currentLevelNumber < 5) {
      restartLevel(currentLevelNumber + 1);
    }
  };

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

  const handleTiltToggle = useCallback((enabled: boolean) => {
    setTiltEnabled(enabled);
    const newSave = updateSaveData({ tiltEnabled: enabled });
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
        floorCount={floorCount}
        score={score}
        ballsCaught={ballsCaught}
        hearts={hearts}
        maxHearts={maxHearts}
        isPaused={isPaused}
        isMuted={isMuted}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onToggleMute={handleToggleMute}
        onOpenLevelSelect={() => {
          setIsPaused(true);
          setShowLevelSelect(true);
        }}
        onOpenHelp={() => {
          setIsPaused(true);
          setShowHelp(true);
        }}
      />

      {/* Main Game Viewport Canvas */}
      <GameCanvas
        levelConfig={levelConfig}
        isPaused={
          isPaused || showLevelClear || showGameOver || showLevelSelect || showHelp
        }
        moveLeftPressed={moveLeftPressed}
        moveRightPressed={moveRightPressed}
        onFloorChange={handleFloorChange}
        onScoreChange={handleScoreChange}
        onBallCaught={handleBallCaught}
        onHeartChange={handleHeartChange}
        onLevelClear={handleLevelClear}
        onGameOver={handleGameOver}
        hearts={hearts}
        maxHearts={maxHearts}
      />

      {/* iPhone / Mobile Touch Thumb Controls at bottom */}
      <TouchControls
        onMoveLeft={(pressed) => setMoveLeftPressed(pressed)}
        onMoveRight={(pressed) => setMoveRightPressed(pressed)}
        onTiltToggle={handleTiltToggle}
        tiltEnabled={tiltEnabled}
      />

      {/* --- Modals --- */}
      {showLevelClear && (
        <LevelClearModal
          levelConfig={levelConfig}
          score={score}
          ballsCaught={ballsCaught}
          onNextLevel={handleNextLevel}
          onReplayLevel={() => restartLevel(currentLevelNumber)}
        />
      )}

      {showGameOver && (
        <GameOverModal
          isVictory={isVictory}
          score={score}
          ballsCaught={ballsCaught}
          floorCount={floorCount}
          currentLevel={currentLevelNumber}
          highScore={saveData.highScore}
          levelConfig={levelConfig}
          onRestart={() => restartLevel(currentLevelNumber)}
          onOpenLevelSelect={() => {
            setShowGameOver(false);
            setShowLevelSelect(true);
          }}
        />
      )}

      {showLevelSelect && (
        <LevelSelectModal
          currentLevelNumber={currentLevelNumber}
          unlockedLevels={saveData.unlockedLevels}
          levelHighScores={saveData.levelHighScores}
          onSelectLevel={(levelNum) => {
            setShowLevelSelect(false);
            restartLevel(levelNum);
          }}
          onClose={() => {
            setShowLevelSelect(false);
            setIsPaused(false);
          }}
        />
      )}

      {showHelp && (
        <HowToPlayModal
          onClose={() => {
            setShowHelp(false);
            setIsPaused(false);
          }}
        />
      )}
    </div>
  );
}
