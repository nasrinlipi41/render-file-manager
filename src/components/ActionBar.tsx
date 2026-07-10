import React, { useState } from 'react';
import { Trash2, Copy, Scissors, X, AlertTriangle, Loader2 } from 'lucide-react';
import { FileItem } from '../types';

interface ActionBarProps {
  selectedItems: FileItem[];
  onClear: () => void;
  onBulkCopy: () => void;
  onBulkCut: () => void;
  onBulkDelete: () => Promise<void>;
}

export default function ActionBar({
  selectedItems,
  onClear,
  onBulkCopy,
  onBulkCut,
  onBulkDelete
}: ActionBarProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (selectedItems.length === 0) return null;

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onBulkDelete();
      setShowConfirmDelete(false);
    } catch (err) {
      console.error('Failed to delete items:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800 z-40 max-w-[90vw] md:max-w-xl animate-fadeIn">
      {!showConfirmDelete ? (
        <>
          {/* Default Bulk Actions Row */}
          <div className="flex items-center gap-2 pr-4 border-r border-slate-800 shrink-0">
            <span className="text-xs bg-blue-600 px-2.5 py-1 rounded-full font-bold font-mono">
              {selectedItems.length}
            </span>
            <span className="text-xs font-bold text-slate-300">সিলেক্টেড</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBulkCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all text-slate-200"
              title="Copy selected items"
            >
              <Copy className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">কপি</span>
            </button>
            <button
              onClick={onBulkCut}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all text-slate-200"
              title="Cut/Move selected items"
            >
              <Scissors className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">কাট (Cut)</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-950/40 hover:text-rose-400 rounded-lg text-xs font-bold transition-all text-rose-500"
              title="Delete selected items"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">ডিলিট</span>
            </button>
          </div>

          <button
            onClick={onClear}
            className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        /* Delete Confirmation Row */
        <div className="flex items-center gap-4 animate-shake">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-slate-200">
              আপনি কি নিশ্চিতভাবে {selectedItems.length}টি আইটেম মুছতে চান?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              disabled={deleting}
              className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300"
            >
              না
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-md shadow-rose-900/30"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>হ্যাঁ, মুছুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
