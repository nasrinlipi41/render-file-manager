import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FolderPlus, 
  Search, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  Plus,
  LogOut
} from 'lucide-react';

import { FileItem, StorageStats, ClipboardState, UploadingFile } from './types';
import { getFileTypeCategory, authFetch } from './utils';

import Sidebar from './components/Sidebar';
import Breadcrumbs from './components/Breadcrumbs';
import FileList from './components/FileList';
import ActionBar from './components/ActionBar';
import NewFolderModal from './components/NewFolderModal';
import RenameModal from './components/RenameModal';
import FilePreviewModal from './components/FilePreviewModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import UploadProgressPanel from './components/UploadProgressPanel';
import LoginScreen from './components/LoginScreen';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Navigation & File States
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  
  // Selection, Filter & Search States
  const [selectedItems, setSelectedItems] = useState<FileItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Clipboard (Copy/Cut/Paste)
  const [clipboard, setClipboard] = useState<ClipboardState>({ action: null, sources: [] });

  // Modals & UI States
  const [loading, setLoading] = useState<boolean>(false);
  
  // Upload Queue States and Refs
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const uploading = uploadQueue.some((item) => item.status === 'uploading');
  const activeXhrsRef = useRef<{ [key: string]: XMLHttpRequest }>({});

  const [dragOver, setDragOver] = useState<boolean>(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [activeRenameFile, setActiveRenameFile] = useState<FileItem | null>(null);
  const [activePreviewFile, setActivePreviewFile] = useState<FileItem | null>(null);
  const [itemsToDelete, setItemsToDelete] = useState<FileItem[] | null>(null);

  // Custom Floating Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show Toast Helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Fetch Files for the Current Path
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
      if (!response.ok) {
        throw new Error('ফাইলগুলো লোড করতে ব্যর্থ হয়েছে!');
      }
      const data = await response.json();
      setFiles(data.files || []);
      setSelectedItems([]); // Reset selections on folder changes
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'ডিরেক্টরি রিড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Storage statistics
  const fetchStats = async () => {
    try {
      const response = await authFetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  // Session check on mount
  useEffect(() => {
    const token = localStorage.getItem('ahnaf_auth_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Verify token with server
    authFetch('/api/verify')
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('ahnaf_auth_token');
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        // Safe offline fallback
        setIsAuthenticated(true);
      });
  }, []);

  // Run fetches on load or when currentPath changes (Gated by Authentication)
  useEffect(() => {
    if (isAuthenticated === true) {
      fetchFiles();
      fetchStats();
    }
  }, [currentPath, isAuthenticated]);

  // 3. Handle File Uploads (Granular Parallel Upload Queue with Progress & Cancel)
  const handleUploadFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesArray = Array.from(selectedFiles);
    const targetPath = currentPath; // lock path for this upload batch

    // Create queue items
    const newItems: UploadingFile[] = filesArray.map((file) => {
      const id = `upload-${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      return {
        id,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading'
      };
    });

    // Append to existing queue
    setUploadQueue((prev) => [...prev, ...newItems]);

    // Start each upload in parallel using XMLHttpRequest
    newItems.forEach((item, index) => {
      const file = filesArray[index];
      const { id } = item;

      const xhr = new XMLHttpRequest();
      activeXhrsRef.current[id] = xhr;

      const formData = new FormData();
      formData.append('parentPath', targetPath);
      formData.append('files', file);

      // Track progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadQueue((prev) =>
            prev.map((queueItem) =>
              queueItem.id === id ? { ...queueItem, progress: percent } : queueItem
            )
          );
        }
      };

      // Completed/Response
      xhr.onload = () => {
        delete activeXhrsRef.current[id];
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadQueue((prev) =>
            prev.map((queueItem) =>
              queueItem.id === id ? { ...queueItem, progress: 100, status: 'completed' } : queueItem
            )
          );
          showNotification(`"${file.name}" সফলভাবে আপলোড হয়েছে!`, 'success');
          fetchFiles();
          fetchStats();
        } else {
          let errorMsg = 'আপলোড ব্যর্থ হয়েছে';
          try {
            const data = JSON.parse(xhr.responseText);
            errorMsg = data.error || errorMsg;
          } catch (e) {
            // fallback
          }
          setUploadQueue((prev) =>
            prev.map((queueItem) =>
              queueItem.id === id ? { ...queueItem, status: 'error', error: errorMsg } : queueItem
            )
          );
          showNotification(`"${file.name}" আপলোডে ত্রুটি: ${errorMsg}`, 'error');
        }
      };

      // Error
      xhr.onerror = () => {
        delete activeXhrsRef.current[id];
        setUploadQueue((prev) =>
          prev.map((queueItem) =>
            queueItem.id === id ? { ...queueItem, status: 'error', error: 'নেটওয়ার্ক কানেকশন লস্ট' } : queueItem
          )
        );
        showNotification(`"${file.name}" আপলোড ব্যর্থ হয়েছে`, 'error');
      };

      // Aborted
      xhr.onabort = () => {
        delete activeXhrsRef.current[id];
        setUploadQueue((prev) =>
          prev.map((queueItem) =>
            queueItem.id === id ? { ...queueItem, status: 'cancelled', progress: 0 } : queueItem
          )
        );
        showNotification(`"${file.name}" এর আপলোড বাতিল করা হয়েছে`, 'info');
      };

      xhr.open('POST', '/api/upload');
      const token = localStorage.getItem('ahnaf_auth_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });

    if (fileInputRef.current) fileInputRef.current.value = ''; // clear input
  };

  const handleCancelFile = (id: string) => {
    const xhr = activeXhrsRef.current[id];
    if (xhr) {
      xhr.abort();
    }
  };

  const handleCancelAllUploads = () => {
    Object.keys(activeXhrsRef.current).forEach((id) => {
      const xhr = activeXhrsRef.current[id];
      if (xhr) {
        xhr.abort();
      }
    });
    activeXhrsRef.current = {};
    showNotification('সব ফাইল আপলোড বাতিল করা হয়েছে', 'info');
  };

  const handleClearUploadQueue = () => {
    setUploadQueue([]);
  };

  // Trigger file browser click
  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  // Drag and Drop uploads
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // 4. Create New Folder
  const handleCreateFolder = async (folderName: string) => {
    try {
      const response = await authFetch('/api/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPath: currentPath,
          name: folderName
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ফোল্ডার তৈরি করা যায়নি');
      }

      showNotification('নতুন ফোল্ডার তৈরি হয়েছে!', 'success');
      fetchFiles();
      fetchStats();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  // 5. Rename Single Item
  const handleRenameItem = async (newName: string) => {
    if (!activeRenameFile) return;

    try {
      const response = await authFetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relativePath: activeRenameFile.path,
          newName: newName
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'রিনেম করতে ব্যর্থ!');
      }

      showNotification('সফলভাবে নাম পরিবর্তন করা হয়েছে!', 'success');
      fetchFiles();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  // 6. Delete Selected Items (Used for individual & bulk deletions)
  const handleDeleteItems = async (itemsToDelete: FileItem[]) => {
    try {
      const response = await authFetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paths: itemsToDelete.map(item => item.path)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ডিলিট করতে ব্যর্থ!');
      }

      showNotification('আইটেমগুলো সফলভাবে মুছে ফেলা হয়েছে!', 'success');
      fetchFiles();
      fetchStats();
    } catch (err: any) {
      showNotification(err.message || 'আইটেম মোছা যায়নি', 'error');
    }
  };

  // 7. Clipboard copy/cut/paste
  const handleCopySingle = (file: FileItem) => {
    setClipboard({ action: 'copy', sources: [file] });
    showNotification('ফাইল কপি করা হয়েছে! পেস্ট করার জন্য ডেস্টিনেশন ফোল্ডারে যান।', 'info');
  };

  const handleCutSingle = (file: FileItem) => {
    setClipboard({ action: 'cut', sources: [file] });
    showNotification('ফাইল কাট (Cut) করা হয়েছে! স্থানান্তর করতে ডেস্টিনেশন ফোল্ডারে যান।', 'info');
  };

  const handleBulkCopy = () => {
    setClipboard({ action: 'copy', sources: [...selectedItems] });
    showNotification(`${selectedItems.length}টি আইটেম কপি করা হয়েছে!`, 'info');
    setSelectedItems([]);
  };

  const handleBulkCut = () => {
    setClipboard({ action: 'cut', sources: [...selectedItems] });
    showNotification(`${selectedItems.length}টি আইটেম কাট করা হয়েছে!`, 'info');
    setSelectedItems([]);
  };

  const handlePaste = async () => {
    if (!clipboard.action || clipboard.sources.length === 0) return;

    setLoading(true);
    try {
      const response = await authFetch('/api/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: clipboard.action,
          sources: clipboard.sources.map(src => src.path),
          destination: currentPath
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'পেস্ট করতে ব্যর্থ হয়েছে!');
      }

      showNotification(clipboard.action === 'copy' ? 'ফাইলগুলো কপি করা হয়েছে!' : 'ফাইলগুলো স্থানান্তর করা হয়েছে!', 'success');
      setClipboard({ action: null, sources: [] });
      fetchFiles();
      fetchStats();
    } catch (err: any) {
      showNotification(err.message || 'পেস্ট ব্যর্থ হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ahnaf_auth_token');
    setIsAuthenticated(false);
    showNotification('সফলভাবে লগআউট করা হয়েছে!', 'info');
  };

  // Filter and Search Computation
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Folders are always shown to allow entering directories
    if (file.type === 'directory') return true;

    const category = getFileTypeCategory(file.name);
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'image') return category === 'image';
    if (selectedCategory === 'document') return category === 'document';
    if (selectedCategory === 'audio-video') return category === 'audio' || category === 'video';

    return true;
  });

  // Render loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2 animate-pulse" />
        <p className="text-xs text-slate-500 font-bold">লোড করা হচ্ছে...</p>
      </div>
    );
  }

  // Render Login screen if not authenticated
  if (isAuthenticated === false) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div 
      className="min-h-screen bg-slate-50 flex flex-col font-sans relative text-slate-800"
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Upload Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleUploadFiles(e.target.files)}
        multiple
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {dragOver && (
        <div className="fixed inset-0 bg-blue-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white z-50 pointer-events-none animate-fadeIn">
          <div className="p-8 rounded-full border-4 border-dashed border-white/60 bg-white/10 flex items-center justify-center mb-6 animate-pulse">
            <UploadCloud className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-sans">ফাইলগুলো এখানে ছেড়ে দিন!</h2>
          <p className="text-sm text-white/85 mt-2">ফাইল আপলোড করতে মাউস ড্র্যাগ করে ছেড়ে দিন</p>
        </div>
      )}

      {/* Floating Notifications (Toast) */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slideIn flex items-center gap-3 bg-white border rounded-2xl shadow-2xl px-5 py-3.5 border-slate-100 max-w-sm">
          {toast.type === 'success' && (
            <div className="p-1 rounded-full bg-emerald-50 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="p-1 rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="p-1 rounded-full bg-blue-50 text-blue-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          <p className="text-xs font-semibold text-slate-700 leading-tight flex-1">{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header / App Shell Navbar */}
      <header className="bg-white border-b border-slate-100 h-16 px-6 shrink-0 flex items-center justify-between sticky top-0 z-30">
        {/* Navigation Breadcrumbs */}
        <div className="flex-1 min-w-0 pr-4">
          <Breadcrumbs currentPath={currentPath} onNavigate={setCurrentPath} />
        </div>

        {/* Global actions: Search, Create Folder, Upload */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative hidden md:block w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ফাইলের নাম খুজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
            />
          </div>

          {/* New Folder Button */}
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            title="Create new folder"
          >
            <FolderPlus className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">নতুন ফোল্ডার</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={triggerFileBrowser}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 hover:shadow-lg disabled:opacity-50"
            title="Upload files"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>{uploading ? 'আপলোড হচ্ছে...' : 'ফাইল আপলোড'}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Log out"
            id="logout_btn"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          stats={stats}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          loading={loading}
        />

        {/* Explorer Content Window */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          {/* Mobile search bar */}
          <div className="p-4 bg-white border-b border-slate-150 md:hidden flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ফাইলের নাম খুজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={fetchFiles}
              className="p-2 border border-slate-200 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-500"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Loading Indicator Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-xs font-semibold text-slate-500 font-sans">ফাইল লোড হচ্ছে...</span>
              </div>
            </div>
          )}

          {/* Explorer File list */}
          <FileList
            files={filteredFiles}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onFolderClick={setCurrentPath}
            onFileClick={setActivePreviewFile}
            onRename={setActiveRenameFile}
            onDelete={(file) => setItemsToDelete([file])}
            onCopy={handleCopySingle}
            onCut={handleCutSingle}
            clipboard={clipboard}
            onPaste={handlePaste}
            showNotification={showNotification}
          />
        </main>
      </div>

      {/* Floating Bottom Sticky Action Bar (appears when items are selected) */}
      <ActionBar
        selectedItems={selectedItems}
        onClear={() => setSelectedItems([])}
        onBulkCopy={handleBulkCopy}
        onBulkCut={handleBulkCut}
        onBulkDelete={() => handleDeleteItems(selectedItems)}
      />

      {/* --- MODALS --- */}
      {/* 1. New Folder Modal */}
      {showNewFolderModal && (
        <NewFolderModal
          onClose={() => setShowNewFolderModal(false)}
          onSubmit={handleCreateFolder}
        />
      )}

      {/* 2. Rename Item Modal */}
      {activeRenameFile && (
        <RenameModal
          file={activeRenameFile}
          onClose={() => setActiveRenameFile(null)}
          onSubmit={handleRenameItem}
        />
      )}

      {/* 3. File Preview & Code/Text Editor Modal */}
      {activePreviewFile && (
        <FilePreviewModal
          file={activePreviewFile}
          onClose={() => setActivePreviewFile(null)}
          onRefresh={fetchFiles}
        />
      )}

      {/* 4. Delete Confirmation Modal */}
      {itemsToDelete && (
        <DeleteConfirmModal
          items={itemsToDelete}
          onClose={() => setItemsToDelete(null)}
          onSubmit={() => handleDeleteItems(itemsToDelete)}
        />
      )}

      {/* 5. Granular Upload Progress Panel (Minimizable & Cancelable) */}
      <UploadProgressPanel
        uploadQueue={uploadQueue}
        onCancelFile={handleCancelFile}
        onCancelAll={handleCancelAllUploads}
        onClearQueue={handleClearUploadQueue}
      />
    </div>
  );
}
