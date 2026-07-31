import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Smartphone, SmartphoneCharging } from 'lucide-react';
import { sound } from '../lib/sound';

interface TouchControlsProps {
  onMoveLeft: (pressed: boolean) => void;
  onMoveRight: (pressed: boolean) => void;
  onTiltToggle: (enabled: boolean) => void;
  tiltEnabled: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onTiltToggle,
  tiltEnabled,
}) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const [hasOrientationPermission, setHasOrientationPermission] = useState<boolean | null>(null);

  // Handle device orientation gyro for iPhone
  useEffect(() => {
    if (!tiltEnabled) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma; // Left-to-Right tilt in degrees (-90 to 90)
      if (gamma === null) return;

      const threshold = 5; // degrees tilt deadzone
      if (gamma < -threshold) {
        onMoveLeft(true);
        onMoveRight(false);
        setLeftPressed(true);
        setRightPressed(false);
      } else if (gamma > threshold) {
        onMoveRight(true);
        onMoveLeft(false);
        setRightPressed(true);
        setLeftPressed(false);
      } else {
        onMoveLeft(false);
        onMoveRight(false);
        setLeftPressed(false);
        setRightPressed(false);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      onMoveLeft(false);
      onMoveRight(false);
    };
  }, [tiltEnabled, onMoveLeft, onMoveRight]);

  const requestGyroPermission = async () => {
    // iOS 13+ requires explicit permission for DeviceOrientationEvent
    sound.unlock();
    const DOEvent = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DOEvent?.requestPermission === 'function') {
      try {
        const response = await DOEvent.requestPermission();
        if (response === 'granted') {
          setHasOrientationPermission(true);
          onTiltToggle(!tiltEnabled);
        } else {
          setHasOrientationPermission(false);
          alert('Gyroscope permission was denied. Please use the on-screen buttons to control your puppy!');
        }
      } catch (err) {
        console.warn('Gyroscope permission error:', err);
      }
    } else {
      // Standard browsers without permission prompt
      onTiltToggle(!tiltEnabled);
    }
  };

  const handleLeftStart = (e: React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    sound.unlock();
    if (tiltEnabled) return;
    setLeftPressed(true);
    onMoveLeft(true);
  };

  const handleLeftEnd = (e: React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    if (tiltEnabled) return;
    setLeftPressed(false);
    onMoveLeft(false);
  };

  const handleRightStart = (e: React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    sound.unlock();
    if (tiltEnabled) return;
    setRightPressed(true);
    onMoveRight(true);
  };

  const handleRightEnd = (e: React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    if (tiltEnabled) return;
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
        onTouchStart={handleLeftStart}
        onTouchEnd={handleLeftEnd}
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

      {/* Center Gyroscope Tilt Toggle for iPhone */}
      <button
        type="button"
        onClick={requestGyroPermission}
        className={`px-3 h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center text-xs font-semibold border transition shadow-sm ${
          tiltEnabled
            ? 'bg-emerald-500 text-slate-950 border-emerald-300'
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
        }`}
        title={tiltEnabled ? 'Tilt control ON (iPhone Gyro)' : 'Enable Tilt Control (iPhone Gyro)'}
      >
        {tiltEnabled ? (
          <SmartphoneCharging className="w-6 h-6 mb-1 text-slate-950" />
        ) : (
          <Smartphone className="w-6 h-6 mb-1 text-slate-400" />
        )}
        <span className="text-[10px] uppercase font-mono tracking-wider">
          {tiltEnabled ? 'Tilt: ON' : 'Tilt: OFF'}
        </span>
      </button>

      {/* Right Touch Button */}
      <button
        type="button"
        onPointerDown={handleRightStart}
        onPointerUp={handleRightEnd}
        onPointerLeave={handleRightEnd}
        onPointerCancel={handleRightEnd}
        onTouchStart={handleRightStart}
        onTouchEnd={handleRightEnd}
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
