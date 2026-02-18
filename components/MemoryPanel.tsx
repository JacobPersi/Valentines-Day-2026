
import React from 'react';
import { TravelPin, PinOwner, AppConfig, DEFAULT_CONFIG } from '../types';
import { Icon } from './Icon';

interface MemoryPanelProps {
  pin: TravelPin;
  onClose: () => void;
  onDelete: (id: string) => void;
  config?: AppConfig;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({ pin, onClose, onDelete, config = DEFAULT_CONFIG }) => {
  const getCategoryDetails = (owner: PinOwner) => {
    if (pin.category === 'MEMORY') return { label: 'Shared Memory', color: 'text-red-500', bg: 'bg-red-50', icon: 'Heart' as const };
    switch (owner) {
      case 'USER1': return { label: `${config.user1Name}'s Dream`, color: 'text-pink-500', bg: 'bg-pink-50', icon: 'User' as const };
      case 'USER2': return { label: `${config.user2Name}'s Dream`, color: 'text-indigo-500', bg: 'bg-indigo-50', icon: 'User' as const };
      case 'SHARED': return { label: 'Shared Dream', color: 'text-amber-500', bg: 'bg-amber-50', icon: 'Users' as const };
      default: return { label: 'Travel Pin', color: 'text-slate-500', bg: 'bg-slate-50', icon: 'MapPin' as const };
    }
  };

  const cat = getCategoryDetails(pin.owner);

  return (
    <div className="fixed md:absolute inset-x-4 bottom-4 md:inset-auto md:top-4 md:right-4 md:bottom-4 md:w-96 bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300 border border-rose-100 max-h-[80vh] md:max-h-none">
      <div className="h-40 md:h-48 bg-rose-500 relative flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          src={pin.bannerImage || (pin.images && pin.images.length > 0 ? pin.images[0] : `https://picsum.photos/seed/${pin.id}/800/400`)}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          alt={pin.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-md z-20"
        >
          <Icon name="X" className="w-4 h-4" />
        </button>
        <div className="relative z-10 text-center px-6 mt-4">
          <h2 className="text-2xl md:text-3xl font-serif text-white drop-shadow-lg mb-1">{pin.name}</h2>
          <div className="flex items-center justify-center gap-2 text-white/90 text-xs">
            <Icon name="Calendar" className="w-3 h-3" />
            <span>{pin.date || 'The Future'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
        <div className="mb-6">
          <div className={`flex items-center gap-2 mb-4 p-1.5 px-3 rounded-full border border-current/20 w-fit ${cat.bg} ${cat.color}`}>
            <Icon name={cat.icon} className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{cat.label}</span>
          </div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">The Story</h3>
          <p className="text-slate-600 leading-relaxed font-serif text-lg">
            {pin.description || "The magic of this moment is yet to be written..."}
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-50 flex-shrink-0">
        <button
          onClick={() => onDelete(pin.id)}
          className="w-full py-2 text-slate-300 hover:text-red-400 transition-colors text-[10px] font-bold uppercase tracking-[0.2em]"
        >
          Remove this pin
        </button>
      </div>
    </div>
  );
};

export default MemoryPanel;
