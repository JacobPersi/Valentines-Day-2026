
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { TravelPin, AppConfig, DEFAULT_CONFIG } from '../types';
import { Icon } from './Icon';

interface PinSidebarProps {
    pins: TravelPin[];
    selectedPin: TravelPin | null;
    onPinClick: (pin: TravelPin) => void;
    onPinDeselect: () => void;
    onDeletePin: (id: string) => void;
    onEditPin: (pin: TravelPin) => void;
    onFocusPin?: (pin: TravelPin) => void;
    onAddClick: () => void;
    onSettingsClick: () => void;
    isOpen: boolean;
    config?: AppConfig;
}

const PinSidebar: React.FC<PinSidebarProps> = ({
    pins,
    selectedPin,
    onPinClick,
    onPinDeselect,
    onDeletePin,
    onEditPin,
    onFocusPin,
    onAddClick,
    onSettingsClick,
    isOpen,
    config = DEFAULT_CONFIG,
}) => {
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'MEMORY' | 'DREAM'>('ALL');
    const [ownerFilter, setOwnerFilter] = useState<'ALL' | 'USER1' | 'USER2' | 'SHARED'>('ALL');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const filteredPins = pins.filter(pin => {
        const typeMatch = typeFilter === 'ALL' || pin.category === typeFilter;
        const ownerMatch = ownerFilter === 'ALL' || pin.owner === ownerFilter;
        return typeMatch && ownerMatch;
    });

    const getCategoryDetails = (pin: TravelPin) => {
        if (pin.category === 'MEMORY') {
            return { label: 'Shared Memory', color: 'text-red-500', bg: 'bg-red-50', icon: 'Heart' as const };
        }
        // Dreams
        switch (pin.owner) {
            case 'USER1': return { label: `${config.user1Name}'s Dream`, color: 'text-pink-500', bg: 'bg-pink-50', icon: 'User' as const };
            case 'USER2': return { label: `${config.user2Name}'s Dream`, color: 'text-indigo-500', bg: 'bg-indigo-50', icon: 'User' as const };
            case 'SHARED': return { label: 'Shared Dream', color: 'text-amber-500', bg: 'bg-amber-50', icon: 'Users' as const };
            default: return { label: 'Travel Pin', color: 'text-slate-500', bg: 'bg-slate-50', icon: 'MapPin' as const };
        }
    };

    return (
        /* Sidebar - with proper mobile inset and rounding */
        <div
            className={`
        absolute z-40 transition-all duration-300 ease-in-out overflow-hidden 
        bg-white top-0 bottom-0
        ${isOpen ? 'translate-x-0 shadow-2xl pointer-events-auto' : 'translate-x-full shadow-none pointer-events-none md:translate-x-0 md:w-96 md:pointer-events-auto'}
        md:right-0 md:left-auto md:w-96 md:rounded-l-[2rem] md:rounded-r-none rounded-none
        inset-0
      `}
        >
            <div className="flex flex-col h-full w-full">
                {selectedPin ? (
                    // Pin Detail View
                    <div className="flex flex-col h-full">
                        {/* Banner Image - Fixed Height */}
                        <div className="h-72 bg-slate-900 relative flex-shrink-0 group">
                            <img
                                src={selectedPin.bannerImage || (selectedPin.images && selectedPin.images.length > 0 ? selectedPin.images[0] : `https://picsum.photos/seed/${selectedPin.id}/800/600`)}
                                className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                                alt={selectedPin.name}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30 pointer-events-none"></div>

                            {/* Header Buttons */}
                            <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
                                <button
                                    onClick={onPinDeselect}
                                    className="p-3 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                                >
                                    <Icon name="ArrowLeft" className="w-5 h-5" />
                                </button>

                                <div className="flex gap-2">
                                    {onFocusPin && (
                                        <button
                                            onClick={() => onFocusPin(selectedPin)}
                                            className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                                            title="Focus on Map"
                                        >
                                            <Icon name="Maximize" className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onEditPin(selectedPin)}
                                        className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                                        title="Edit Pin"
                                    >
                                        <Icon name="Edit" className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this pin?')) {
                                                onDeletePin(selectedPin.id);
                                                onPinDeselect();
                                            }
                                        }}
                                        className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-md"
                                        title="Delete Pin"
                                    >
                                        <Icon name="Trash" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-0 right-0 text-center px-6 z-20 pointer-events-none">
                                <h2 className="text-3xl font-serif text-white drop-shadow-xl mb-1">{selectedPin.name}</h2>
                                <div className="flex items-center justify-center gap-2 text-white/90 text-xs font-medium">
                                    <Icon name="Calendar" className="w-3.5 h-3.5" />
                                    <span>{selectedPin.date || 'The Future'}</span>
                                    {selectedPin.images && selectedPin.images.length > 0 && (
                                        <>
                                            <span className="opacity-50 mx-1">•</span>
                                            <Icon name="Camera" className="w-3.5 h-3.5" />
                                            <span>{selectedPin.images.length} photos</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detail Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-6">
                                {(() => {
                                    const cat = getCategoryDetails(selectedPin);
                                    return (
                                        <div className={`flex items-center gap-2 mb-4 p-1.5 px-3 rounded-full border border-current/20 w-fit ${cat.bg} ${cat.color}`}>
                                            <Icon name={cat.icon} className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{cat.label}</span>
                                        </div>
                                    );
                                })()}
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">The Story</h3>
                                <p className="text-slate-600 leading-relaxed font-serif text-lg">
                                    {selectedPin.description || "The magic of this moment is yet to be written..."}
                                </p>
                            </div>

                            {selectedPin.images && selectedPin.images.length === 0 && (
                                <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <Icon name="Camera" className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No photos added yet</p>
                                </div>
                            )}

                            {/* Gallery Grid */}
                            {selectedPin.images && selectedPin.images.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Icon name="Camera" className="w-3 h-3 text-rose-500" />
                                        Gallery ({selectedPin.images.length})
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {selectedPin.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setLightboxIndex(idx)}
                                                className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity active:scale-95 shadow-sm border border-slate-100"
                                            >
                                                <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-8"></div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Pin List View
                    <>
                        {/* Header with Actions */}
                        <div className="p-6 border-b border-rose-100 bg-gradient-to-br from-rose-50 to-white flex-shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-rose-500">
                                        <Icon name="Heart" className="w-4 h-4" />
                                        <span className="text-xs font-bold tracking-[0.2em] uppercase">Our Memories</span>
                                    </div>
                                    <h2 className="text-2xl font-serif text-slate-900">All Pins</h2>
                                    <p className="text-sm text-slate-500 mt-1">{filteredPins.length} {filteredPins.length === 1 ? 'place' : 'places'} {typeFilter !== 'ALL' || ownerFilter !== 'ALL' ? 'found' : 'marked'}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={onAddClick}
                                    className="flex-1 bg-rose-500 text-white font-bold py-3 rounded-2xl hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-100"
                                >
                                    <Icon name="Plus" className="w-4 h-4" />
                                    Add Memory
                                </button>
                                <button
                                    onClick={onSettingsClick}
                                    className="p-3 bg-white text-slate-400 rounded-2xl border border-rose-100 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm"
                                >
                                    <Icon name="Settings" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Filter Menu - Two Dimensional */}
                        {pins.length > 0 && (
                            <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0 space-y-3">
                                {/* Type Filter */}
                                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                                    <button
                                        onClick={() => setTypeFilter('ALL')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${typeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        All Types
                                    </button>
                                    <button
                                        onClick={() => setTypeFilter('MEMORY')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${typeFilter === 'MEMORY' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        Memories
                                    </button>
                                    <button
                                        onClick={() => setTypeFilter('DREAM')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${typeFilter === 'DREAM' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        Dreams
                                    </button>
                                </div>

                                {/* Owner Filter */}
                                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                                    <button
                                        onClick={() => setOwnerFilter('ALL')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${ownerFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        Everyone
                                    </button>
                                    <button
                                        onClick={() => setOwnerFilter('USER1')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${ownerFilter === 'USER1' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {config.user1Name}
                                    </button>
                                    <button
                                        onClick={() => setOwnerFilter('USER2')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${ownerFilter === 'USER2' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {config.user2Name}
                                    </button>
                                    <button
                                        onClick={() => setOwnerFilter('SHARED')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${ownerFilter === 'SHARED' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        Shared
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Pin List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filteredPins.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <Icon name="Globe" className="w-16 h-16 text-rose-200 mb-4" />
                                    <p className="text-slate-400 font-serif text-lg">
                                        No pins match
                                    </p>
                                    <p className="text-slate-300 text-sm mt-2">
                                        Try adjusting your filters to see more memories.
                                    </p>
                                </div>
                            ) : (
                                filteredPins.map((pin) => {
                                    const cat = getCategoryDetails(pin);
                                    return (
                                        <button
                                            key={pin.id}
                                            onClick={() => onPinClick(pin)}
                                            className="w-full bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-rose-200 hover:shadow-lg transition-all text-left group"
                                        >
                                            {/* Condensed Banner */}
                                            <div className="h-24 bg-rose-500 relative flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={pin.bannerImage || (pin.images && pin.images.length > 0 ? pin.images[0] : `https://picsum.photos/seed/${pin.id}/800/400`)}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                                                    alt={pin.name}
                                                    onError={(e) => {
                                                        e.currentTarget.src = `https://picsum.photos/seed/${pin.id}/800/400`;
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                                                <div className="relative z-10 text-center px-4 w-full">
                                                    <h3 className="text-lg font-serif text-white drop-shadow-lg leading-tight">{pin.name}</h3>
                                                    {pin.date && (
                                                        <p className="text-xs text-white/80 mt-1">{new Date(pin.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Condensed Content */}
                                            <div className="p-4">
                                                <div className={`flex items-center gap-1.5 mb-2 p-1 px-2 rounded-full border border-current/20 w-fit ${cat.bg} ${cat.color}`}>
                                                    <Icon name={cat.icon} className="w-3 h-3" />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider">{cat.label}</span>
                                                </div>
                                                {pin.description && (
                                                    <p className="text-sm text-slate-500 line-clamp-2 font-serif italic">
                                                        {pin.description}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
            {/* Lightbox Modal - Portaled to body to escape sidebar transform context */}
            {lightboxIndex !== null && selectedPin && selectedPin.images && (
                ReactDOM.createPortal(
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                        <button
                            onClick={() => setLightboxIndex(null)}
                            className="absolute top-6 right-6 p-4 text-white/50 hover:text-white transition-colors z-50"
                        >
                            <Icon name="X" className="w-8 h-8" />
                        </button>

                        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                            <div className="relative max-w-full max-h-full flex items-center justify-center pointer-events-auto">
                                <img
                                    src={selectedPin.images[lightboxIndex]}
                                    alt="Lightbox"
                                    className="max-w-screen max-h-screen object-contain p-4 select-none"
                                />
                            </div>

                            {selectedPin.images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev === 0 ? selectedPin.images!.length - 1 : prev! - 1); }}
                                        className="absolute left-4 p-4 text-white/50 hover:text-white transition-colors pointer-events-auto"
                                    >
                                        <Icon name="ArrowLeft" className="w-10 h-10" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev === selectedPin.images!.length - 1 ? 0 : prev! + 1); }}
                                        className="absolute right-4 p-4 text-white/50 hover:text-white transition-colors pointer-events-auto"
                                    >
                                        <Icon name="ArrowRight" className="w-10 h-10" />
                                    </button>
                                </>
                            )}

                            <div className="absolute bottom-8 left-0 right-0 text-center text-white/50 text-sm pointer-events-auto">
                                {lightboxIndex + 1} / {selectedPin.images.length}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            )}
        </div>
    );
};

export default PinSidebar;
