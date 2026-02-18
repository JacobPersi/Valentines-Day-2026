
import React, { useState, useEffect, useRef } from 'react';
import WorldMap, { WorldMapRef } from './components/WorldMap';
import AddPinForm from './components/AddPinForm';
import PinSidebar from './components/PinSidebar';
import { TravelPin, AppConfig, DEFAULT_CONFIG } from './types';
import { Icon } from './components/Icon';
import { useResponsive } from './hooks/useResponsive';
import { useConfig } from './hooks/useConfig';
import { getAllPins, savePinToDB, deletePinFromDB } from './db';

const App: React.FC = () => {
  const { isDesktop } = useResponsive();
  const { config, saveConfig } = useConfig();

  const [pins, setPins] = useState<TravelPin[]>([]);

  const [selectedPin, setSelectedPin] = useState<TravelPin | null>(null);
  const [showAddForm, setShowAddForm] = useState<{ lat: number; lng: number; existingPin?: TravelPin } | null>(null);
  const [isPinMode, setIsPinMode] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);

  // Settings modal state
  const [settingsTab, setSettingsTab] = useState<'data' | 'config'>('data');
  const [jsonInput, setJsonInput] = useState('');
  const [configDraft, setConfigDraft] = useState<AppConfig>(DEFAULT_CONFIG);

  // Initialize sidebar state based on viewport - desktop open by default, mobile closed
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  const mapRef = useRef<WorldMapRef>(null);

  // Update sidebar visibility when switching between desktop/mobile viewports
  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  // Sync configDraft when config loads
  useEffect(() => {
    setConfigDraft(config);
  }, [config]);

  // Load pins from IndexedDB (preserves migration logic)
  useEffect(() => {
    const loadPins = async () => {
      // 1. Check for legacy localStorage data
      const legacyData = localStorage.getItem('love-story-pins');
      if (legacyData) {
        try {
          const parsed = JSON.parse(legacyData);
          if (Array.isArray(parsed)) {
            console.log("Migrating", parsed.length, "pins from localStorage");
            for (const pin of parsed) {
              // Migration: Ensure images array exists
              const migratedPin = {
                ...pin,
                images: pin.images || (pin.imageBase64 ? [pin.imageBase64] : [])
              };
              await savePinToDB(migratedPin);
            }
            // Clear legacy data after successful migration
            localStorage.removeItem('love-story-pins');
          }
        } catch (e) {
          console.error("Migration failed", e);
        }
      }

      // 2. Load from DB
      try {
        const loadedPins = await getAllPins();
        setPins(loadedPins);
      } catch (e) {
        console.error("Failed to load pins", e);
      }
    };

    loadPins();
  }, []);

  const handleSavePin = async (pin: TravelPin) => {
    try {
      await savePinToDB(pin);

      // Update local state
      const existingIndex = pins.findIndex(p => p.id === pin.id);
      if (existingIndex >= 0) {
        const updatedPins = [...pins];
        updatedPins[existingIndex] = pin;
        setPins(updatedPins);
      } else {
        setPins([...pins, pin]);
      }
      setShowAddForm(null);
      setIsPinMode(false);
    } catch (e) {
      console.error("Failed to save pin", e);
      alert("Failed to save memory. Storage might be full.");
    }
  };

  const handleEditPin = (pin: TravelPin) => {
    setShowAddForm({ lat: pin.lat, lng: pin.lng, existingPin: pin });
  };

  const handleAddClick = () => {
    setIsPinMode(!isPinMode);
    if (!isDesktop && !isPinMode) {
      setSidebarOpen(false);
    }
  };

  const handleDeletePin = async (id: string) => {
    try {
      await deletePinFromDB(id);
      setPins(pins.filter(p => p.id !== id));
      setSelectedPin(null);
    } catch (e) {
      console.error("Failed to delete pin", e);
      alert("Failed to delete memory.");
    }
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (isPinMode) {
      setShowAddForm(coords);
    }
  };

  const handlePinClick = (pin: TravelPin) => {
    setSelectedPin(pin);
    if (!isDesktop) {
      setSidebarOpen(true);
    }
    if (mapRef.current) {
      mapRef.current.focusOnPin(pin);
    }
  };

  const openSettingsModal = () => {
    setSettingsTab('data');
    setJsonInput(JSON.stringify({ pins, config }, null, 2));
    setConfigDraft({ ...config });
    setShowDataModal(true);
  };

  const handleExport = () => {
    const payload = JSON.stringify({ pins, config }, null, 2);
    setJsonInput(payload);
    navigator.clipboard.writeText(payload);
    alert("Map data copied to clipboard!");
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Support both legacy format (plain array) and new format ({ pins, config })
      const importedPins: TravelPin[] = Array.isArray(parsed) ? parsed : (parsed.pins ?? []);
      const importedConfig: AppConfig | null = !Array.isArray(parsed) && parsed.config ? parsed.config : null;

      if (!Array.isArray(importedPins)) {
        alert("Invalid format. Please provide a valid data export.");
        return;
      }

      for (const pin of importedPins) {
        await savePinToDB(pin);
      }
      setPins(importedPins);

      if (importedConfig) {
        await saveConfig(importedConfig);
        setConfigDraft(importedConfig);
      }

      setShowDataModal(false);
      setJsonInput('');
      alert("Success! Your memories have been imported.");
    } catch (e) {
      console.error(e);
      alert("Failed to parse JSON or save data.");
    }
  };

  const handleSaveConfig = async () => {
    await saveConfig(configDraft);
    alert("Settings saved!");
  };

  return (
    <div className="h-[100dvh] w-screen bg-rose-50 overflow-hidden relative font-sans flex">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100/30 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200/30 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex-1 flex flex-col p-4 md:p-8 w-full">
        <header className="mb-6 flex items-start justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2 text-rose-500">
              <Icon name="Heart" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">Valentine's Day 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-slate-800">{config.siteTitle}</h1>
            <p className="text-slate-500 font-serif italic mt-2">{config.siteSubtitle}</p>
          </div>

          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-rose-50 transition-all border border-rose-100 z-50"
          >
            <Icon name={sidebarOpen ? "X" : "Menu"} className="w-5 h-5 text-rose-500" />
          </button>
        </header>

        <main className="flex-1 relative">
          <div className="w-full h-full relative">
            <WorldMap
              ref={mapRef}
              pins={pins}
              onPinClick={handlePinClick}
              onMapClick={handleMapClick}
              isPinMode={isPinMode}
            />

            {/* Legend Overlay */}
            <div
              className={`absolute bottom-8 transition-all duration-300 z-10 flex flex-col gap-2 pointer-events-none 
               ${sidebarOpen ? 'right-4 md:right-[26rem]' : 'right-4'}
               `}
            >
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-xl flex flex-col gap-2.5 min-w-[140px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-0.5">Map Key</span>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100"></div>
                  <span className="text-[11px] font-medium text-slate-600">Memory</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-pink-100"></div>
                  <span className="text-[11px] font-medium text-slate-600">{config.user1Name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-100"></div>
                  <span className="text-[11px] font-medium text-slate-600">{config.user2Name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100"></div>
                  <span className="text-[11px] font-medium text-slate-600">Together</span>
                </div>
              </div>
            </div>

            {isPinMode && !showAddForm && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-10 w-full max-w-xs md:max-w-none text-center px-4">
                <div className="bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-2xl inline-flex items-center gap-3 animate-bounce">
                  <Icon name="Sparkles" className="w-5 h-5" />
                  <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Click anywhere to drop a memory!</span>
                </div>
              </div>
            )}

            {pins.length === 0 && !isPinMode && !sidebarOpen && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6 z-10">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2rem] border-2 border-dashed border-rose-200 text-center max-w-sm">
                  <Icon name="Globe" className="w-12 h-12 text-rose-300 mx-auto mb-4" />
                  <h3 className="text-xl font-serif text-slate-800 mb-2">The world is waiting...</h3>
                  <p className="text-slate-500 text-sm">Our story is just beginning. Tap the plus to start mapping our journey together.</p>
                </div>
              </div>
            )}

            <PinSidebar
              pins={pins}
              selectedPin={selectedPin}
              onPinClick={handlePinClick}
              onPinDeselect={() => setSelectedPin(null)}
              onDeletePin={handleDeletePin}
              onEditPin={handleEditPin}
              onFocusPin={(pin) => {
                if (mapRef.current) {
                  mapRef.current.focusOnPin(pin);
                  if (!isDesktop) {
                    setSidebarOpen(false);
                  }
                }
              }}
              onAddClick={handleAddClick}
              onSettingsClick={openSettingsModal}
              isOpen={sidebarOpen}
              config={config}
            />
          </div>
        </main>
      </div>

      {showAddForm && (
        <AddPinForm
          coords={!showAddForm.existingPin ? { lat: showAddForm.lat, lng: showAddForm.lng } : undefined}
          existingPin={showAddForm.existingPin}
          onClose={() => setShowAddForm(null)}
          onSave={handleSavePin}
          config={config}
        />
      )}

      {showDataModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-serif text-slate-900">Settings</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage your data and preferences</p>
              </div>
              <button onClick={() => setShowDataModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <Icon name="X" className="w-6 h-6" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setSettingsTab('data')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${settingsTab === 'data' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Data
              </button>
              <button
                onClick={() => setSettingsTab('config')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${settingsTab === 'config' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Personalize
              </button>
            </div>

            {settingsTab === 'data' ? (
              <>
                <div className="mb-4 flex-1 overflow-y-auto">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block">JSON Payload</label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste memory data here..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-mono text-[10px] text-slate-600 focus:bg-white focus:border-rose-300 transition-all outline-none resize-none min-h-[250px] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleExport}
                    className="bg-white border-2 border-rose-100 text-rose-500 font-bold py-4 rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="Camera" className="w-4 h-4" />
                    Copy Data
                  </button>
                  <button
                    onClick={handleImport}
                    className="bg-rose-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="Plus" className="w-4 h-4" />
                    Import Text
                  </button>
                </div>

                <p className="mt-6 text-center text-[9px] text-slate-400 italic">
                  Use this to backup our memories or sync between devices.
                </p>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block">Site Title</label>
                    <input
                      value={configDraft.siteTitle}
                      onChange={(e) => setConfigDraft(d => ({ ...d, siteTitle: e.target.value }))}
                      placeholder="Our Global Love Story"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-700 focus:bg-white focus:border-rose-300 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block">Site Subtitle</label>
                    <input
                      value={configDraft.siteSubtitle}
                      onChange={(e) => setConfigDraft(d => ({ ...d, siteSubtitle: e.target.value }))}
                      placeholder="To the one I want to see the whole world with."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-700 focus:bg-white focus:border-rose-300 transition-all outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-400 mb-2 block">
                        <span className="inline-block w-2 h-2 rounded-full bg-pink-400 mr-1.5"></span>
                        User 1 Name
                      </label>
                      <input
                        value={configDraft.user1Name}
                        onChange={(e) => setConfigDraft(d => ({ ...d, user1Name: e.target.value }))}
                        placeholder="User 1"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-700 focus:bg-white focus:border-pink-300 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-2 block">
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-1.5"></span>
                        User 2 Name
                      </label>
                      <input
                        value={configDraft.user2Name}
                        onChange={(e) => setConfigDraft(d => ({ ...d, user2Name: e.target.value }))}
                        placeholder="User 2"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-700 focus:bg-white focus:border-indigo-300 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic text-center">
                    These names appear throughout the app — in filters, labels, and the map legend.
                  </p>
                </div>

                <button
                  onClick={handleSaveConfig}
                  className="mt-6 w-full bg-rose-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="Heart" className="w-4 h-4" />
                  Save Settings
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


