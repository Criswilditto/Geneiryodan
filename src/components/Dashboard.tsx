import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, Character, Assignment, Priority } from '@/lib/supabase';
import CharacterCard from '@/components/CharacterCard';
import MemberManager from '@/components/MemberManager';
import MembersView from '@/components/MembersView';
import { LogOut, Search, Filter, Users, UserPlus, Swords, LayoutGrid, Plus, X } from 'lucide-react';

type Tab = 'characters' | 'members';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const isDictator = profile?.role === 'dictador';
  const [tab, setTab] = useState<Tab>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [search, setSearch] = useState('');
  const [filterRarity, setFilterRarity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharRarity, setNewCharRarity] = useState('SSR');
  const [charError, setCharError] = useState<string | null>(null);
  const [charBusy, setCharBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: chars }, { data: assigns }] = await Promise.all([
      supabase.from('characters').select('*').order('name'),
      supabase.from('character_assignments').select('*').eq('user_id', user?.id ?? ''),
    ]);
    setCharacters(chars as Character[]);
    const map: Record<string, Assignment> = {};
    (assigns as Assignment[])?.forEach((a) => { map[a.character_id] = a; });
    setAssignments(map);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { if (tab === 'characters') loadData(); }, [loadData, tab]);

  const setPriority = async (characterId: string, priority: Priority) => {
    const existing = assignments[characterId];
    if (existing) {
      const { data } = await supabase
        .from('character_assignments')
        .update({ priority })
        .eq('id', existing.id)
        .select()
        .single();
      if (data) setAssignments((p) => ({ ...p, [characterId]: data as Assignment }));
    } else {
      const { data } = await supabase
        .from('character_assignments')
        .insert({ character_id: characterId, priority })
        .select()
        .single();
      if (data) setAssignments((p) => ({ ...p, [characterId]: data as Assignment }));
    }
  };

  const uploadAvatar = async (characterId: string, file: File) => {
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `shared/${characterId}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { alert('Error al subir: ' + upErr.message); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = urlData.publicUrl;

    // Update the shared character avatar
    const { data } = await supabase
      .from('characters')
      .update({ default_avatar_url: url })
      .eq('id', characterId)
      .select()
      .single();

    if (data) {
      setCharacters((prev) => prev.map((c) => c.id === characterId ? { ...c, default_avatar_url: url } : c));
    }
  };

  const removeAvatar = async (characterId: string) => {
    const { data } = await supabase
      .from('characters')
      .update({ default_avatar_url: null })
      .eq('id', characterId)
      .select()
      .single();

    if (data) {
      setCharacters((prev) => prev.map((c) => c.id === characterId ? { ...c, default_avatar_url: null } : c));
    }
  };

  const createCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setCharError(null);
    setCharBusy(true);
    const { data, error } = await supabase
      .from('characters')
      .insert({ name: newCharName.trim(), rarity: newCharRarity, element: '', weapon: '', class: '' })
      .select()
      .single();
    if (error || !data) {
      setCharError('No se pudo crear el personaje. Intenta de nuevo.');
    } else {
      setCharacters((prev) => [...prev, data as Character].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCharName('');
      setNewCharRarity('SSR');
      setShowAddCharacter(false);
    }
    setCharBusy(false);
  };

  const rarities = ['all', ...new Set(characters.map((c) => c.rarity))];

  const filtered = characters.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRarity !== 'all' && c.rarity !== filterRarity) return false;
    return true;
  });

  const assignedCount = Object.values(assignments).filter(
    (a) => a.priority !== 'No Obtenido'
  ).length;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">GeneiRyodan Tracker</h1>
              <p className="text-xs text-slate-400">30 personajes · P4–P10</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isDictator && tab === 'characters' && (
              <>
                <button
                  onClick={() => setShowAddCharacter(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Agregar personaje</span>
                </button>
                <button
                  onClick={() => setShowMembers(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors text-sm font-semibold"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Gestionar Orden</span>
                </button>
              </>
            )}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-4 h-4 text-slate-500" />
                <span>{profile?.username ?? user?.email}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                isDictator
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {isDictator ? 'Dictador' : 'Miembro'}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            <TabButton
              active={tab === 'characters'}
              onClick={() => setTab('characters')}
              icon={<LayoutGrid className="w-4 h-4" />}
              label="Personajes"
            />
            <TabButton
              active={tab === 'members'}
              onClick={() => setTab('members')}
              icon={<Users className="w-4 h-4" />}
              label="Miembros"
            />
          </div>
        </div>
      </header>

      {/* Characters tab */}
      {tab === 'characters' && (
        <>
          {/* Stats bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total personajes" value={characters.length} color="text-white" />
              <StatCard label="Asignados" value={assignedCount} color="text-amber-400" />
              <StatCard label="No obtenidos" value={characters.length - assignedCount} color="text-blue-400" />
              <StatCard label="Rol" value={isDictator ? 'Dictador' : 'Miembro'} color="text-green-400" />
            </div>
          </div>

          {/* Filters */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar personaje..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-amber-600/50"
                />
              </div>
              <FilterSelect icon={<Filter className="w-4 h-4" />} value={filterRarity} onChange={setFilterRarity} options={rarities} />
            </div>
          </div>

          {/* Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
            {loading ? (
              <div className="text-center py-20 text-slate-500">Cargando personajes...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-500">No se encontraron personajes.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((c) => (
                  <CharacterCard
                    key={c.id}
                    character={c}
                    assignment={assignments[c.id] ?? null}
                    isMaestro={isDictator}
                    onSetPriority={setPriority}
                    onUploadAvatar={uploadAvatar}
                    onRemoveAvatar={removeAvatar}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <MembersView onBack={() => setTab('characters')} />
      )}

      {showMembers && (
        <MemberManager onClose={() => setShowMembers(false)} onMemberCreated={loadData} />
      )}

      {showAddCharacter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-white">Agregar personaje</h2>
              </div>
              <button onClick={() => setShowAddCharacter(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createCharacter} className="p-5 space-y-4">
              <input
                type="text"
                placeholder="Nombre del personaje"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-amber-600/50"
              />
              <select
                value={newCharRarity}
                onChange={(e) => setNewCharRarity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-600/50 cursor-pointer"
              >
                {rarities.filter((r) => r !== 'all').map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {charError && (
                <div className="text-sm rounded-lg p-3 bg-red-500/10 text-red-400">{charError}</div>
              )}
              <button
                type="submit"
                disabled={charBusy}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold shadow-lg hover:from-amber-500 hover:to-amber-600 transition-all disabled:opacity-50"
              >
                {charBusy ? 'Creando...' : 'Crear personaje'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-semibold ${
        active
          ? 'border-amber-500 text-amber-400'
          : 'border-transparent text-slate-400 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/40 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none bg-slate-800 border border-slate-700 rounded-xl py-2.5 ${icon ? 'pl-10' : 'pl-4'} pr-8 text-white outline-none focus:border-amber-600/50 cursor-pointer capitalize`}
      >
        {options.map((o) => (
          <option key={o} value={o} className="capitalize">
            {o === 'all' ? 'Todos' : o}
          </option>
        ))}
      </select>
    </div>
  );
}
