import React, { useState } from 'react';
import { saveFirebaseConfig } from '../services/firebase';
import { Database, Copy, Check, ExternalLink } from 'lucide-react';

export default function FirebaseSetupModal() {
  const [configText, setConfigText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const envTemplate = `VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = () => {
    setError('');
    const raw = configText.trim();
    if (!raw) {
      setError('Please paste your Firebase configuration.');
      return;
    }

    try {
      let configObj = null;

      // Handle raw JSON or JS object assignment
      if (raw.startsWith('{') && raw.endsWith('}')) {
        // Try direct JSON.parse first, or relaxed object evaluation
        try {
          configObj = JSON.parse(raw);
        } catch {
          // Wrap keys in quotes if it's unquoted JS object
          const sanitized = raw
            .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
            .replace(/'/g, '"');
          configObj = JSON.parse(sanitized);
        }
      } else if (raw.includes('firebaseConfig')) {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const sanitized = match[0]
            .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
            .replace(/'/g, '"');
          configObj = JSON.parse(sanitized);
        }
      }

      if (!configObj || !configObj.apiKey || !configObj.projectId) {
        throw new Error('Config must contain at least "apiKey" and "projectId".');
      }

      saveFirebaseConfig(configObj);
    } catch {
      setError('Could not parse configuration. Ensure it contains apiKey and projectId.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl my-auto p-6 sm:p-8 rounded-3xl smoked-glass-modal animate-modal-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 border border-white/20">
            <Database className="w-5 h-5 text-white/90" />
          </div>
          <div>
            <h2 className="text-lg font-medium tracking-wide text-white">
              Firebase Configuration Required
            </h2>
            <p className="text-xs text-white/50 tracking-wider">
              LIFE OF BLOCKS — REAL DATA ONLY
            </p>
          </div>
        </div>

        <p className="text-sm text-white/70 leading-relaxed mb-6 font-normal">
          Per specification, this application strictly uses <strong className="text-white">real Firebase Firestore and Cloud Storage</strong> for multi-device realtime synchronization. No fake or mock data is simulated.
        </p>

        {/* Quick Paste Area */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-white/80 uppercase tracking-wider">
              Paste Firebase Config Object
            </label>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200 transition-colors"
            >
              <span>Firebase Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <textarea
            rows={5}
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-app",\n  storageBucket: "my-app.appspot.com",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono text-white/90 placeholder-white/30 smoked-glass-input focus:ring-0 resize-none"
          />

          {error && (
            <p className="text-xs text-red-400 mt-2 font-normal">
              {error}
            </p>
          )}

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSaveConfig}
              className="px-5 py-2 rounded-xl text-xs font-medium bg-white text-black hover:bg-white/90 transition-all duration-150 shadow-md"
            >
              Save & Connect
            </button>
          </div>
        </div>

        {/* .env alternative */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              Or configure via .env.local
            </span>
            <button
              onClick={handleCopyEnv}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Template'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-white/60 overflow-x-auto select-all">
            {envTemplate}
          </pre>
        </div>
      </div>
    </div>
  );
}
