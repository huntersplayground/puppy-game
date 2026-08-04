import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Sparkles, Award } from 'lucide-react';
import { LevelConfig } from '../types';

interface GameOverModalProps {
  isVictory: boolean;
  score: number;
  ballsCaught: number;
  elapsedSeconds: number;
  currentLevel: number;
  highScore: number;
  levelConfig: LevelConfig;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  score,
  ballsCaught,
  elapsedSeconds,
  currentLevel,
  highScore,
  levelConfig,
  onRestart,
}) => {
  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#8b5cf6'],
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [isVictory]);

  const isNewHighScore = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 select-none">
      <div
        className={`bg-gradient-to-b from-slate-900 to-slate-800 border-2 ${
          isVictory ? 'border-amber-400/80 shadow-amber-500/20' : 'border-rose-500/50 shadow-rose-500/10'
        } rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Icon Header */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 text-4xl shadow-inner border-2 ${
            isVictory
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
          }`}
        >
          {isVictory ? '🏆' : '🐶'}
        </div>

        <h2 className="text-2xl font-black text-white mb-1">
          {isVictory ? 'Ultimate Champion!' : 'Puppy Needs a Nap!'}
        </h2>
        <p className={`text-sm font-semibold mb-4 ${isVictory ? 'text-amber-300' : 'text-slate-400'}`}>
          {isVictory
            ? 'You guided your puppy through all five courses—what a ball-chasing champion!'
            : `Great try on Level ${currentLevel}: ${Math.max(0, elapsedSeconds)} seconds survived!`}
        </p>

        {isNewHighScore && (
          <div className="bg-amber-500/20 border border-amber-400/50 rounded-xl px-3 py-1.5 mb-4 inline-flex items-center gap-1.5 text-amber-300 font-bold text-xs">
            <Award className="w-4 h-4 text-amber-400" />
            <span>New High Score!</span>
          </div>
        )}

        {/* Stats card */}
        <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-700/60 mb-6 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              Final Score
            </span>
            <span className="font-mono font-bold text-white">
              {score.toLocaleString()} pts
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Balls Caught
            </span>
            <span className="font-mono font-bold text-amber-300">
              {ballsCaught}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Time Survived</span>
            <span className="font-mono font-bold text-emerald-400">
              {Math.max(0, elapsedSeconds)} sec (Lvl {currentLevel})
            </span>
          </div>

          <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-2">
            <span className="text-slate-400">Best All-Time Score</span>
            <span className="font-mono font-bold text-sky-400">
              {highScore.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 text-base"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{isVictory ? 'Play Again' : 'Try Again'}</span>
          </button>

        </div>
      </div>
    </div>
  );
};
