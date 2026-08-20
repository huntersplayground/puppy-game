import { sendJson, supabaseRequest } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });

  try {
    const scores = await supabaseRequest('leaderboard_scores?select=score,level_reached,players(username,avatar_id)&order=score.desc&limit=20');
    const entries = scores.map((entry, index) => ({
      rank: index + 1,
      username: entry.players.username,
      avatarId: entry.players.avatar_id,
      score: entry.score,
      levelReached: entry.level_reached,
    }));
    return sendJson(res, 200, { entries });
  } catch (error) {
    console.error('Leaderboard read failed', error);
    return sendJson(res, 500, { error: 'Could not load the leaderboard' });
  }
}
