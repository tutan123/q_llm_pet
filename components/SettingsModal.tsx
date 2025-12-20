import React, { useState, useEffect } from 'react';
import { LLMSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LLMSettings;
  onSave: (settings: LLMSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<LLMSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>⚙️</span> Configuration
        </h2>
        
        <div className="space-y-4">
          
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Provider</label>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setLocalSettings({...localSettings, provider: 'gemini'})}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  localSettings.provider === 'gemini' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Gemini
              </button>
              <button
                onClick={() => setLocalSettings({...localSettings, provider: 'custom'})}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  localSettings.provider === 'custom' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Custom / OpenAI
              </button>
            </div>
          </div>

          {/* Configuration Fields */}
          {localSettings.provider === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Base URL</label>
                <input
                  type="text"
                  value={localSettings.baseUrl}
                  onChange={(e) => setLocalSettings({...localSettings, baseUrl: e.target.value})}
                  placeholder="e.g. http://localhost:11434/v1"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">For Ollama: http://localhost:11434/v1</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">API Key</label>
                <input
                  type="password"
                  value={localSettings.apiKey}
                  onChange={(e) => setLocalSettings({...localSettings, apiKey: e.target.value})}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Model Name</label>
                <input
                  type="text"
                  value={localSettings.modelName}
                  onChange={(e) => setLocalSettings({...localSettings, modelName: e.target.value})}
                  placeholder="e.g. llama3"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {localSettings.provider === 'gemini' && (
             <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-xs text-slate-400">
               <p>Using the embedded Google GenAI integration.</p>
               <p className="mt-1">The system will use the default Gemini 3 Flash model optimized for tool use.</p>
             </div>
          )}

        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow-lg shadow-blue-900/20"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
