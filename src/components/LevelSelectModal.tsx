import React from 'react';
import { X, Trophy, Lock, Play } from 'lucide-react';
import { LEVEL_CONFIGS } from '../lib/levels';

interface LevelSelectModalProps {
  currentLevelNumber: number;
  unlockedLevels: number;
  levelHighScores: Record<number, number>;
  onSelectLevel: (levelNumber: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevelNumber,
  unlockedLevels,
  levelHighScores,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-extrabold text-white">Select Level</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Cards List */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {LEVEL_CONFIGS.map((config) => {
            const isUnlocked = config.levelNumber <= unlockedLevels;
            const isCurrent = config.levelNumber === currentLevelNumber;
            const highScore = levelHighScores[config.levelNumber] || 0;

            return (
              <div
                key={config.levelNumber}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectLevel(config.levelNumber);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                  !isUnlocked
                    ? 'bg-slate-900/60 border-slate-800 opacity-60 cursor-not-allowed'
                    : isCurrent
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-400 shadow-md cursor-pointer'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 cursor-pointer active:scale-[0.98]'
                }`}
              >
                {/* Left icon & details */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-400'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    {isUnlocked ? config.theme.icon : '🔒'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        Level {config.levelNumber}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/40">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-mono">
                      {highScore > 0 && (
                        <span className="text-emerald-400 font-bold">
                          Best: {highScore.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right play / locked status */}
                <div>
                  {!isUnlocked ? (
                    <Lock className="w-5 h-5 text-slate-600" />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Clear a level to unlock the next. All levels can be replayed anytime.
          </p>
        </div>
      </div>
    </div>
  );
};
