import React, { useState } from 'react';
import { X, Edit3, Loader2 } from 'lucide-react';
import { FileItem } from '../types';

interface RenameModalProps {
  file: FileItem;
  onClose: () => void;
  onSubmit: (newName: string) => Promise<void>;
}

export default function RenameModal({ file, onClose, onSubmit }: RenameModalProps) {
  // If it's a file, we pre-fill the name excluding the extension for a better user experience
  const ext = file.type === 'file' ? file.name.substring(file.name.lastIndexOf('.')) : '';
  const baseName = file.type === 'file' && file.name.includes('.') 
    ? file.name.substring(0, file.name.lastIndexOf('.')) 
    : file.name;

  const [name, setName] = useState(baseName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('নাম খালি রাখা যাবে না!');
      return;
    }

    if (name.trim() === baseName) {
      onClose(); // No change made
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Send the new name (re-appending extension for files if not already typed by user)
      let finalName = name.trim();
      if (file.type === 'file' && ext) {
        if (!finalName.endsWith(ext)) {
          finalName = `${finalName}${ext}`;
        }
      }
      await onSubmit(finalName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'নাম পরিবর্তন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/55">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">নাম পরিবর্তন (Rename)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-400 font-medium mb-1 truncate">পূর্বের নাম: <span className="font-mono text-slate-600">{file.name}</span></p>
              <label htmlFor="renameField" className="block text-xs font-semibold text-slate-500 mb-1.5">
                নতুন নাম
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <input
                  type="text"
                  id="renameField"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  placeholder="ফাইলের নতুন নাম লিখুন..."
                  className="flex-1 px-4 py-2.5 bg-transparent border-none text-sm focus:outline-none text-slate-700 font-semibold"
                  disabled={loading}
                />
                {file.type === 'file' && ext && (
                  <span className="px-3 py-1 bg-slate-200 text-slate-500 font-mono text-xs font-bold border-l border-slate-200 select-none">
                    {ext}
                  </span>
                )}
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-500 bg-rose-50/60 border border-rose-100 px-3 py-2 rounded-lg font-medium animate-shake">
                {error}
              </p>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-100 hover:shadow-lg transition-all"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>পরিবর্তন করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
