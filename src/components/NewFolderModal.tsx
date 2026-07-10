import React, { useState } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';

interface NewFolderModalProps {
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export default function NewFolderModal({ onClose, onSubmit }: NewFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      setError('ফোল্ডারের নাম খালি হতে পারবে না!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit(folderName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'ফোল্ডার তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন!');
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
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">নতুন ফোল্ডার তৈরি করুন</h3>
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
              <label htmlFor="folderName" className="block text-xs font-semibold text-slate-500 mb-1.5">
                ফোল্ডারের নাম
              </label>
              <input
                type="text"
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                placeholder="যেমন: প্রজেক্ট ডকুমেন্ট, ছবিসমূহ..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500 bg-rose-50/60 border border-rose-100 px-3 py-2 rounded-lg font-medium">
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
              <span>ফোল্ডার তৈরি করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
