import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Trophy, Sparkles, RotateCcw } from 'lucide-react';
import { LevelConfig } from '../types';

interface LevelClearModalProps {
  levelConfig: LevelConfig;
  score: number;
  ballsCaught: number;
  onNextLevel: () => void;
  onReplayLevel: () => void;
}

export const LevelClearModal: React.FC<LevelClearModalProps> = ({
  levelConfig,
  score,
  ballsCaught,
  onNextLevel,
  onReplayLevel,
}) => {
  useEffect(() => {
    // Launch celebratory confetti when modal appears
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-40 select-none">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner">
          {levelConfig.theme.icon}
        </div>

        <h2 className="text-2xl font-black text-white mb-1">
          Level {levelConfig.levelNumber} Cleared!
        </h2>
        <p className="text-emerald-300 text-sm font-semibold mb-4">
          {levelConfig.name} Completed!
        </p>

        {/* Stats card */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-700/60 mb-6 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              Level Score
            </span>
            <span className="font-mono font-bold text-white">
              +{score.toLocaleString()} pts
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Balls Caught
            </span>
            <span className="font-mono font-bold text-amber-300">
              {ballsCaught} balls
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Course Time</span>
            <span className="font-mono font-bold text-emerald-400">
              {levelConfig.durationSeconds} sec complete
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onNextLevel}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 text-base"
          >
            <span>Next Level</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onReplayLevel}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Replay Level {levelConfig.levelNumber}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
