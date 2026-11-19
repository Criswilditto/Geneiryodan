import { useEffect, useState } from 'react';
import { supabase, Profile, CustomRole } from '@/lib/supabase';
import { X, UserPlus, Trash2, Loader2, Tag, Plus } from 'lucide-react';

type Props = {
  onClose: () => void;
  onMemberCreated: () => void;
};

export default function MemberManager({ onClose, onMemberCreated }: Props) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Role creation
  const [newRoleName, setNewRoleName] = useState('');
  const [showRoleForm, setShowRoleForm] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: mems }, { data: rls }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('custom_roles').select('*').order('display_order'),
    ]);
    setMembers(mems as Profile[]);
    setRoles(rls as CustomRole[]);
    setLoading(false);
  };

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({
          username,
          password,
          custom_role_id: selectedRoleId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Error al crear miembro');
      } else {
        setUsername(''); setPassword(''); setSelectedRoleId('');
        await loadAll();
        onMemberCreated();
      }
    } catch {
      setError('Error de conexión');
    }
    setBusy(false);
  };

  const deleteMember = async (member: Profile) => {
    if (member.role === 'dictador') {
      setError('No puedes eliminar la cuenta del Dictador');
      return;
    }
    if (!confirm(`¿Expulsar a "${member.username}" de la Orden? Se borrará su cuenta y todas sus asignaciones.`)) return;
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-member`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({ user_id: member.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Error al eliminar');
      } else {
        await loadAll();
        onMemberCreated();
      }
    } catch {
      setError('Error de conexión');
    }
  };

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setError(null);
    const maxOrder = roles.length > 0 ? Math.max(...roles.map((r) => r.display_order)) : 0;
    const { error: err } = await supabase
      .from('custom_roles')
      .insert({ name: newRoleName.trim(), display_order: maxOrder + 1 });
    if (err) {
      setError(err.message);
    } else {
      setNewRoleName('');
      setShowRoleForm(false);
      await loadAll();
    }
  };

  const deleteRole = async (role: CustomRole) => {
    if (!confirm(`¿Eliminar el rol "${role.name}"? Los miembros con este rol quedarán sin rol asignado.`)) return;
    const { error: err } = await supabase.from('custom_roles').delete().eq('id', role.id);
    if (err) setError(err.message);
    else await loadAll();
  };

  const assignRole = async (memberId: string, roleId: string) => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ custom_role_id: roleId || null })
      .eq('id', memberId);
    if (err) setError(err.message);
    else await loadAll();
  };

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return null;
    return roles.find((r) => r.id === roleId)?.name ?? null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-white">Gestionar Orden</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 text-sm rounded-lg p-3 bg-red-500/10 text-red-400">{error}</div>
        )}

        <div className="overflow-y-auto p-5 space-y-6">
          {/* Create member form */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Crear nuevo miembro</h3>
            <form onSubmit={createMember} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-amber-600/50"
              />
              <input
                type="text"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-amber-600/50"
              />
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-600/50 cursor-pointer"
              >
                <option value="">Sin rol</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold shadow-lg hover:from-amber-500 hover:to-amber-600 transition-all disabled:opacity-50"
              >
                {busy ? 'Creando...' : 'Crear Miembro'}
              </button>
            </form>
          </div>

          {/* Custom roles management */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Roles de la Orden
              </h3>
              <button
                onClick={() => setShowRoleForm(!showRoleForm)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo rol
              </button>
            </div>

            {showRoleForm && (
              <form onSubmit={createRole} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nombre del rol (ej. Capitan)"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 outline-none focus:border-amber-600/50"
                />
                <button type="submit" className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500">
                  Crear
                </button>
              </form>
            )}

            {roles.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">No hay roles creados todavía.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-white">{r.name}</span>
                    <button
                      onClick={() => deleteRole(r)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Member list */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Miembros ({members.length})
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-6 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const roleName = getRoleName(m.custom_role_id);
                  return (
                    <div key={m.id} className="flex items-center gap-3 bg-slate-900/50 rounded-xl px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-white">{m.username}</p>
                          {m.role === 'dictador' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                              DICTADOR
                            </span>
                          )}
                          {roleName && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400">
                              {roleName}
                            </span>
                          )}
                        </div>
                      </div>
                      {m.role !== 'dictador' && (
                        <>
                          <select
                            value={m.custom_role_id ?? ''}
                            onChange={(e) => assignRole(m.id, e.target.value)}
                            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white outline-none cursor-pointer"
                          >
                            <option value="">Sin rol</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => deleteMember(m)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                            title="Expulsar miembro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
