
import React, { useState } from 'react';
import { GlobalSettings } from '../types';
import AdjustmentsIcon from './icons/AdjustmentsIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import RefreshIcon from './icons/RefreshIcon';
import { useLanguage } from '../context/LanguageContext';
import { validateOpenRouterKey } from '../services/openRouterService';
import { detectAI } from '../services/zeroGptService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
  onSave: (s: GlobalSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const { t } = useLanguage();
  const [data, setData] = useState(settings);
  const [testingOR, setTestingOR] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testingZG, setTestingZG] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [orMessage, setOrMessage] = useState('');
  const [zgMessage, setZgMessage] = useState('');

  if (!isOpen) return null;

  const testOpenRouter = async () => {
    if (!data.openRouterApiKey) return;
    setTestingOR('loading');
    setOrMessage('');
    const res = await validateOpenRouterKey(data.openRouterApiKey);
    if (res.valid) {
        setTestingOR('success');
        setOrMessage(res.message);
    } else {
        setTestingOR('error');
        setOrMessage(res.message);
    }
  };

  const testZeroGpt = async () => {
    if (!data.zeroGptApiKey) return;
    setTestingZG('loading');
    setZgMessage('');
    // On teste avec un texte bidon
    const res = await detectAI("This is a simple test text to verify if the API key for ZeroGPT is actually working correctly.", data.zeroGptApiKey);
    if (res && !res.error) {
        setTestingZG('success');
        setZgMessage(t('keyValid'));
    } else {
        setTestingZG('error');
        setZgMessage(res?.error || 'Erreur inconnue');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#18181b] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl p-8 space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
             <AdjustmentsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">{t('settings')}</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Architecture Humanizer Z12</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* OPENROUTER */}
          <div className="space-y-3">
            <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('orKeyLabel')}</label>
            <div className="flex gap-2">
                <input 
                  type="password"
                  value={data.openRouterApiKey}
                  onChange={(e) => { setData({ ...data, openRouterApiKey: e.target.value }); setTestingOR('idle'); }}
                  className="flex-grow bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-all font-mono"
                  placeholder="sk-or-v1-..."
                />
                <button 
                    onClick={testOpenRouter}
                    disabled={testingOR === 'loading' || !data.openRouterApiKey}
                    className={`px-4 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${
                        testingOR === 'loading' ? 'bg-white/5 border-white/10 text-muted-foreground' :
                        testingOR === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                        testingOR === 'error' ? 'bg-destructive/10 border-destructive/50 text-destructive' :
                        'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                >
                    {testingOR === 'loading' ? <RefreshIcon className="w-4 h-4 animate-spin" /> : 
                     testingOR === 'success' ? <CheckBadgeIcon className="w-4 h-4" /> :
                     testingOR === 'error' ? <AlertTriangleIcon className="w-4 h-4" /> : null}
                    {testingOR === 'loading' ? t('testing') : t('testKey')}
                </button>
            </div>
            {orMessage && (
                <p className={`text-[9px] font-bold uppercase tracking-widest ${testingOR === 'success' ? 'text-green-400' : 'text-destructive'}`}>
                    {orMessage}
                </p>
            )}
          </div>

          {/* ZEROGPT */}
          <div className="space-y-3">
            <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('zgKeyLabel')}</label>
            <div className="flex gap-2">
                <input 
                  type="password"
                  value={data.zeroGptApiKey}
                  onChange={(e) => { setData({ ...data, zeroGptApiKey: e.target.value }); setTestingZG('idle'); }}
                  className="flex-grow bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-all font-mono"
                  placeholder="ba51f..."
                />
                <button 
                    onClick={testZeroGpt}
                    disabled={testingZG === 'loading' || !data.zeroGptApiKey}
                    className={`px-4 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${
                        testingZG === 'loading' ? 'bg-white/5 border-white/10 text-muted-foreground' :
                        testingZG === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                        testingZG === 'error' ? 'bg-destructive/10 border-destructive/50 text-destructive' :
                        'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                >
                    {testingZG === 'loading' ? <RefreshIcon className="w-4 h-4 animate-spin" /> : 
                     testingZG === 'success' ? <CheckBadgeIcon className="w-4 h-4" /> :
                     testingZG === 'error' ? <AlertTriangleIcon className="w-4 h-4" /> : null}
                    {testingZG === 'loading' ? t('testing') : t('testKey')}
                </button>
            </div>
            {zgMessage && (
                <p className={`text-[9px] font-bold uppercase tracking-widest ${testingZG === 'success' ? 'text-green-400' : 'text-destructive'}`}>
                    {zgMessage}
                </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
          <button onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all">{t('help')}</button>
          <button 
            onClick={() => { onSave(data); onClose(); }} 
            className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
