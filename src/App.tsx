import { useAuth } from '@/hooks/useAuth';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import ChangePasswordScreen from '@/components/ChangePasswordScreen';

function App() {
  const { user, profile, loading, refreshProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (profile?.must_change_password) {
    return <ChangePasswordScreen onDone={refreshProfile} />;
  }
  return <Dashboard />;
}

export default App;
