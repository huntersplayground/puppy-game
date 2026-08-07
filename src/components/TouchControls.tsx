import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { sound } from '../lib/sound';

interface TouchControlsProps {
  onMoveLeft: (pressed: boolean) => void;
  onMoveRight: (pressed: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveLeft,
  onMoveRight,
}) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  const handleLeftStart = (e: React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    sound.unlock();
    setLeftPressed(true);
    onMoveLeft(true);
  };

  const handleLeftEnd = (e: React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    setLeftPressed(false);
    onMoveLeft(false);
  };

  const handleRightStart = (e: React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    sound.unlock();
    setRightPressed(true);
    onMoveRight(true);
  };

  const handleRightEnd = (e: React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    setRightPressed(false);
    onMoveRight(false);
  };

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-800 p-3 flex items-center justify-between gap-3 select-none touch-none z-20">
      {/* Left Touch Button */}
      <button
        type="button"
        onPointerDown={handleLeftStart}
        onPointerUp={handleLeftEnd}
        onPointerLeave={handleLeftEnd}
        onPointerCancel={handleLeftEnd}
        className={`flex-1 h-16 sm:h-20 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-all duration-100 shadow-md border-2 ${
          leftPressed
            ? 'bg-amber-500 text-slate-950 border-amber-300 scale-95 shadow-inner'
            : 'bg-slate-800/90 text-amber-300 border-slate-700/80 hover:bg-slate-700 active:scale-95'
        }`}
        aria-label="Move Left"
      >
        <ArrowLeft className={`w-8 h-8 ${leftPressed ? 'scale-110' : ''}`} />
        <span className="hidden xs:inline">LEFT</span>
      </button>

      {/* Right Touch Button */}
      <button
        type="button"
        onPointerDown={handleRightStart}
        onPointerUp={handleRightEnd}
        onPointerLeave={handleRightEnd}
        onPointerCancel={handleRightEnd}
        className={`flex-1 h-16 sm:h-20 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-all duration-100 shadow-md border-2 ${
          rightPressed
            ? 'bg-amber-500 text-slate-950 border-amber-300 scale-95 shadow-inner'
            : 'bg-slate-800/90 text-amber-300 border-slate-700/80 hover:bg-slate-700 active:scale-95'
        }`}
        aria-label="Move Right"
      >
        <span className="hidden xs:inline">RIGHT</span>
        <ArrowRight className={`w-8 h-8 ${rightPressed ? 'scale-110' : ''}`} />
      </button>
    </div>
  );
};
