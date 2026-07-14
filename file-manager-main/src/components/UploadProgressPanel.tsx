import React, { useState } from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Minus, 
  Maximize2, 
  CheckCircle2, 
  AlertCircle, 
  Ban, 
  Loader2,
  HardDrive
} from 'lucide-react';
import { UploadingFile } from '../types';
import { formatBytes, getFileIcon } from '../utils';

interface UploadProgressPanelProps {
  uploadQueue: UploadingFile[];
  onCancelFile: (id: string) => void;
  onCancelAll: () => void;
  onClearQueue: () => void;
}

export default function UploadProgressPanel({ 
  uploadQueue, 
  onCancelFile, 
  onCancelAll, 
  onClearQueue 
}: UploadProgressPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (uploadQueue.length === 0) return null;

  // Stats calculation
  const totalFiles = uploadQueue.length;
  const activeUploads = uploadQueue.filter(f => f.status === 'uploading').length;
  const completedUploads = uploadQueue.filter(f => f.status === 'completed').length;
  const failedOrCancelled = uploadQueue.filter(f => f.status === 'error' || f.status === 'cancelled').length;
  
  // Total progress percentage (weighted by size or simple average of individual progress)
  const totalSize = uploadQueue.reduce((acc, f) => acc + f.size, 0);
  const totalUploadedSize = uploadQueue.reduce((acc, f) => acc + (f.size * (f.progress / 100)), 0);
  const overallProgress = totalSize > 0 ? Math.round((totalUploadedSize / totalSize) * 100) : 0;

  const isAllDone = activeUploads === 0;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-150 overflow-hidden animate-slideIn">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 rounded-lg">
            {isAllDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            )}
          </div>
          <div className="leading-tight">
            <h4 className="text-xs font-bold font-sans">
              {isAllDone ? 'আপলোড সম্পন্ন হয়েছে' : 'ফাইল আপলোড হচ্ছে...'}
            </h4>
            <p className="text-[10px] text-slate-300 font-medium">
              {completedUploads} / {totalFiles} টি সফল | {overallProgress}% সম্পূর্ণ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Minimize / Maximize Toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            title={isMinimized ? 'বড় করুন' : 'ছোট করুন'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>

          {/* Close/Clear Button (Only when all done) */}
          <button
            onClick={isAllDone ? onClearQueue : onCancelAll}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            title={isAllDone ? 'তালিকাটি বন্ধ করুন' : 'সব বাতিল করুন'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Slider (Always visible at bottom of header when minimized) */}
      {!isMinimized && (
        <div className="w-full h-1 bg-slate-800">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      )}

      {/* Minimized Compact View */}
      {isMinimized && (
        <div className="p-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
          <div className="w-full mr-3">
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 font-mono shrink-0">
            {overallProgress}%
          </span>
        </div>
      )}

      {/* Maximized Detailed Queue View */}
      {!isMinimized && (
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 bg-white">
          {uploadQueue.map((file) => {
            const Icon = getFileIcon('file', file.name);
            return (
              <div key={file.id} className="p-3.5 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                {/* File Icon / Type Indicator */}
                <div className="p-2 bg-slate-100 text-slate-500 rounded-xl shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>

                {/* File Info & Progress bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-700 truncate block font-sans" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0 font-mono">
                      {formatBytes(file.size)}
                    </span>
                  </div>

                  {/* Progress info or Status badge */}
                  {file.status === 'uploading' && (
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>আপলোড হচ্ছে...</span>
                        <span className="font-mono">{file.progress}%</span>
                      </div>
                    </div>
                  )}

                  {file.status === 'completed' && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>আপলোড সম্পন্ন</span>
                    </div>
                  )}

                  {file.status === 'cancelled' && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <Ban className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-through">বাতিল করা হয়েছে</span>
                    </div>
                  )}

                  {file.status === 'error' && (
                    <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold" title={file.error}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{file.error || 'আপলোড ব্যর্থ'}</span>
                    </div>
                  )}
                </div>

                {/* File Action (Cancel Button) */}
                {file.status === 'uploading' && (
                  <button
                    onClick={() => onCancelFile(file.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    title="এই ফাইলটি বাতিল করুন"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Global Cancel/Clear Action bar inside expanded view */}
      {!isMinimized && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold">
          <div>
            <span>মোট আকার: {formatBytes(totalSize)}</span>
          </div>
          {activeUploads > 0 ? (
            <button
              onClick={onCancelAll}
              className="px-2.5 py-1 text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all"
            >
              সব বাতিল করুন
            </button>
          ) : (
            <button
              onClick={onClearQueue}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
            >
              তালিকা পরিষ্কার করুন
            </button>
          )}
        </div>
      )}
    </div>
  );
}
