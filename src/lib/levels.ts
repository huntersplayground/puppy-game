import { LevelConfig } from '../types';

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    levelNumber: 1,
    name: '10-Floor Challenge',
    subtitle: 'Each floor gets faster. Chase balls and stay below the STOP gate!',
    targetFloors: 10,
    scrollSpeed: 0.82,
    platformWidthMin: 112,
    platformWidthMax: 142,
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
      normal: 0.68,
      conveyorLeft: 0.05,
      conveyorRight: 0.05,
      bounce: 0.12,
      fragile: 0.04,
      obstacle: 0.06,
    },
    ballSpawnRate: 0.65,
  },
];

export function getLevelConfig(levelNumber: number): LevelConfig {
  const index = Math.max(1, Math.min(LEVEL_CONFIGS.length, levelNumber)) - 1;
  return LEVEL_CONFIGS[index];
}
