
import React, { useState, useEffect } from 'react';
import { PinCategory, PinOwner, TravelPin, AppConfig, DEFAULT_CONFIG } from '../types';
import { Icon } from './Icon';

interface AddPinFormProps {
  coords?: { lat: number; lng: number };
  existingPin?: TravelPin;
  onClose: () => void;
  onSave: (pin: TravelPin) => void;
  config?: AppConfig;
}

const AddPinForm: React.FC<AddPinFormProps> = ({ coords, existingPin, onClose, onSave, config = DEFAULT_CONFIG }) => {
  const [name, setName] = useState(existingPin?.name || '');
  const [description, setDescription] = useState(existingPin?.description || '');
  const [category, setCategory] = useState<PinCategory>(existingPin?.category || 'MEMORY');
  const [owner, setOwner] = useState<PinOwner>(existingPin?.owner || 'SHARED');
  const [date, setDate] = useState(existingPin?.date || '');
  const [images, setImages] = useState<string[]>(existingPin?.images || []);
  const [bannerImage, setBannerImage] = useState<string>(existingPin?.bannerImage || '');

  // Auto-set banner if not set and images exist
  useEffect(() => {
    if (images.length > 0 && !bannerImage) {
      setBannerImage(images[0]);
    } else if (images.length === 0) {
      setBannerImage('');
    } else if (bannerImage && !images.includes(bannerImage)) {
      setBannerImage(images[0]);
    }
  }, [images, bannerImage]);

  const isEditing = !!existingPin;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const pin: TravelPin = {
      id: existingPin?.id || Math.random().toString(36).substr(2, 9),
      name: name.trim() || "Unnamed Place",
      lat: coords?.lat || existingPin!.lat,
      lng: coords?.lng || existingPin!.lng,
      category,
      owner,
      date,
      description,
      images,
      bannerImage,
    };

    onSave(pin);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-6">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-[2rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h2 className="text-2xl font-serif text-slate-900 mb-1">
                {isEditing ? 'Edit Memory' : 'New Memory'}
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest">
                {coords ? `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}` : 'Editing existing pin'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-all"
            >
              <Icon name="X" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form id="pin-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Place Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Place Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Where is this memory?"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                autoFocus
              />
            </div>

            {/* Category Split: Type & Who */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Type
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCategory('MEMORY')} className={`flex-1 py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all ${category === 'MEMORY' ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Memory</button>
                  <button type="button" onClick={() => setCategory('DREAM')} className={`flex-1 py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all ${category === 'DREAM' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Dream</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Who
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOwner('USER1')} className={`flex-1 py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all ${owner === 'USER1' ? 'border-pink-400 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{config.user1Name}</button>
                  <button type="button" onClick={() => setOwner('USER2')} className={`flex-1 py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all ${owner === 'USER2' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{config.user2Name}</button>
                  <button type="button" onClick={() => setOwner('SHARED')} className={`flex-1 py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all ${owner === 'SHARED' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Shared</button>
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all outline-none text-slate-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                The Story
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What makes this place special?"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all outline-none resize-none text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Photos (Select star to set banner)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className={`relative aspect-square rounded-xl overflow-hidden border-2 group transition-all ${bannerImage === img ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'}`}>
                    <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />

                    {/* Banner Selection */}
                    <button
                      type="button"
                      onClick={() => setBannerImage(img)}
                      className={`absolute top-1 left-1 p-1.5 rounded-full transition-all ${bannerImage === img ? 'bg-amber-400 text-white' : 'bg-black/40 text-white hover:bg-amber-400 hover:text-white'}`}
                      title="Set as Cover"
                    >
                      <Icon name="Star" className="w-3 h-3 fill-current" />
                    </button>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1.5 bg-black/40 hover:bg-red-500 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Icon name="X" className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 hover:border-rose-300 hover:bg-rose-50 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-slate-400 hover:text-rose-500">
                  <Icon name="Camera" className="w-6 h-6" />
                  <span className="text-[10px] uppercase font-bold tracking-wide">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Upload photos to keep them safe in our map.</p>
            </div>

            {/* Bottom padding for mobile */}
            <div className="h-4"></div>
          </form>
        </div>

        {/* Footer with Actions */}
        <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="pin-form"
              className="flex-1 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-200 hover:shadow-rose-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Icon name={isEditing ? "Edit" : "Plus"} className="w-5 h-5" />
              {isEditing ? 'Save Changes' : 'Add Memory'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPinForm;
