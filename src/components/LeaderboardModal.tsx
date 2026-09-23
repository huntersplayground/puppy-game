import React, { useEffect, useState } from 'react';
import { Crown, LoaderCircle, Trophy, X } from 'lucide-react';
import { LeaderboardEntry, PlayerProfile } from '../types';
import { AVATARS, fetchLeaderboard } from '../lib/leaderboard';

interface LeaderboardModalProps {
  profile: PlayerProfile;
  onClose: () => void;
  beforeLoad?: () => Promise<void>;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ profile, onClose, beforeLoad }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const loadLeaderboard = async () => {
      try {
        await beforeLoad?.();
        const nextEntries = await fetchLeaderboard();
        if (isActive) setEntries(nextEntries);
      } catch (requestError) {
        if (isActive) {
          setError(requestError instanceof Error ? requestError.message : 'Could not load the leaderboard');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };
    void loadLeaderboard();
    return () => {
      isActive = false;
    };
  }, [beforeLoad]);

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-extrabold text-white">Leaderboard</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition" aria-label="Close leaderboard">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {loading && (
            <div className="py-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <LoaderCircle className="w-5 h-5 animate-spin" /> Loading scores
            </div>
          )}
          {error && <p className="py-8 text-center text-sm text-slate-400">Leaderboard is not connected yet. Your local best score is still saved.</p>}
          {!loading && !error && entries.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No scores yet. Be the first puppy champion.</p>}
          {entries.map((entry) => {
            const isCurrentPlayer = entry.username.toLowerCase() === profile.username.toLowerCase();
            return (
              <div key={`${entry.rank}-${entry.username}`} className={`flex items-center gap-3 rounded-2xl border p-3 ${isCurrentPlayer ? 'bg-amber-500/10 border-amber-400/50' : 'bg-slate-800/70 border-slate-700/70'}`}>
                <span className={`w-6 text-center font-black ${entry.rank <= 3 ? 'text-amber-300' : 'text-slate-500'}`}>{entry.rank <= 3 ? <Crown className="w-4 h-4 mx-auto" /> : entry.rank}</span>
                <img
                  src={AVATARS[entry.avatarId].src}
                  alt={AVATARS[entry.avatarId].label}
                  className="h-9 w-9 rounded-full border border-slate-600 bg-white object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-white truncate">{entry.username}</p>
                  <p className="text-[11px] text-slate-400">Reached level {entry.levelReached}</p>
                </div>
                <span className="font-mono font-bold text-emerald-300 text-sm">{entry.score.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
