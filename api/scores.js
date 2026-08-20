import { isValidBrowserId, readJsonBody, sendJson, supabaseRequest } from './_supabase.js';

const isWholeNumberInRange = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  try {
    const { browserId, score, levelReached, ballsCaught } = readJsonBody(req);
    if (!isValidBrowserId(browserId) || !isWholeNumberInRange(score, 1, 1000000) || !isWholeNumberInRange(levelReached, 1, 10) || !isWholeNumberInRange(ballsCaught, 0, 10000)) {
      return sendJson(res, 400, { error: 'Invalid score submission' });
    }

    const players = await supabaseRequest(`players?browser_id=eq.${encodeURIComponent(browserId)}&select=id&limit=1`);
    if (!players[0]) return sendJson(res, 404, { error: 'Create a player profile before submitting a score' });

    await supabaseRequest('rpc/submit_leaderboard_score', {
      method: 'POST',
      body: JSON.stringify({
        p_player_id: players[0].id,
        p_score: score,
        p_level_reached: levelReached,
        p_balls_caught: ballsCaught,
      }),
    });
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('Score submission failed', error);
    return sendJson(res, 500, { error: 'Could not submit this score' });
  }
}
