import React, { useState } from 'react';
import { X, Link2, Download } from 'lucide-react';

interface LinkUploadModalProps {
  onClose: () => void;
  onSubmit: (url: string) => void;
}

export default function LinkUploadModal({ onClose, onSubmit }: LinkUploadModalProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('লিঙ্কটি খালি হতে পারবে না!');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setError('অনুগ্রহ করে একটি বৈধ লিঙ্ক দিন (যা http:// বা https:// দিয়ে শুরু হয়)!');
      return;
    }

    onSubmit(trimmedUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/55">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Link2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">লিঙ্ক থেকে ফাইল আপলোড করুন</h3>
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
              <label htmlFor="urlInput" className="block text-xs font-semibold text-slate-500 mb-1.5">
                ফাইলের সরাসরি ডাউনলোড লিঙ্ক (Direct Link)
              </label>
              <textarea
                id="urlInput"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                rows={3}
                placeholder="যেমন: https://example.com/files/document.pdf"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium font-mono placeholder:font-sans resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                * নিশ্চিত করুন যে লিঙ্কটি একটি সরাসরি ডাউনলোড লিঙ্ক। অর্থাৎ লিঙ্কটিতে ক্লিক করলেই ব্রাউজারে কোনো পেজ না দেখিয়ে সরাসরি ফাইলটি ডাউনলোড শুরু হয়।
              </p>
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
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-100 hover:shadow-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ডাউনলোড শুরু করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
