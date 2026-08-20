import { AvatarId, LeaderboardEntry, PlayerProfile } from '../types';

export const AVATARS: Record<AvatarId, { emoji: string; label: string }> = {
  'golden-pup': { emoji: '🐶', label: 'Golden Puppy' },
  'cloud-pup': { emoji: '🐕', label: 'Cloud Puppy' },
  'brown-pup': { emoji: '🦮', label: 'Brown Puppy' },
  'pink-pup': { emoji: '🐩', label: 'Pink Puppy' },
  'blue-pup': { emoji: '🐺', label: 'Blue Puppy' },
  'star-pup': { emoji: '🐾', label: 'Star Paws' },
  'cat-pal': { emoji: '🐈', label: 'Cat Pal' },
  'bone-pal': { emoji: '🦴', label: 'Bone Buddy' },
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
