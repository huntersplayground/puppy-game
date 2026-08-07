import React from 'react';
import { Volume2, VolumeX, Pause, Play, HelpCircle, Trophy, Sparkles, Heart } from 'lucide-react';
import { LevelConfig } from '../types';

interface HeaderBarProps {
  levelConfig: LevelConfig;
  timeRemaining: number;
  score: number;
  ballsCaught: number;
  hearts: number;
  maxHearts: number;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onOpenHelp: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  levelConfig,
  timeRemaining,
  score,
  ballsCaught,
  hearts,
  maxHearts,
  isPaused,
  isMuted,
  onTogglePause,
  onToggleMute,
  onOpenHelp,
}) => {
  const elapsedPercent = Math.min(100, Math.round(((levelConfig.durationSeconds - timeRemaining) / levelConfig.durationSeconds) * 100));

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 border-b border-slate-700/60 shadow-lg select-none z-20">
      {/* Top Row: Level Indicator & Action Buttons */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold px-2.5 py-1 rounded-full text-xs shadow-sm">
          <Trophy className="w-3.5 h-3.5" />
          <span>Level {levelConfig.levelNumber}/5: {levelConfig.name}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-90"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onTogglePause}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-90"
            title={isPaused ? 'Resume Game' : 'Pause Game'}
            aria-label="Toggle Pause"
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-90"
            title="How to Play & About"
            aria-label="Help and About"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Second Row: Paw Hearts (HP), Score & Balls */}
      <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
        {/* Hearts */}
        <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
          <span className="text-slate-400 mr-0.5">HP:</span>
          {Array.from({ length: maxHearts }).map((_, i) => (
            <Heart
              key={i}
              className={`w-3.5 h-3.5 transition-all duration-300 ${
                i < hearts
                  ? 'text-rose-500 fill-rose-500 scale-100'
                  : 'text-slate-600 scale-90'
              }`}
            />
          ))}
        </div>

        {/* Balls Caught */}
        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{ballsCaught} Balls</span>
        </div>

        {/* Score */}
        <div className="font-mono font-bold text-emerald-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
          {score.toLocaleString()} pts
        </div>
      </div>

      {/* Progress bar towards level completion */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-300"
          style={{ width: `${elapsedPercent}%` }}
        />
      </div>
    </div>
  );
};
