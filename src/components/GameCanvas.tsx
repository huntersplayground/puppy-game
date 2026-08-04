import React, { useEffect, useRef, useCallback } from 'react';
import {
  DogPlayer,
  Platform,
  Particle,
  LevelConfig,
  PlatformType,
} from '../types';
import { sound } from '../lib/sound';

interface GameCanvasProps {
  levelConfig: LevelConfig;
  isPaused: boolean;
  moveLeftPressed: boolean;
  moveRightPressed: boolean;
  onFloorChange: (floor: number) => void;
  onScoreChange: (deltaScore: number) => void;
  onBallCaught: () => void;
  onHeartChange: (hearts: number) => void;
  onLevelClear: () => void;
  onGameOver: () => void;
  hearts: number;
  maxHearts: number;
}

const VIRTUAL_WIDTH = 380;
const VIRTUAL_HEIGHT = 670;
const GRAVITY = 0.45;
const MAX_FALL_SPEED = 9.5;
const MOVE_SPEED = 5.2;
const CEILING_DANGER_Y = 22;
const GATE_WARNING_Y = 105;
const SPEED_PER_FLOOR = 0.16;
const MAX_SCROLL_SPEED = 2.42;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelConfig,
  isPaused,
  moveLeftPressed,
  moveRightPressed,
  onFloorChange,
  onScoreChange,
  onBallCaught,
  onHeartChange,
  onLevelClear,
  onGameOver,
  hearts,
  maxHearts,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // References for mutable game state in 60fps loop
  const playerRef = useRef<DogPlayer>({
    x: VIRTUAL_WIDTH / 2 - 18,
    y: 120,
    width: 36,
    height: 32,
    vx: 0,
    vy: 0,
    isGrounded: false,
    currentPlatformId: null,
    facing: 'right',
    state: 'idle',
    stateTimer: 0,
    invincibleTimer: 0,
    hearts: hearts,
    maxHearts: maxHearts,
    tailAngle: 0,
    earAngle: 0,
  });

  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floorCounterRef = useRef<number>(0);
  const distanceTravelledRef = useRef<number>(0);
  const lastSpawnYRef = useRef<number>(VIRTUAL_HEIGHT);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const isPausedRef = useRef(isPaused);
  const moveLeftPressedRef = useRef(moveLeftPressed);
  const moveRightPressedRef = useRef(moveRightPressed);
  const heartsRef = useRef(hearts);
  const hasTriggeredClearRef = useRef(false);
  const introTimerRef = useRef(220);
  const gateRattleRef = useRef(0);

  // Sync prop changes to refs
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    moveLeftPressedRef.current = moveLeftPressed;
  }, [moveLeftPressed]);

  useEffect(() => {
    moveRightPressedRef.current = moveRightPressed;
  }, [moveRightPressed]);

  useEffect(() => {
    heartsRef.current = hearts;
    playerRef.current.hearts = hearts;
  }, [hearts]);

  // Helper to generate a new platform
  const generatePlatform = useCallback(
    (y: number, isStarting: boolean = false): Platform => {
      const id = 'plat_' + Math.random().toString(36).substring(2, 9);
      const difficulty = Math.min(
        1,
        floorCounterRef.current / Math.max(1, levelConfig.targetFloors - 1)
      );
      const width = isStarting
        ? 140
        : Math.floor(
            levelConfig.platformWidthMin - difficulty * 20 +
              Math.random() * (levelConfig.platformWidthMax - levelConfig.platformWidthMin)
          );
      const x = Math.floor(16 + Math.random() * (VIRTUAL_WIDTH - width - 32));

      let type: PlatformType = 'normal';
      if (!isStarting) {
        const r = Math.random();
        const conveyorLeft = levelConfig.probabilities.conveyorLeft + difficulty * 0.06;
        const conveyorRight = levelConfig.probabilities.conveyorRight + difficulty * 0.06;
        const bounce = levelConfig.probabilities.bounce;
        const fragile = levelConfig.probabilities.fragile + difficulty * 0.08;
        const obstacle = levelConfig.probabilities.obstacle + difficulty * 0.14;
        const normal = Math.max(0.2, 1 - conveyorLeft - conveyorRight - bounce - fragile - obstacle);

        let accum = normal;
        if (r < accum) type = 'normal';
        else if (r < (accum += conveyorLeft)) type = 'conveyor-left';
        else if (r < (accum += conveyorRight)) type = 'conveyor-right';
        else if (r < (accum += bounce)) type = 'bounce';
        else if (r < (accum += fragile)) type = 'fragile';
        else if (r < (accum += obstacle)) type = 'obstacle';
      }

      // Ball spawn logic
      const hasBall =
        !isStarting && Math.random() < levelConfig.ballSpawnRate + difficulty * 0.12 && type !== 'fragile';
      let ballType: 'tennis' | 'rubber' | 'golden' | 'heart' = 'tennis';
      if (hasBall) {
        const rBall = Math.random();
        if (rBall < 0.65) ballType = 'tennis';
        else if (rBall < 0.85) ballType = 'rubber';
        else if (rBall < 0.95) ballType = 'golden';
        else ballType = 'heart';
      }

      return {
        id,
        x,
        y,
        width,
        height: 16,
        type,
        conveyorSpeed:
          type === 'conveyor-left' ? -2.2 : type === 'conveyor-right' ? 2.2 : 0,
        fragileTimer: type === 'fragile' ? 36 : undefined,
        isBroken: false,
        bounceOffset: 0,
        obstacleType: type === 'obstacle'
          ? (difficulty > 0.45
              ? (['puddle', 'kitty', 'hurdle', 'weave-poles'] as const)[Math.floor(Math.random() * 4)]
              : (['puddle', 'kitty'] as const)[Math.floor(Math.random() * 2)])
          : undefined,
        obstacleX: type === 'obstacle' ? width / 2 - 12 : undefined,
        obstacleWidth: 24,
        hasBall,
        ballType,
        ballX: width / 2,
        ballY: -14,
        ballCaught: false,
        ballBounceY: 0,
      };
    },
    [levelConfig]
  );

  // Initialize level platforms on mount or level change
  const initLevel = useCallback(() => {
    hasTriggeredClearRef.current = false;
    gateRattleRef.current = 0;
    floorCounterRef.current = 0;
    distanceTravelledRef.current = 0;
    onFloorChange(0);
    introTimerRef.current = 180; // 3 seconds preparation countdown before game starts

    const initialPlats: Platform[] = [];
    let currentY = 130;

    // First platform right under puppy
    const firstPlat = generatePlatform(currentY, true);
    firstPlat.x = VIRTUAL_WIDTH / 2 - firstPlat.width / 2;
    initialPlats.push(firstPlat);

    // Populate down the screen
    while (currentY < VIRTUAL_HEIGHT + 100) {
      const gap =
        levelConfig.gapYMin +
        Math.random() * (levelConfig.gapYMax - levelConfig.gapYMin);
      currentY += gap;
      initialPlats.push(generatePlatform(currentY));
    }

    platformsRef.current = initialPlats;
    lastSpawnYRef.current = currentY;

    // Reset player position safely on first platform
    playerRef.current = {
      x: firstPlat.x + firstPlat.width / 2 - 18,
      y: firstPlat.y - 32,
      width: 36,
      height: 32,
      vx: 0,
      vy: 0,
      isGrounded: true,
      currentPlatformId: firstPlat.id,
      facing: 'right',
      state: 'idle',
      stateTimer: 0,
      invincibleTimer: 0,
      hearts: heartsRef.current,
      maxHearts: maxHearts,
      tailAngle: 0,
      earAngle: 0,
    };

    particlesRef.current = [];
  }, [generatePlatform, levelConfig, maxHearts, onFloorChange]);

  useEffect(() => {
    initLevel();
  }, [initLevel, levelConfig.levelNumber]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    const handleWindowBlur = () => {
      keysRef.current = {};
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Spawn celebration particles
  const spawnParticles = (
    x: number,
    y: number,
    color: string,
    count: number = 8,
    type: 'sparkle' | 'heart' | 'dust' | 'text' = 'sparkle',
    text?: string
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 3;
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'text' ? 1.5 : 0),
        size: type === 'text' ? 14 : 4 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: type === 'text' ? 45 : 25 + Math.random() * 15,
        type,
        text,
      });
    }
  };

  // Main game update & rendering loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const updateGame = () => {
      if (isPausedRef.current || hasTriggeredClearRef.current) return;

      if (introTimerRef.current > 0) {
        introTimerRef.current--;
        return; // Pause all game movement and scrolling while the preparation banner is shown
      }

      const player = playerRef.current;
      const platforms = platformsRef.current;
      const scrollSpeed = Math.min(
        MAX_SCROLL_SPEED,
        levelConfig.scrollSpeed + floorCounterRef.current * SPEED_PER_FLOOR
      );

      // 1. Check controls (Touch buttons + Keyboard arrows)
      const moveLeft =
        moveLeftPressedRef.current ||
        keysRef.current['arrowleft'] ||
        keysRef.current['a'] ||
        false;
      const moveRight =
        moveRightPressedRef.current ||
        keysRef.current['arrowright'] ||
        keysRef.current['d'] ||
        false;

      if (moveLeft && !moveRight) {
        player.vx = -MOVE_SPEED;
        player.facing = 'left';
        player.state = player.isGrounded ? 'run' : 'fall';
      } else if (moveRight && !moveLeft) {
        player.vx = MOVE_SPEED;
        player.facing = 'right';
        player.state = player.isGrounded ? 'run' : 'fall';
      } else {
        player.vx = 0;
        if (player.isGrounded && player.state !== 'happy') {
          player.state = 'idle';
        }
      }

      // Update tail & ears animation
      player.stateTimer++;
      player.tailAngle = Math.sin(player.stateTimer * 0.2) * 0.4;
      player.earAngle =
        player.state === 'run'
          ? Math.sin(player.stateTimer * 0.3) * 0.25
          : 0;

      if (player.invincibleTimer > 0) {
        player.invincibleTimer--;
      }

      // 2. Horizontal movement & screen wrapping / borders
      player.x += player.vx;
      if (player.x < 12) player.x = 12;
      if (player.x + player.width > VIRTUAL_WIDTH - 12) {
        player.x = VIRTUAL_WIDTH - 12 - player.width;
      }

      // 3. Apply gravity if not on a platform
      if (!player.isGrounded) {
        player.vy += GRAVITY;
        if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;
      }

      player.y += player.vy;

      if (player.y < GATE_WARNING_Y) {
        gateRattleRef.current = Math.min(1, gateRattleRef.current + 0.18);
      } else {
        gateRattleRef.current = Math.max(0, gateRattleRef.current - 0.08);
      }

      // 4. Scroll platforms UP
      let lowestPlatformY = 0;
      for (let i = platforms.length - 1; i >= 0; i--) {
        const p = platforms[i];
        p.y -= scrollSpeed;
        if (p.y > lowestPlatformY) lowestPlatformY = p.y;

        // Animate bounce platform flex
        if (p.bounceOffset && p.bounceOffset > 0) {
          p.bounceOffset *= 0.8;
          if (p.bounceOffset < 0.2) p.bounceOffset = 0;
        }

        // Animate ball bounce
        if (p.hasBall && !p.ballCaught) {
          p.ballBounceY = Math.sin(player.stateTimer * 0.12 + p.x) * 4;
        }

        // Fragile cloud countdown if dog is standing on it
        if (p.type === 'fragile' && player.currentPlatformId === p.id) {
          if (p.fragileTimer !== undefined) {
            p.fragileTimer--;
            if (p.fragileTimer <= 0) {
              p.isBroken = true;
              player.isGrounded = false;
              player.currentPlatformId = null;
              sound.ouch();
              spawnParticles(
                p.x + p.width / 2,
                p.y,
                levelConfig.theme.cloudColor,
                12,
                'dust'
              );
            }
          }
        }

        // Check if dog catches ball on this platform
        if (p.hasBall && !p.ballCaught && !p.isBroken) {
          const ballAbsX = p.x + (p.ballX || 0);
          const ballAbsY = p.y + (p.ballY || 0) + (p.ballBounceY || 0);
          const dist = Math.hypot(
            player.x + player.width / 2 - ballAbsX,
            player.y + player.height / 2 - ballAbsY
          );
          if (dist < 32) {
            p.ballCaught = true;
            player.state = 'happy';
            player.stateTimer = 0;

            let pts = 100;
            if (p.ballType === 'golden') pts = 250;
            else if (p.ballType === 'heart') {
              pts = 100;
              if (player.hearts < maxHearts) {
                const newHearts = player.hearts + 1;
                player.hearts = newHearts;
                onHeartChange(newHearts);
              }
            }

            sound.catchBall(p.ballType);
            onScoreChange(pts);
            onBallCaught();
            spawnParticles(
              ballAbsX,
              ballAbsY,
              p.ballType === 'golden'
                ? '#f59e0b'
                : p.ballType === 'heart'
                ? '#ec4899'
                : '#10b981',
              12,
              p.ballType === 'heart' ? 'heart' : 'sparkle'
            );
            spawnParticles(
              ballAbsX,
              ballAbsY - 10,
              '#ffffff',
              1,
              'text',
              `+${pts}`
            );
          }
        }

        // Check obstacle collision
        if (p.type === 'obstacle' && player.invincibleTimer === 0 && !p.isBroken) {
          const obsX = p.x + (p.obstacleX || 0);
          const obsY = p.y - 12;
          const dist = Math.hypot(
            player.x + player.width / 2 - (obsX + 12),
            player.y + player.height - (obsY + 8)
          );
          if (dist < 22) {
            sound.ouch();
            player.invincibleTimer = 45; // ~0.75s invincibility
            player.vy = -6;
            const newHearts = Math.max(0, player.hearts - 1);
            player.hearts = newHearts;
            onHeartChange(newHearts);
            spawnParticles(
              player.x + player.width / 2,
              player.y,
              '#f43f5e',
              10,
              'text',
              '-1 HP!'
            );
            if (newHearts === 0) {
              sound.gameOver();
              onGameOver();
              return;
            }
          }
        }

        // Remove platforms that scrolled off top
        if (p.y < -30) {
          if (player.currentPlatformId === p.id) {
            player.currentPlatformId = null;
            player.isGrounded = false;
          }
          platforms.splice(i, 1);
        }
      }

      // 5. Spawn new platforms at bottom
      distanceTravelledRef.current += scrollSpeed;
      if (distanceTravelledRef.current >= 80) {
        distanceTravelledRef.current = 0;
        floorCounterRef.current += 1;
        onFloorChange(floorCounterRef.current);
        onScoreChange(5); // +5 points per floor descended!

        // Check if level cleared!
        if (floorCounterRef.current >= levelConfig.targetFloors && !hasTriggeredClearRef.current) {
          hasTriggeredClearRef.current = true;
          sound.levelClear();
          onLevelClear();
          return;
        }

        const gap =
          levelConfig.gapYMin +
          Math.random() * (levelConfig.gapYMax - levelConfig.gapYMin);
        const newY = Math.max(VIRTUAL_HEIGHT + 20, lowestPlatformY + gap);
        platforms.push(generatePlatform(newY));
      }

      // 6. Platform collision detection (landing on platform from above)
      if (player.vy >= 0) {
        let landed = false;
        for (const p of platforms) {
          if (p.isBroken) continue;
          const prevY = player.y - player.vy;
          const isAbove = prevY + player.height <= p.y + 8;
          const isOverlappingX =
            player.x + player.width - 6 > p.x &&
            player.x + 6 < p.x + p.width;

          if (isAbove && isOverlappingX && player.y + player.height >= p.y - 4 && player.y + player.height <= p.y + 16) {
            player.y = p.y - player.height;
            player.vy = -scrollSpeed; // stay glued to platform rising
            player.isGrounded = true;
            player.currentPlatformId = p.id;
            landed = true;

            // Apply conveyor movement
            if (p.conveyorSpeed) {
              player.x += p.conveyorSpeed;
            }

            // Apply Spring Bounce platform!
            if (p.type === 'bounce') {
              p.bounceOffset = 8;
              player.vy = -12.5; // Big jump up!
              player.isGrounded = false;
              player.currentPlatformId = null;
              sound.bounce(true);
              spawnParticles(
                player.x + player.width / 2,
                p.y,
                '#38bdf8',
                10,
                'sparkle'
              );
            }
            break;
          }
        }

        if (!landed) {
          if (player.isGrounded) {
            // Dog stepped off the edge of a platform
            player.isGrounded = false;
            player.currentPlatformId = null;
            player.vy = 1;
          }
        }
      } else {
        player.isGrounded = false;
      }

      // 7. Check Ceiling Danger (top of screen soft rain cloud bumper)
      if (player.y < CEILING_DANGER_Y && player.invincibleTimer === 0) {
        sound.ouch();
        player.invincibleTimer = 50;
        player.vy = 4; // bump down
        const newHearts = Math.max(0, player.hearts - 1);
        player.hearts = newHearts;
        onHeartChange(newHearts);
        spawnParticles(
          player.x + player.width / 2,
          player.y + 10,
          '#f43f5e',
          8,
          'text',
          'STOP GATE! -1 HP'
        );
        if (newHearts === 0) {
          sound.gameOver();
          onGameOver();
          return;
        }
      }

      // 8. Check Bottom Fall (off the bottom of the shaft!)
      if (player.y > VIRTUAL_HEIGHT + 20) {
        sound.ouch();
        const newHearts = Math.max(0, player.hearts - 1);
        player.hearts = newHearts;
        onHeartChange(newHearts);

        if (newHearts === 0) {
          sound.gameOver();
          onGameOver();
          return;
        }

        // Forgiving rescue: place on highest safe platform
        let bestPlat: Platform | null = null;
        for (const p of platforms) {
          if (p.isBroken || p.y < 80 || p.y > VIRTUAL_HEIGHT - 60) continue;
          if (!bestPlat || p.y < bestPlat.y) {
            bestPlat = p;
          }
        }

        if (bestPlat) {
          player.x = bestPlat.x + bestPlat.width / 2 - player.width / 2;
          player.y = bestPlat.y - player.height;
          player.vy = -scrollSpeed;
          player.isGrounded = true;
          player.currentPlatformId = bestPlat.id;
          player.invincibleTimer = 60;
          spawnParticles(
            player.x + player.width / 2,
            player.y,
            '#10b981',
            12,
            'text',
            'Rescued! -1 HP (Stay on Platforms!)'
          );
        } else {
          // If no platform yet, place in middle
          player.x = VIRTUAL_WIDTH / 2 - 18;
          player.y = 100;
          player.vy = 0;
          player.invincibleTimer = 60;
        }
      }

      // 9. Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = 1 - pt.life / pt.maxLife;
        if (pt.life >= pt.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }
    };

    // Render loop
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const player = playerRef.current;
      const platforms = platformsRef.current;

      // 1. Clear background with level theme gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
      gradient.addColorStop(0, levelConfig.theme.bgTop);
      gradient.addColorStop(1, levelConfig.theme.bgBottom);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      // 2. Draw Shaft Side Walls (with subtle brick/wood pattern)
      ctx.fillStyle = levelConfig.theme.wallColor;
      ctx.fillRect(0, 0, 10, VIRTUAL_HEIGHT);
      ctx.fillRect(VIRTUAL_WIDTH - 10, 0, 10, VIRTUAL_HEIGHT);

      // Decorative wall rivets
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (let y = 10; y < VIRTUAL_HEIGHT; y += 40) {
        ctx.fillRect(2, y, 6, 6);
        ctx.fillRect(VIRTUAL_WIDTH - 8, y, 6, 6);
      }

      // 3. Draw the rattling dog-agility STOP gate at the danger boundary.
      const gateShake = gateRattleRef.current * Math.sin(player.stateTimer * 0.9) * 2.5;
      ctx.save();
      ctx.translate(gateShake, 0);
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, 12, 8, 32);
      ctx.fillRect(VIRTUAL_WIDTH - 18, 12, 8, 32);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(14, 20, VIRTUAL_WIDTH - 28, 12);
      ctx.fillStyle = '#1e293b';
      for (let x = 18; x < VIRTUAL_WIDTH - 18; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x + 12, 20);
        ctx.lineTo(x - 2, 32);
        ctx.lineTo(x - 14, 32);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = Math.PI / 8 + (Math.PI / 4) * i;
        const x = VIRTUAL_WIDTH - 40 + Math.cos(angle) * 18;
        const y = 52 + Math.sin(angle) * 18;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STOP', VIRTUAL_WIDTH - 40, 55);
      if (gateRattleRef.current > 0.1) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('RATTLE!', VIRTUAL_WIDTH / 2, 46);
      }
      ctx.restore();

      // 4. Draw Platforms
      for (const p of platforms) {
        if (p.isBroken) continue;

        ctx.save();
        // Platform main body
        if (p.type === 'fragile') {
          // Cloud leaf style
          ctx.fillStyle = levelConfig.theme.cloudColor;
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.width, p.height, 8);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (p.type === 'bounce') {
          // Trampoline spring
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(
            p.x,
            p.y + (p.bounceOffset || 0),
            p.width,
            p.height - (p.bounceOffset || 0)
          );
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(p.x + 4, p.y + (p.bounceOffset || 0), p.width - 8, 4);
        } else if (p.type === 'conveyor-left' || p.type === 'conveyor-right') {
          // Conveyor belt with directional arrows
          ctx.fillStyle = '#475569';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = '#94a3b8';
          const arrowDir = p.type === 'conveyor-left' ? -1 : 1;
          const offset = (performance.now() * 0.04 * arrowDir) % 20;
          for (let x = p.x + 8; x < p.x + p.width - 12; x += 24) {
            const arrowX =
              p.x + ((x - p.x + offset + p.width) % (p.width - 16));
            ctx.fillText(p.type === 'conveyor-left' ? '«' : '»', arrowX, p.y + 13);
          }
        } else {
          // Normal wood/grass platform
          ctx.fillStyle = levelConfig.theme.platformColor;
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.width, p.height, 4);
          ctx.fill();
          ctx.strokeStyle = levelConfig.theme.platformBorder;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Green grass fringe on top
          ctx.fillStyle = levelConfig.theme.accentColor;
          ctx.fillRect(p.x, p.y, p.width, 3);
        }

        // Draw Obstacles (Mud Puddle or Grumpy Kitty)
        if (p.type === 'obstacle' && p.obstacleType) {
          const obsX = p.x + (p.obstacleX || 0);
          const obsY = p.y - 14;
          if (p.obstacleType === 'puddle') {
            // Mud puddle
            ctx.fillStyle = '#78350f'; // brown
            ctx.beginPath();
            ctx.ellipse(
              obsX + 12,
              p.y - 2,
              12,
              5,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.fillStyle = '#92400e';
            ctx.beginPath();
            ctx.arc(obsX + 8, p.y - 5, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.obstacleType === 'kitty') {
            // Grumpy Kitty obstacle
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(obsX + 12, obsY + 6, 8, 0, Math.PI * 2);
            ctx.fill();
            // Kitty ears
            ctx.beginPath();
            ctx.moveTo(obsX + 6, obsY + 2);
            ctx.lineTo(obsX + 4, obsY - 4);
            ctx.lineTo(obsX + 10, obsY);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(obsX + 18, obsY + 2);
            ctx.lineTo(obsX + 20, obsY - 4);
            ctx.lineTo(obsX + 14, obsY);
            ctx.fill();
            // Grumpy eyes
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(obsX + 8, obsY + 4, 3, 2);
            ctx.fillRect(obsX + 14, obsY + 4, 3, 2);
          } else if (p.obstacleType === 'hurdle') {
            // Dog agility hurdle
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(obsX + 2, p.y + 2);
            ctx.lineTo(obsX + 2, p.y - 15);
            ctx.moveTo(obsX + 28, p.y + 2);
            ctx.lineTo(obsX + 28, p.y - 15);
            ctx.moveTo(obsX + 2, p.y - 9);
            ctx.lineTo(obsX + 28, p.y - 9);
            ctx.stroke();
          } else if (p.obstacleType === 'weave-poles') {
            // Blue-and-white agility weave poles
            for (let pole = 0; pole < 3; pole++) {
              const poleX = obsX + 3 + pole * 10;
              ctx.fillStyle = '#e2e8f0';
              ctx.fillRect(poleX, p.y - 17, 4, 18);
              ctx.fillStyle = '#3b82f6';
              ctx.fillRect(poleX, p.y - 14, 4, 5);
              ctx.fillRect(poleX, p.y - 4, 4, 5);
            }
          }
        }

        // Draw Ball on Platform
        if (p.hasBall && !p.ballCaught) {
          const bx = p.x + (p.ballX || 0);
          const by = p.y + (p.ballY || 0) + (p.ballBounceY || 0);

          ctx.save();
          if (p.ballType === 'golden') {
            // Golden Trophy ball
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(bx, by, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Star sparkle mark
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(bx - 2, by - 5, 4, 2);
          } else if (p.ballType === 'heart') {
            // Pink heart ball
            ctx.fillStyle = '#ec4899';
            ctx.font = '14px sans-serif';
            ctx.fillText('💖', bx - 7, by + 5);
          } else if (p.ballType === 'rubber') {
            // Red bouncy ball
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(bx, by, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(bx - 2, by - 2, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Classic yellow tennis ball
            ctx.fillStyle = '#a3e635'; // lime tennis yellow
            ctx.beginPath();
            ctx.arc(bx, by, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(bx, by, 6, 0.2, 1.8);
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.restore();
      }

      // 5. Draw Adorable Puppy Player!
      ctx.save();
      // Flashing invincibility effect
      if (player.invincibleTimer % 4 > 1) {
        ctx.globalAlpha = 0.5;
      }

      const cx = player.x + player.width / 2;
      const cy = player.y + player.height / 2;

      ctx.translate(cx, cy);
      if (player.facing === 'left') {
        ctx.scale(-1, 1);
      }

      // Puppy tail (wags!)
      ctx.save();
      ctx.rotate(player.tailAngle);
      ctx.fillStyle = '#d97706'; // warm amber orange
      ctx.beginPath();
      ctx.ellipse(-14, 2, 8, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Puppy body
      ctx.fillStyle = '#f59e0b'; // Shiba amber
      ctx.beginPath();
      ctx.roundRect(-12, -8, 24, 18, 6);
      ctx.fill();

      // Puppy belly cream color
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(0, 3, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Puppy paws / legs (step when running)
      ctx.fillStyle = '#d97706';
      const legStep =
        player.state === 'run' ? Math.sin(player.stateTimer * 0.4) * 4 : 0;
      ctx.fillRect(-8, 8, 5, 6 - legStep); // Back paw
      ctx.fillRect(4, 8, 5, 6 + legStep); // Front paw

      // Puppy Head
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(6, -10, 10, 0, Math.PI * 2);
      ctx.fill();

      // Puppy Snout cream
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(10, -8, 6, 0, Math.PI * 2);
      ctx.fill();

      // Cute black nose
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(14, -9, 2, 0, Math.PI * 2);
      ctx.fill();

      // Flop Ear
      ctx.save();
      ctx.rotate(player.earAngle);
      ctx.fillStyle = '#b45309'; // darker ear brown
      ctx.beginPath();
      ctx.moveTo(3, -17);
      ctx.lineTo(8, -22);
      ctx.lineTo(11, -15);
      ctx.fill();
      ctx.restore();

      // Eye expression
      ctx.fillStyle = '#1e293b';
      if (player.state === 'happy') {
        // Happy arch eye ^
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(8, -11, 2.5, Math.PI, 0);
        ctx.stroke();
      } else if (player.invincibleTimer > 0) {
        // Ouch X eye
        ctx.font = '10px sans-serif';
        ctx.fillText('x', 6, -9);
      } else {
        // Normal shiny black eye
        ctx.beginPath();
        ctx.arc(8, -11, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(7.5, -12, 1, 1);
      }

      ctx.restore();

      // 6. Draw Particles (sparkles, score texts, hearts)
      for (const pt of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        if (pt.type === 'text' && pt.text) {
          ctx.font = 'bold 13px font-mono, sans-serif';
          ctx.fillStyle = pt.color;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.strokeText(pt.text, pt.x, pt.y);
          ctx.fillText(pt.text, pt.x, pt.y);
        } else if (pt.type === 'heart') {
          ctx.font = '14px sans-serif';
          ctx.fillText('💖', pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. Smooth non-flashing Level Intro Overlay (Preparation Banner)
      if (introTimerRef.current > 0) {
        ctx.save();
        const alpha = Math.min(1, introTimerRef.current / 30);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        ctx.beginPath();
        ctx.roundRect(20, VIRTUAL_HEIGHT / 2 - 68, VIRTUAL_WIDTH - 40, 136, 16);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          '10-Floor Challenge',
          VIRTUAL_WIDTH / 2,
          VIRTUAL_HEIGHT / 2 - 34
        );

        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(
          'Move left & right to catch balls',
          VIRTUAL_WIDTH / 2,
          VIRTUAL_HEIGHT / 2 - 8
        );

        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(
          'Every floor gets faster—stay below',
          VIRTUAL_WIDTH / 2,
          VIRTUAL_HEIGHT / 2 + 14
        );
        ctx.fillText(
          'the STOP gate and chase the balls!',
          VIRTUAL_WIDTH / 2,
          VIRTUAL_HEIGHT / 2 + 32
        );

        const secondsLeft = Math.ceil(introTimerRef.current / 60);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(
          `Game starting in ${secondsLeft}...`,
          VIRTUAL_WIDTH / 2,
          VIRTUAL_HEIGHT / 2 + 54
        );
        ctx.restore();
      }

      // 8. Draw compact floor and speed progress below the STOP gate.
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.roundRect(VIRTUAL_WIDTH / 2 - 85, 58, 170, 20, 10);
      ctx.fill();

      const progressRatio = Math.min(1, floorCounterRef.current / levelConfig.targetFloors);
      ctx.fillStyle = '#10b981'; // Emerald green progress fill
      ctx.beginPath();
      ctx.roundRect(VIRTUAL_WIDTH / 2 - 83, 60, 166 * progressRatio, 16, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const activeSpeed = Math.min(
        MAX_SCROLL_SPEED,
        levelConfig.scrollSpeed + floorCounterRef.current * SPEED_PER_FLOOR
      );
      ctx.fillText(
        `FLOOR ${floorCounterRef.current}/${levelConfig.targetFloors} • SPEED ${activeSpeed.toFixed(2)}`,
        VIRTUAL_WIDTH / 2,
        72
      );
      ctx.restore();
    };

    // Frame runner
    const loop = (timestamp: number) => {
      const dt = timestamp - lastTime;
      if (dt > 14) {
        updateGame();
        render();
        lastTime = timestamp;
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    generatePlatform,
    levelConfig,
    maxHearts,
    onBallCaught,
    onFloorChange,
    onGameOver,
    onHeartChange,
    onLevelClear,
    onScoreChange,
  ]);

  // Adjust canvas visual scale for high-DPI iPhone screens
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = VIRTUAL_WIDTH * dpr;
      canvas.height = VIRTUAL_HEIGHT * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full flex-1 flex items-center justify-center bg-slate-950 overflow-hidden relative"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: `${VIRTUAL_WIDTH * 1.15}px`,
          maxHeight: `${VIRTUAL_HEIGHT}px`,
          aspectRatio: `${VIRTUAL_WIDTH} / ${VIRTUAL_HEIGHT}`,
        }}
        className="block bg-slate-900 shadow-2xl rounded-t-xl sm:rounded-xl touch-none select-none"
      />
    </div>
  );
};
