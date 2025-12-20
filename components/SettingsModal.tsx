
import React, { useState } from 'react';
import { GlobalSettings } from '../types';
import AdjustmentsIcon from './icons/AdjustmentsIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
  onSave: (s: GlobalSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [data, setData] = useState(settings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <AdjustmentsIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Configuration OpenRouter</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Clé API OpenRouter</label>
            <input 
              type="password"
              value={data.openRouterApiKey}
              onChange={(e) => setData({ ...data, openRouterApiKey: e.target.value })}
              className="w-full bg-input border border-border rounded-md p-2.5 text-sm"
              placeholder="sk-or-v1-..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Clé API ZeroGPT</label>
            <input 
              type="password"
              value={data.zeroGptApiKey}
              onChange={(e) => setData({ ...data, zeroGptApiKey: e.target.value })}
              className="w-full bg-input border border-border rounded-md p-2.5 text-sm"
              placeholder="ba51f..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground">Fermer</button>
          <button onClick={() => { onSave(data); onClose(); }} className="px-6 py-2 bg-primary text-white font-bold rounded-md">Appliquer</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
