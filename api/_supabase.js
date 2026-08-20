const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Server configuration is missing ${name}`);
  return value;
};

export const readJsonBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
};

export const sendJson = (res, status, data) => res.status(status).json(data);

export const supabaseRequest = async (path, options = {}) => {
  const url = requiredEnv('SUPABASE_URL');
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || body.hint || 'Supabase request failed');
    error.status = response.status;
    error.code = body.code;
    throw error;
  }
  return body;
};

export const isValidBrowserId = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const isValidUsername = (value) => typeof value === 'string' && /^[A-Za-z0-9 _-]{3,16}$/.test(value);
export const AVATAR_IDS = new Set(['golden-pup', 'cloud-pup', 'brown-pup', 'pink-pup', 'blue-pup', 'star-pup', 'cat-pal', 'bone-pal']);
