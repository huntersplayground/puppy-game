import { LevelConfig } from '../types';

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    levelNumber: 1,
    name: 'Sunny Dog Park',
    subtitle: 'Warm-up: Jump, catch tennis balls & enjoy the sun!',
    targetFloors: 15,
    scrollSpeed: 0.85,
    platformWidthMin: 110,
    platformWidthMax: 140,
    gapYMin: 72,
    gapYMax: 88,
    theme: {
      bgTop: '#dff6ff',
      bgBottom: '#b7ebff',
      platformColor: '#a87343',
      platformBorder: '#6d4828',
      cloudColor: 'rgba(255, 255, 255, 0.8)',
      accentColor: '#10b981', // emerald
      wallColor: '#2f855a',
      icon: '🌳',
    },
    probabilities: {
      normal: 0.70,
      conveyorLeft: 0.05,
      conveyorRight: 0.05,
      bounce: 0.15,
      fragile: 0.05,
      obstacle: 0.0, // No obstacles in level 1 - nice and easy!
    },
    ballSpawnRate: 0.65,
  },
  {
    levelNumber: 2,
    name: 'Backyard Garden',
    subtitle: 'Watch out for fragile cloud leaves & muddy puddles!',
    targetFloors: 20,
    scrollSpeed: 1.10,
    platformWidthMin: 100,
    platformWidthMax: 130,
    gapYMin: 74,
    gapYMax: 90,
    theme: {
      bgTop: '#e6f8ea',
      bgBottom: '#c2f0d1',
      platformColor: '#6c8d47',
      platformBorder: '#475e2d',
      cloudColor: 'rgba(255, 255, 255, 0.85)',
      accentColor: '#16a34a', // green
      wallColor: '#3d612e',
      icon: '🌻',
    },
    probabilities: {
      normal: 0.55,
      conveyorLeft: 0.10,
      conveyorRight: 0.10,
      bounce: 0.12,
      fragile: 0.10,
      obstacle: 0.03, // Slight chance of mud puddle
    },
    ballSpawnRate: 0.65,
  },
  {
    levelNumber: 3,
    name: 'Sandy Beach Shore',
    subtitle: 'Conveyor sand-mats & beach balls! Don’t slip!',
    targetFloors: 25,
    scrollSpeed: 1.35,
    platformWidthMin: 95,
    platformWidthMax: 125,
    gapYMin: 76,
    gapYMax: 92,
    theme: {
      bgTop: '#fff8db',
      bgBottom: '#fdedae',
      platformColor: '#e0b56b',
      platformBorder: '#b38a42',
      cloudColor: 'rgba(255, 255, 255, 0.9)',
      accentColor: '#f59e0b', // amber
      wallColor: '#d97706',
      icon: '🏖️',
    },
    probabilities: {
      normal: 0.45,
      conveyorLeft: 0.17,
      conveyorRight: 0.17,
      bounce: 0.11,
      fragile: 0.06,
      obstacle: 0.04,
    },
    ballSpawnRate: 0.70,
  },
  {
    levelNumber: 4,
    name: 'Starlight Meadow',
    subtitle: 'Faster scroll speed & glowing starry balls!',
    targetFloors: 30,
    scrollSpeed: 1.60,
    platformWidthMin: 90,
    platformWidthMax: 120,
    gapYMin: 78,
    gapYMax: 94,
    theme: {
      bgTop: '#1a1f3c',
      bgBottom: '#2d336b',
      platformColor: '#64748b',
      platformBorder: '#334155',
      cloudColor: 'rgba(148, 163, 184, 0.5)',
      accentColor: '#a855f7', // purple
      wallColor: '#475569',
      icon: '✨',
    },
    probabilities: {
      normal: 0.40,
      conveyorLeft: 0.18,
      conveyorRight: 0.18,
      bounce: 0.10,
      fragile: 0.08,
      obstacle: 0.06,
    },
    ballSpawnRate: 0.75,
  },
  {
    levelNumber: 5,
    name: 'Cloud Playground',
    subtitle: 'The Ultimate Challenge! Golden balls are worth big bonus points!',
    targetFloors: 35,
    scrollSpeed: 1.85,
    platformWidthMin: 85,
    platformWidthMax: 115,
    gapYMin: 80,
    gapYMax: 96,
    theme: {
      bgTop: '#fbcfe8',
      bgBottom: '#c4b5fd',
      platformColor: '#f43f5e',
      platformBorder: '#be123c',
      cloudColor: 'rgba(255, 255, 255, 0.95)',
      accentColor: '#ec4899', // pink
      wallColor: '#8b5cf6',
      icon: '🏆',
    },
    probabilities: {
      normal: 0.38,
      conveyorLeft: 0.18,
      conveyorRight: 0.18,
      bounce: 0.12,
      fragile: 0.08,
      obstacle: 0.06,
    },
    ballSpawnRate: 0.80,
  },
];

export function getLevelConfig(levelNumber: number): LevelConfig {
  const index = Math.max(1, Math.min(5, levelNumber)) - 1;
  return LEVEL_CONFIGS[index];
}
