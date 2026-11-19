import { Character, Assignment, PRIORITIES, Priority } from '@/lib/supabase';
import { Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

type Props = {
  character: Character;
  assignment: Assignment | null;
  isMaestro: boolean;
  onSetPriority: (characterId: string, priority: Priority) => void;
  onUploadAvatar: (characterId: string, file: File) => Promise<void>;
  onRemoveAvatar: (characterId: string) => void;
};

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

const priorityLabel: Record<string, string> = {
  'No Obtenido': 'No Obtenido',
  P4: 'Prioridad P4',
  P5: 'Prioridad P5',
  P6: 'Prioridad P6',
  P7: 'Prioridad P7',
  P8: 'Prioridad P8',
  P9: 'Prioridad P9',
  P10: 'Prioridad P10',
};

export default function CharacterCard({ character, assignment, isMaestro, onSetPriority, onUploadAvatar, onRemoveAvatar }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const avatarUrl = character.default_avatar_url;
  const priority = assignment?.priority;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUploadAvatar(character.id, file);
    setUploading(false);
  };

  const rarityClass = rarityColors[character.rarity] ?? 'from-slate-500 to-slate-600';

  return (
    <div className="group relative bg-slate-800/50 rounded-2xl border border-slate-700/40 overflow-hidden hover:border-amber-600/30 transition-all hover:shadow-xl hover:shadow-black/20">
      {/* Rarity top bar */}
      <div className={`h-1 bg-gradient-to-r ${rarityClass}`} />

      {/* Avatar area */}
      <div className="relative aspect-square bg-slate-900/50">
        {avatarUrl ? (
          <img src={avatarUrl} alt={character.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className={`w-full h-full bg-gradient-to-br ${rarityClass} opacity-20`} />
            <span className="absolute text-4xl font-black text-white/30">
              {character.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Rarity badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold bg-gradient-to-r ${rarityClass} text-white shadow-lg`}>
          {character.rarity}
        </div>

        {/* Priority badge */}
        {priority && priority !== 'No Obtenido' && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold shadow-lg ${priorityColors[priority]}`}>
            {priority}
          </div>
        )}

        {/* Upload button — maestro only */}
        {isMaestro && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-2 right-2 p-2 rounded-lg bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-600"
              title="Subir avatar"
            >
              {uploading ? <span className="text-xs">...</span> : <Upload className="w-4 h-4" />}
            </button>

            {character.default_avatar_url && (
              <button
                onClick={() => onRemoveAvatar(character.id)}
                className="absolute bottom-2 left-2 p-2 rounded-lg bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Quitar avatar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-white text-lg leading-tight text-center">{character.name}</h3>

        {/* Priority selector */}
        <div className="relative">
          <button
            onClick={() => setShowPriorityMenu(!showPriorityMenu)}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
              priority
                ? `${priorityColors[priority]}`
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {priority ? priorityLabel[priority] : 'Sin asignar'}
          </button>

          {showPriorityMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPriorityMenu(false)} />
              <div className="absolute bottom-full mb-2 left-0 right-0 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-2 grid grid-cols-4 gap-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      onSetPriority(character.id, p);
                      setShowPriorityMenu(false);
                    }}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all hover:scale-105 ${
                      priority === p ? priorityColors[p] : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
