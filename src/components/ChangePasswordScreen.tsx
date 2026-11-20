import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Swords, ShieldCheck } from 'lucide-react';

type Props = {
  onDone: () => void;
};

export default function ChangePasswordScreen({ onDone }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setBusy(true);
    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) {
      setError('No se pudo actualizar la contraseña. Intenta de nuevo.');
      setBusy(false);
      return;
    }
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', (await supabase.auth.getUser()).data.user!.id);
    if (profErr) {
      setError('No se pudo actualizar tu perfil. Intenta de nuevo.');
      setBusy(false);
      return;
    }
    setBusy(false);
    onDone();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-900/50 mb-4">
            <Swords className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Cambia tu contraseña</h1>
          <p className="text-slate-400 mt-1">Por seguridad, elige una contraseña propia antes de continuar</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8">
          <form onSubmit={submit} className="space-y-4">
            <Field icon={<Lock className="w-5 h-5" />}>
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-transparent text-white placeholder-slate-500 outline-none"
              />
            </Field>
            <Field icon={<ShieldCheck className="w-5 h-5" />}>
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full bg-transparent text-white placeholder-slate-500 outline-none"
              />
            </Field>

            {error && (
              <div className="text-sm rounded-lg p-3 bg-red-500/10 text-red-400">{error}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold shadow-lg shadow-amber-900/30 hover:from-amber-500 hover:to-amber-600 transition-all disabled:opacity-50"
            >
              {busy ? 'Guardando...' : 'Guardar y continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus-within:border-amber-600/50 transition-colors">
      <span className="text-slate-500">{icon}</span>
      {children}
    </div>
  );
}
