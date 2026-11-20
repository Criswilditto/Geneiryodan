import { useEffect, useState } from 'react';
import { supabase, Profile, Character, Assignment, Priority } from '@/lib/supabase';
import { X, Users } from 'lucide-react';

type Props = {
  character: Character;
  onClose: () => void;
};

const PRIORITY_ORDER: Priority[] = ['P10', 'P9', 'P8', 'P7', 'P6', 'P5', 'P4', 'No Obtenido'];

const priorityColors: Record<string, string> = {
  'No Obtenido': 'bg-slate-600 text-white',
  P4: 'bg-yellow-600 text-white',
  P5: 'bg-lime-600 text-white',
  P6: 'bg-green-600 text-white',
  P7: 'bg-teal-600 text-white',
  P8: 'bg-cyan-600 text-white',
  P9: 'bg-blue-600 text-white',
  P10: 'bg-indigo-600 text-white',
};

export default function CharacterHoldersModal({ character, onClose }: Props) {
  const [holders, setHolders] = useState<{ profile: Profile; assignment: Assignment }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: assigns }, { data: profiles }] = await Promise.all([
        supabase
          .from('character_assignments')
          .select('*')
          .eq('character_id', character.id),
        supabase.from('profiles').select('*'),
      ]);
      const profileMap: Record<string, Profile> = {};
      ((profiles ?? []) as Profile[]).forEach((p) => { profileMap[p.id] = p; });
      const rows = ((assigns ?? []) as Assignment[])
        .map((a) => ({ assignment: a, profile: profileMap[a.user_id] }))
        .filter((r) => r.profile);
      rows.sort((x, y) =>
        PRIORITY_ORDER.indexOf(x.assignment.priority) - PRIORITY_ORDER.indexOf(y.assignment.priority) ||
        x.profile.username.localeCompare(y.profile.username)
      );
      setHolders(rows);
      setLoading(false);
    })();
  }, [character.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{character.name}</h2>
              <p className="text-xs text-slate-400">Quiénes tienen este personaje</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Cargando...</div>
          ) : holders.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">
              Ningún miembro tiene este personaje asignado todavía.
            </p>
          ) : (
            <div className="space-y-2">
              {holders.map(({ profile, assignment }) => (
                <div key={assignment.id} className="flex items-center gap-3 bg-slate-900/50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-sm font-black text-white shrink-0">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                  <p className="flex-1 min-w-0 text-sm font-medium text-white truncate">{profile.username}</p>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold shrink-0 ${priorityColors[assignment.priority]}`}>
                    {assignment.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
