import { AVATAR_IDS, isValidBrowserId, isValidUsername, readJsonBody, sendJson, supabaseRequest } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  try {
    const { browserId, username, avatarId } = readJsonBody(req);
    if (!isValidBrowserId(browserId) || !isValidUsername(username) || !AVATAR_IDS.has(avatarId)) {
      return sendJson(res, 400, { error: 'Please choose a valid nickname and avatar' });
    }

    const players = await supabaseRequest('players?on_conflict=browser_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ browser_id: browserId, username: username.trim(), avatar_id: avatarId, updated_at: new Date().toISOString() }),
    });
    return sendJson(res, 200, { player: players[0] });
  } catch (error) {
    if (error.code === '23505') return sendJson(res, 409, { error: 'That nickname is already taken' });
    console.error('Profile save failed', error);
    return sendJson(res, 500, { error: 'Could not save your profile' });
  }
}
