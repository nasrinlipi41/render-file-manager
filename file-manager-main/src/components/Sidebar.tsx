import React from 'react';
import { 
  FolderClosed, 
  HardDrive, 
  Files, 
  Image, 
  FileText, 
  Music, 
  Video, 
  Layers
} from 'lucide-react';
import { StorageStats } from '../types';
import { formatBytes } from '../utils';

interface SidebarProps {
  stats: StorageStats | null;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  loading: boolean;
}

export default function Sidebar({ stats, selectedCategory, setSelectedCategory, loading }: SidebarProps) {
  // Calculate percentage used
  const totalLimit = stats?.totalBytesLimit ?? 0;
  const myUsed = stats?.usedBytes ?? 0;
  const otherUsed = stats?.otherFilesBytes ?? 0;
  const freeBytes = stats?.freeBytes ?? 0;

  const myUsedPercent = totalLimit > 0 ? Math.min(100, (myUsed / totalLimit) * 100) : 0;
  const otherUsedPercent = totalLimit > 0 ? Math.min(100 - myUsedPercent, (otherUsed / totalLimit) * 100) : 0;

  const categories = [
    { id: 'all', name: 'সব ফাইল (All Files)', icon: Layers, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { id: 'image', name: 'ছবিসমূহ (Images)', icon: Image, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
    { id: 'document', name: 'নথিপত্র (Documents)', icon: FileText, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { id: 'audio-video', name: 'মিডিয়া (Audio & Video)', icon: Music, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
  ];

  return (
    <aside className="w-full md:w-72 bg-white border-r border-slate-100 flex flex-col h-full shrink-0">
      {/* App Logo */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
          <FolderClosed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-slate-800 text-lg leading-tight">ফাইল ম্যানেজার</h1>
          <p className="text-xs text-slate-400 font-mono">Web File Manager</p>
        </div>
      </div>

      {/* Category Shortcuts */}
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ক্যাটাগরি</h2>
          <div className="space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    isActive 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${isActive ? 'text-white bg-blue-600/50' : cat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Instructions / Info */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <h3 className="text-xs font-semibold text-slate-700 mb-1.5">দ্রুত নির্দেশনা</h3>
          <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>ফোল্ডারে প্রবেশ করতে <strong>ডাবল-ক্লিক</strong> করুন।</li>
            <li>একাধিক আইটেম সিলেক্ট করতে বাম পাশের <strong>চেকবক্স</strong> ব্যবহার করুন।</li>
            <li>রাইট-ক্লিক অথবা ৩-ডট মেনু থেকে রিনেম, ডিলিট ও কপি-কাট করুন।</li>
          </ul>
        </div>
      </div>

      {/* Storage Information Widget */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500">
              {stats?.isRealDisk ? 'সার্ভার ডিস্ক স্টোরেজ' : 'মোট ফাইল সাইজ'}
            </div>
            <div className="text-sm font-bold text-slate-700 font-mono">
              {stats 
                ? (stats.isRealDisk ? formatBytes(stats.systemUsedBytes ?? 0) : formatBytes(stats.usedBytes)) 
                : '0 Bytes'}
              {stats?.isRealDisk && stats.totalBytesLimit > 0 && (
                <span className="text-xs text-slate-400 font-normal"> / {formatBytes(stats.totalBytesLimit)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar (Only shown if real disk space info is available) */}
        {stats?.isRealDisk && stats.totalBytesLimit > 0 && (
          <div className="space-y-3 mb-3">
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
              <div 
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${myUsedPercent}%` }}
                title={`আমার ফাইলসমূহ: ${formatBytes(myUsed)}`}
              />
              <div 
                className="bg-slate-400 h-full transition-all duration-500"
                style={{ width: `${otherUsedPercent}%` }}
                title={`অন্যান্য সিস্টেম ফাইলসমূহ: ${formatBytes(otherUsed)}`}
              />
            </div>

            {/* Clear Legends Indicator */}
            <div className="space-y-1.5 text-[10px] text-slate-500 border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block shrink-0" />
                  <span>আমার ফাইলসমূহ</span>
                </span>
                <span className="font-semibold font-mono text-slate-700">{formatBytes(myUsed)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block shrink-0" />
                  <span>অন্যান্য সিস্টেম ফাইল</span>
                </span>
                <span className="font-semibold font-mono text-slate-700">{formatBytes(otherUsed)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-200 inline-block shrink-0" />
                  <span>অব্যবহৃত স্টোরেজ</span>
                </span>
                <span className="font-semibold font-mono text-slate-700">{formatBytes(freeBytes)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats breakdown */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
          <div className="bg-white px-2 py-1.5 rounded border border-slate-100 text-center">
            <span className="block text-slate-400">ফাইল সংখ্যা</span>
            <span className="text-slate-700 font-bold font-mono text-xs">{loading ? '...' : (stats?.fileCount ?? 0)} টি</span>
          </div>
          <div className="bg-white px-2 py-1.5 rounded border border-slate-100 text-center">
            <span className="block text-slate-400">ফোল্ডার সংখ্যা</span>
            <span className="text-slate-700 font-bold font-mono text-xs">{loading ? '...' : (stats?.folderCount ?? 0)} টি</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
