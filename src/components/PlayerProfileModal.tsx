import React, { useState } from 'react';
import { Check, UserRound } from 'lucide-react';
import { AVATAR_IDS, AvatarId, PlayerProfile } from '../types';
import { AVATARS } from '../lib/leaderboard';

interface PlayerProfileModalProps {
  profile: PlayerProfile;
  onSave: (username: string, avatarId: AvatarId) => Promise<string | null>;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ profile, onSave }) => {
  const [username, setUsername] = useState(profile.username);
  const [avatarId, setAvatarId] = useState<AvatarId>(profile.avatarId);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = username.trim();
    if (!/^[A-Za-z0-9 _-]{3,16}$/.test(trimmedName)) {
      setError('Use 3–16 letters, numbers, spaces, hyphens, or underscores');
      return;
    }

    setError('');
    setIsSaving(true);
    const saveError = await onSave(trimmedName, avatarId);
    setIsSaving(false);
    if (saveError) setError(saveError);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
          <UserRound className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-lg font-extrabold text-white">Choose Your Player</h2>
            <p className="text-xs text-slate-400">Your name and avatar appear on the leaderboard</p>
          </div>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2" htmlFor="player-name">
          Nickname
        </label>
        <input
          id="player-name"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={16}
          autoComplete="nickname"
          placeholder="PuppyFan"
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        />

        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4 mb-2">Avatar</p>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_IDS.map((id) => {
            const selected = id === avatarId;
            return (
              <button
                key={id}
                type="button"
                aria-label={AVATARS[id].label}
                onClick={() => setAvatarId(id)}
                className={`relative aspect-square rounded-xl text-2xl border transition ${
                  selected
                    ? 'bg-amber-500/20 border-amber-400 scale-105'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {AVATARS[id].emoji}
                {selected && <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-amber-300" />}
              </button>
            );
          })}
        </div>

        {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition active:scale-95 text-sm"
        >
          {isSaving ? 'Saving…' : 'Play'}
        </button>
      </form>
    </div>
  );
};
