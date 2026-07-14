import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { FileItem } from '../types';

interface DeleteConfirmModalProps {
  items: FileItem[];
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export default function DeleteConfirmModal({ items, onClose, onSubmit }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await onSubmit();
      onClose();
    } catch (err: any) {
      setError(err.message || 'ডিলিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন!');
    } finally {
      setLoading(false);
    }
  };

  const isSingle = items.length === 1;
  const displayName = isSingle ? items[0].name : `${items.length}টি আইটেম`;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/55">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">আইটেম মুছে ফেলার নিশ্চিতকরণ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              আপনি কি নিশ্চিতভাবে <span className="font-bold text-slate-800 font-sans">"{displayName}"</span> স্থায়ীভাবে মুছে ফেলতে চান? এই অ্যাকশনটি আর ফিরিয়ে নেওয়া যাবে না।
            </p>

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
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-100 hover:shadow-lg transition-all"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>হ্যাঁ, মুছে ফেলুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
