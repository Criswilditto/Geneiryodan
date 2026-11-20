import { useEffect, useState, useCallback } from 'react';
import { supabase, Profile, Character, Assignment, Priority, CustomRole } from '@/lib/supabase';
import { ArrowLeft, Search, ChevronRight } from 'lucide-react';

type Props = {
  onBack: () => void;
};

const PRIORITY_ORDER: Priority[] = ['P10','P9','P8','P7','P6','P5','P4','No Obtenido'];

const rarityColors: Record<string, string> = {
  SSR: 'from-amber-500 to-amber-600',
  SR: 'from-purple-500 to-purple-600',
};

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

export default function MembersView({ onBack }: Props) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const [{ data: mems }, { data: rls }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('custom_roles').select('*').order('display_order'),
    ]);
    setMembers(mems as Profile[]);
    setRoles(rls as CustomRole[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const selectMember = async (member: Profile) => {
    setSelectedMember(member);
    setLoading(true);
    const [{ data: chars }, { data: assigns }] = await Promise.all([
      supabase.from('characters').select('*').order('name'),
      supabase.from('character_assignments').select('*').eq('user_id', member.id),
    ]);
    setCharacters(chars as Character[]);
    setAssignments(assigns as Assignment[]);
    setLoading(false);
  };

  const charMap: Record<string, Character> = {};
  characters.forEach((c) => { charMap[c.id] = c; });

  const groupedByPriority: Record<string, Assignment[]> = {};
  [...assignments].sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))
    .forEach((a) => {
      if (!groupedByPriority[a.priority]) groupedByPriority[a.priority] = [];
      groupedByPriority[a.priority].push(a);
    });

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return null;
    return roles.find((r) => r.id === roleId)?.name ?? null;
  };

  // Filter and group members
  const filteredMembers = members.filter((m) =>
    m.username.toLowerCase().includes(search.toLowerCase())
  );

  const dictator = filteredMembers.find((m) => m.role === 'dictador');
  const membersWithRoles = roles.map((role) => ({
    role,
    list: filteredMembers.filter((m) => m.custom_role_id === role.id),
  }));
  const assignedIds = new Set([
    ...(dictator ? [dictator.id] : []),
    ...membersWithRoles.flatMap((g) => g.list.map((m) => m.id)),
  ]);
  const unassigned = filteredMembers.filter((m) => !assignedIds.has(m.id));

  // --- Member detail view ---
  if (selectedMember) {
    const roleName = getRoleName(selectedMember.custom_role_id);
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => { setSelectedMember(null); loadMembers(); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a miembros
          </button>

          {/* Member header */}
          <div className="flex items-center gap-4 mb-8 bg-slate-800/50 rounded-2xl border border-slate-700/40 p-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-2xl font-black text-white shrink-0">
              {selectedMember.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedMember.username}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {selectedMember.role === 'dictador' && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400">
                    DICTADOR
                  </span>
                )}
                {roleName && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-500/20 text-blue-400">
                    {roleName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-500">Cargando personajes...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              Este miembro aún no ha asignado prioridades.
            </div>
          ) : (
            <div className="space-y-8">
              {PRIORITY_ORDER.map((p) => {
                const group = groupedByPriority[p];
                if (!group || group.length === 0) return null;
                return (
                  <div key={p}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${priorityColors[p]}`}>
                        {p}
                      </span>
                      <span className="text-slate-500 text-sm">{group.length} personaje{group.length > 1 ? 's' : ''}</span>
                      <div className="flex-1 h-px bg-slate-800" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {group.map((a) => {
                        const char = charMap[a.character_id];
                        if (!char) return null;
                        const avatarUrl = char.default_avatar_url;
                        const rarityClass = rarityColors[char.rarity] ?? 'from-slate-500 to-slate-600';
                        return (
                          <div key={a.id} className="bg-slate-800/50 rounded-xl border border-slate-700/40 overflow-hidden">
                            <div className="relative aspect-square bg-slate-900/50">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className={`w-full h-full bg-gradient-to-br ${rarityClass} opacity-20`} />
                                  <span className="absolute text-3xl font-black text-white/30">
                                    {char.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r ${rarityClass} text-white`}>
                                {char.rarity}
                              </div>
                            </div>
                            <div className="p-2.5 text-center">
                              <p className="text-sm font-semibold text-white truncate">{char.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Member list view ---
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a personajes
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Miembros de la Orden</h2>
          <p className="text-slate-400 text-sm mt-1">Selecciona un miembro para ver sus personajes por prioridad</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar miembro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-amber-600/50"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Cargando miembros...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No se encontraron miembros.</div>
        ) : (
          <div className="space-y-8">
            {/* Dictador section */}
            {dictator && (
              <MemberSection title="Dictador" count={1} badge="bg-amber-500/20 text-amber-400">
                <MemberCard member={dictator} roleName={null} onClick={() => selectMember(dictator)} />
              </MemberSection>
            )}

            {/* Role sections in hierarchy order */}
            {membersWithRoles.map(({ role, list }) => (
              <MemberSection key={role.id} title={role.name} count={list.length} badge="bg-blue-500/20 text-blue-400">
                {list.map((m) => (
                  <MemberCard key={m.id} member={m} roleName={role.name} onClick={() => selectMember(m)} />
                ))}
              </MemberSection>
            ))}

            {/* Unassigned members */}
            {unassigned.length > 0 && (
              <MemberSection title="Sin rol asignado" count={unassigned.length} badge="bg-slate-700 text-slate-300">
                {unassigned.map((m) => (
                  <MemberCard key={m.id} member={m} roleName={null} onClick={() => selectMember(m)} />
                ))}
              </MemberSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberSection({ title, count, badge, children }: { title: string; count: number; badge: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${badge}`}>{title}</span>
        {count > 0 && <span className="text-xs text-slate-500">{count} miembro{count > 1 ? 's' : ''}</span>}
        <div className="flex-1 h-px bg-slate-800" />
      </div>
      {count === 0 ? (
        <p className="text-xs text-slate-600 italic">Sin miembros en este rol todavía.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, roleName, onClick }: { member: Profile; roleName: string | null; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/40 hover:border-amber-600/30 p-4 transition-all text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-lg font-black text-white shrink-0">
        {member.username.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-white truncate text-sm">{member.username}</p>
        {roleName && (
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400">
            {roleName}
          </span>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
    </button>
  );
}
