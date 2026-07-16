import React, { useState } from 'react';
import { 
  MoreVertical, 
  Trash2, 
  Edit, 
  Copy, 
  Scissors, 
  Download, 
  Eye, 
  FolderOpen,
  Calendar,
  Grid,
  List,
  CheckSquare,
  Square,
  FolderDot,
  Link2
} from 'lucide-react';
import { FileItem, ClipboardState } from '../types';
import { formatBytes, getFileIcon, getFileTypeCategory, formatDate } from '../utils';

interface FileListProps {
  files: FileItem[];
  selectedItems: FileItem[];
  setSelectedItems: (items: FileItem[]) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onFolderClick: (path: string) => void;
  onFileClick: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onCopy: (file: FileItem) => void;
  onCut: (file: FileItem) => void;
  clipboard: ClipboardState;
  onPaste: () => void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function FileList({
  files,
  selectedItems,
  setSelectedItems,
  viewMode,
  setViewMode,
  onFolderClick,
  onFileClick,
  onRename,
  onDelete,
  onCopy,
  onCut,
  clipboard,
  onPaste,
  showNotification
}: FileListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleCopyLink = (file: FileItem) => {
    const origin = window.location.origin.includes('localhost') || window.location.origin.includes('run.app')
      ? 'https://asdev.pro.bd'
      : window.location.origin;
    const link = `${origin}/api/download?path=${encodeURIComponent(file.path)}`;
    
    navigator.clipboard.writeText(link)
      .then(() => {
        if (showNotification) {
          showNotification('ডাউনলোড লিংক কপি করা হয়েছে!', 'success');
        }
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
        if (showNotification) {
          showNotification('লিংক কপি করতে ব্যর্থ হয়েছে!', 'error');
        }
      });
    setActiveMenuId(null);
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === files.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...files]);
    }
  };

  const toggleSelectItem = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    const isSelected = selectedItems.some(item => item.path === file.path);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(item => item.path !== file.path));
    } else {
      setSelectedItems([...selectedItems, file]);
    }
  };

  const handleItemClick = (file: FileItem) => {
    if (file.type === 'directory') {
      onFolderClick(file.path);
    } else {
      onFileClick(file);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (activeMenuId === path) {
      setActiveMenuId(null);
    } else {
      setActiveMenuId(path);
    }
  };

  // Close menus on clicking document
  React.useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Control Toolbar inside Explorer View */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Select All Switch */}
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-100 bg-slate-50"
          >
            {files.length > 0 && selectedItems.length === files.length ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>সব সিলেক্ট করুন ({selectedItems.length}/{files.length})</span>
          </button>

          {/* Paste button if clipboard active */}
          {clipboard.action && (
            <button
              onClick={onPaste}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-3 py-1.5 rounded-lg animate-pulse"
            >
              <FolderDot className="w-4 h-4" />
              <span>পেস্ট করুন ({clipboard.sources.length} আইটেম)</span>
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'grid' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'list' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Files Display Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">ফোল্ডারটি খালি আছে</h3>
            <p className="text-xs text-slate-400 max-w-xs">এই ফোল্ডারে কোনো ফাইল অথবা ডিরেক্টরি পাওয়া যায়নি। নতুন ফাইল আপলোড করুন অথবা ফোল্ডার তৈরি করুন!</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {files.map((file) => {
              const Icon = getFileIcon(file.type, file.name);
              const isSelected = selectedItems.some(item => item.path === file.path);
              const isImg = file.type === 'file' && getFileTypeCategory(file.name) === 'image';
              const isCutSource = clipboard.action === 'cut' && clipboard.sources.some(src => src.path === file.path);
              const isAnyMenuOpen = activeMenuId !== null;
              const isThisMenuOpen = activeMenuId === file.path;

              return (
                <div
                  key={file.path}
                  onClick={() => handleItemClick(file)}
                  className={`relative rounded-xl border p-4 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-200 select-none bg-white ${
                    (!isAnyMenuOpen || isThisMenuOpen) ? 'group' : ''
                  } ${
                    !isAnyMenuOpen ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200' : ''
                  } ${
                    isThisMenuOpen ? 'z-30 shadow-md -translate-y-0.5 border-slate-200 ring-1 ring-blue-500/30' : 'z-0 border-slate-100'
                  } ${
                    isSelected 
                      ? 'border-blue-500 ring-1 ring-blue-500/50 bg-blue-50/10' 
                      : ''
                  } ${isCutSource ? 'opacity-40' : ''}`}
                >
                  {/* Item Selection Checkbox (always visible if selected, otherwise appears on hover) */}
                  <div
                    onClick={(e) => toggleSelectItem(e, file)}
                    className={`absolute top-2 left-2 z-10 w-5 h-5 rounded flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white group-hover:opacity-100 opacity-0'
                    }`}
                  >
                    {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>

                  {/* Actions 3-dot Menu Icon */}
                  <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleMenuClick(e, file.path)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuId === file.path && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-1 w-44 bg-white border border-slate-150 rounded-xl shadow-lg shadow-slate-150/40 py-1.5 z-25 text-left text-xs font-semibold text-slate-600"
                      >
                        <button
                          onClick={() => handleItemClick(file)}
                          className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ওপেন করুন</span>
                        </button>
                        <button
                          onClick={() => onRename(file)}
                          className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>রিনেম</span>
                        </button>
                        <button
                          onClick={() => onCopy(file)}
                          className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>কপি</span>
                        </button>
                        <button
                          onClick={() => onCut(file)}
                          className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>কাট (Cut)</span>
                        </button>
                        {file.type === 'file' && (
                          <>
                            <a
                              href={`/api/download?path=${encodeURIComponent(file.path)}`}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>ডাউনলোড</span>
                            </a>
                            <button
                              onClick={() => handleCopyLink(file)}
                              className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>কপি লিঙ্ক</span>
                            </button>
                          </>
                        )}
                        <hr className="my-1 border-slate-100" />
                        <button
                          onClick={() => onDelete(file)}
                          className="w-full px-3 py-2 hover:bg-slate-55 hover:text-rose-600 flex items-center gap-2 text-rose-500 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ডিলিট</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail / Large Icon Section */}
                  <div className="w-16 h-16 flex items-center justify-center my-3 relative">
                    {isImg ? (
                      <img
                        src={`/api/view?path=${encodeURIComponent(file.path)}`}
                        alt={file.name}
                        className="max-w-full max-h-full rounded-md object-cover shadow-sm bg-slate-50 border border-slate-100"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to Icon if error loading
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Icon className={`w-12 h-12 ${file.type === 'directory' ? 'text-blue-500' : 'text-slate-400'}`} />
                    )}
                  </div>

                  {/* File/Folder Name */}
                  <div className="w-full mt-1">
                    <p className="text-xs font-semibold text-slate-700 truncate px-1 max-w-full" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {file.type === 'directory' ? `${file.itemCount ?? 0}টি আইটেম` : formatBytes(file.size)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left text-slate-600 text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10 text-center"></th>
                  <th className="py-3 px-2">নাম (Name)</th>
                  <th className="py-3 px-4 w-28">সাইজ (Size)</th>
                  <th className="py-3 px-4 w-44">তারিখ (Modified)</th>
                  <th className="py-3 px-4 w-14 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {files.map((file) => {
                  const Icon = getFileIcon(file.type, file.name);
                  const isSelected = selectedItems.some(item => item.path === file.path);
                  const isImg = file.type === 'file' && getFileTypeCategory(file.name) === 'image';
                  const isCutSource = clipboard.action === 'cut' && clipboard.sources.some(src => src.path === file.path);
                  const isAnyMenuOpen = activeMenuId !== null;
                  const isThisMenuOpen = activeMenuId === file.path;

                  return (
                    <tr
                      key={file.path}
                      onClick={() => handleItemClick(file)}
                      className={`cursor-pointer transition-colors ${
                        !isAnyMenuOpen ? 'hover:bg-slate-50/50' : ''
                      } ${
                        isThisMenuOpen ? 'bg-slate-50/80' : ''
                      } ${
                        isSelected ? 'bg-blue-50/20' : ''
                      } ${isCutSource ? 'opacity-40' : ''}`}
                    >
                      {/* Checkbox column */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleSelectItem(e as any, file)}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-600 text-white'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {/* Name Column */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded bg-slate-50 border border-slate-100">
                            {isImg ? (
                              <img
                                src={`/api/view?path=${encodeURIComponent(file.path)}`}
                                alt={file.name}
                                className="w-full h-full object-cover rounded"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            ) : (
                              <Icon className={`w-5 h-5 ${file.type === 'directory' ? 'text-blue-500' : 'text-slate-400'}`} />
                            )}
                          </div>
                          <span className="font-semibold text-slate-700 truncate max-w-sm md:max-w-md block" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                      </td>

                      {/* Size/Item count Column */}
                      <td className="py-3 px-4 text-slate-500 font-mono font-medium">
                        {file.type === 'directory' ? `${file.itemCount ?? 0}টি আইটেম` : formatBytes(file.size)}
                      </td>

                      {/* Modified Date Column */}
                      <td className="py-3 px-4 text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span>{formatDate(file.updatedAt)}</span>
                        </div>
                      </td>

                      {/* 3-dot Menu Actions Column */}
                      <td className={`py-3 px-4 text-center relative ${isThisMenuOpen ? 'z-30' : 'z-0'}`} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleMenuClick(e, file.path)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === file.path && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-4 mt-1 w-44 bg-white border border-slate-150 rounded-xl shadow-lg shadow-slate-150/40 py-1.5 z-25 text-left text-xs font-semibold text-slate-600"
                          >
                            <button
                              onClick={() => handleItemClick(file)}
                              className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ওপেন করুন</span>
                            </button>
                            <button
                              onClick={() => onRename(file)}
                              className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>রিনেম</span>
                            </button>
                            <button
                              onClick={() => onCopy(file)}
                              className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>কপি</span>
                            </button>
                            <button
                              onClick={() => onCut(file)}
                              className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                              <span>কাট (Cut)</span>
                            </button>
                            {file.type === 'file' && (
                              <>
                                <a
                                  href={`/api/download?path=${encodeURIComponent(file.path)}`}
                                  download
                                  className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>ডাউনলোড</span>
                                </a>
                                <button
                                  onClick={() => handleCopyLink(file)}
                                  className="w-full px-3 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                  <span>কপি লিঙ্ক</span>
                                </button>
                              </>
                            )}
                            <hr className="my-1 border-slate-100" />
                            <button
                              onClick={() => onDelete(file)}
                              className="w-full px-3 py-2 hover:bg-slate-55 hover:text-rose-600 flex items-center gap-2 text-rose-500 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ডিলিট</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
