import { AvatarId, LeaderboardEntry, PlayerProfile } from '../types';
import bostonTerrier from '../assets/avatars/boston-terrier.png';
import goldenRetriever from '../assets/avatars/golden-retriever.png';
import corgi from '../assets/avatars/corgi.png';
import shibaInu from '../assets/avatars/shiba-inu.png';
import yorkie from '../assets/avatars/yorkie.png';
import husky from '../assets/avatars/husky.png';
import poodle from '../assets/avatars/poodle.png';
import labradorRetriever from '../assets/avatars/labrador-retriever.png';

export const AVATARS: Record<AvatarId, { src: string; label: string }> = {
  'golden-pup': { src: bostonTerrier, label: 'Boston Terrier' },
  'cloud-pup': { src: goldenRetriever, label: 'Golden Retriever' },
  'brown-pup': { src: corgi, label: 'Corgi' },
  'pink-pup': { src: shibaInu, label: 'Shiba Inu' },
  'blue-pup': { src: yorkie, label: 'Yorkie' },
  'star-pup': { src: husky, label: 'Husky' },
  'cat-pal': { src: poodle, label: 'Poodle' },
  'bone-pal': { src: labradorRetriever, label: 'Labrador Retriever' },
};

const apiRequest = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Could not reach the leaderboard');
  }
  return payload as T;
};

export async function saveRemoteProfile(profile: PlayerProfile): Promise<void> {
  await apiRequest('/api/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export async function submitLeaderboardScore(
  profile: PlayerProfile,
  score: number,
  levelReached: number,
  ballsCaught: number
): Promise<void> {
  if (!profile.username || score <= 0) return;
  await apiRequest('/api/scores', {
    method: 'POST',
    body: JSON.stringify({
      browserId: profile.browserId,
      score,
      levelReached,
      ballsCaught,
    }),
  });
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const payload = await apiRequest<{ entries: LeaderboardEntry[] }>('/api/leaderboard');
  return payload.entries;
}
