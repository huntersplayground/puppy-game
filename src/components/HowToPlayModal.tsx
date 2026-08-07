import React, { useRef } from 'react';
import { X, Smartphone, Keyboard } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
  onDeveloperSkip: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose, onDeveloperSkip }) => {
  const puppyTapCountRef = useRef(0);
  const lastPuppyTapRef = useRef(0);

  const handlePuppyTap = () => {
    const now = Date.now();
    if (now - lastPuppyTapRef.current > 2000) {
      puppyTapCountRef.current = 0;
    }
    lastPuppyTapRef.current = now;
    puppyTapCountRef.current += 1;
    if (puppyTapCountRef.current === 5) {
      puppyTapCountRef.current = 0;
      onDeveloperSkip();
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePuppyTap} className="text-2xl leading-none" aria-label="Puppy">
              🐶
            </button>
            <h2 className="text-lg font-extrabold text-white">How to Play</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-sm text-slate-300">
          {/* Controls */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Controls
            </h3>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">iPhone / Mobile Touch</p>
                  <p className="text-slate-400">
                    Hold the left or right side of the game to steer.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <Keyboard className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">Desktop Keyboard</p>
                  <p className="text-slate-400">
                    Use <span className="text-amber-300 font-mono">← / → Arrow Keys</span> or <span className="text-amber-300 font-mono">A / D</span> to move left and right.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Balls & Items */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Catch and Avoid
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
                <p className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                  <span>🎾</span> Tennis and Rubber Balls
                </p>
                <p className="text-slate-400">+100 pts</p>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
                <p className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                  <span>⭐</span> Golden Ball
                </p>
                <p className="text-slate-400">+250 pts</p>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
                <p className="font-bold text-rose-300 flex items-center gap-1 mb-1">
                  <span>💖</span> Pink Heart Ball
                </p>
                <p className="text-slate-400">Restore 1 paw heart</p>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
                <p className="font-bold text-rose-400 flex items-center gap-1 mb-1">
                  <span>🚧</span> Gate and Obstacles
                </p>
                <p className="text-slate-400">Avoid the dog gate, puddles, hurdles, poles, and spikes</p>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
                <p className="font-bold text-amber-200 flex items-center gap-1 mb-1">
                  <span>🦴</span> Bones
                </p>
                <p className="text-slate-400">Worth +400 pts, but puppy pauses to eat</p>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
                <p className="font-bold text-slate-200 flex items-center gap-1 mb-1">
                  <span>🐈</span> Rival Cat
                </p>
                <p className="text-slate-400">The cat can steal balls and costs 1 paw heart if it bumps puppy</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition active:scale-95 text-sm"
          >
            Let’s Catch Balls
          </button>
        </div>
      </div>
    </div>
  );
};
