export type PlatformType = 'normal' | 'conveyor-left' | 'conveyor-right' | 'bounce' | 'fragile' | 'obstacle';

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  conveyorSpeed?: number;
  fragileTimer?: number; // starts counting down when dog lands
  isBroken?: boolean;
  bounceOffset?: number; // visual bounce animation
  obstacleType?: 'puddle' | 'kitty' | 'hurdle' | 'weave-poles';
  obstacleX?: number; // relative to platform x
  obstacleWidth?: number;
  hasBall?: boolean;
  ballType?: 'tennis' | 'rubber' | 'golden' | 'heart';
  ballX?: number;
  ballY?: number;
  ballCaught?: boolean;
  ballBounceY?: number;
}

export interface DogPlayer {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  currentPlatformId: string | null;
  facing: 'left' | 'right';
  state: 'idle' | 'run' | 'fall' | 'bounce' | 'hurt' | 'happy';
  stateTimer: number;
  invincibleTimer: number;
  hearts: number;
  maxHearts: number;
  tailAngle: number;
  earAngle: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'heart' | 'dust' | 'text' | 'bone';
  text?: string;
}

export interface LevelConfig {
  levelNumber: number; // 1 to 5
  name: string;
  subtitle: string;
  targetFloors: number;
  scrollSpeed: number; // pixels per frame at 60fps
  platformWidthMin: number;
  platformWidthMax: number;
  gapYMin: number;
  gapYMax: number;
  theme: {
    bgTop: string;
    bgBottom: string;
    platformColor: string;
    platformBorder: string;
    cloudColor: string;
    accentColor: string;
    wallColor: string;
    icon: string;
  };
  probabilities: {
    normal: number;
    conveyorLeft: number;
    conveyorRight: number;
    bounce: number;
    fragile: number;
    obstacle: number;
  };
  ballSpawnRate: number; // 0 to 1 probability per platform
}

export interface GameStats {
  score: number;
  currentLevel: number; // 1 to 5
  floorCount: number;
  ballsCaught: number;
  highScore: number;
  bestLevel: number;
  totalBallsEver: number;
}

export type GameStateStatus =
  | 'start'
  | 'playing'
  | 'paused'
  | 'level-clear'
  | 'game-over'
  | 'victory';
