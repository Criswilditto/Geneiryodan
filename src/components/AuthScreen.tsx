import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Swords, Lock, User as UserIcon, Crown, Info } from 'lucide-react';

export default function AuthScreen() {
  const { signIn, signUpDictator } = useAuth();
  const [mode, setMode] = useState<'signin' | 'setup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [dictatorExists, setDictatorExists] = useState<boolean | null>(null);
  if (dictatorExists === null) {
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'dictador')
      .then(({ count }) => setDictatorExists((count ?? 0) > 0));
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (mode === 'signin') {
      const { error } = await signIn(username, password);
      if (error) setError(error);
    } else {
      const { error } = await signUpDictator(username, password);
      if (error) setError(error);
      else setError('Cuenta de Dictador creada. Ya puedes iniciar sesión.');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-900/50 mb-4">
            <Swords className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">GeneiRyodan Tracker</h1>
          <p className="text-slate-400 mt-1">7DS Origin · Gestión de Personajes</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8">
          {dictatorExists === false && (
            <div className="flex gap-2 mb-6 p-1 bg-slate-900/50 rounded-xl">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'signin'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setMode('setup')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'setup'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Crear Dictador
              </button>
            </div>
          )}

          {mode === 'setup' && dictatorExists === false && (
            <div className="flex items-start gap-3 mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-600/30">
              <Crown className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                Vas a crear la cuenta de <strong>Dictador</strong>. Esta cuenta podrá crear y eliminar miembros, subir avatares y gestionar los roles de la Orden.
              </p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <Field icon={<UserIcon className="w-5 h-5" />}>
              <input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-transparent text-white placeholder-slate-500 outline-none"
              />
            </Field>

            <Field icon={<Lock className="w-5 h-5" />}>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-transparent text-white placeholder-slate-500 outline-none"
              />
            </Field>

            {error && (
              <div className={`text-sm rounded-lg p-3 ${error.includes('creada') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold shadow-lg shadow-amber-900/30 hover:from-amber-500 hover:to-amber-600 transition-all disabled:opacity-50"
            >
              {busy ? 'Procesando...' : mode === 'signin' ? 'Entrar' : 'Crear Cuenta Dictador'}
            </button>
          </form>

          {mode === 'signin' && (
            <div className="mt-6 flex items-start gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Los miembros reciben su usuario y contraseña del Dictador de la Orden. Si eres miembro, pídele tus credenciales.
              </p>
            </div>
          )}
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
