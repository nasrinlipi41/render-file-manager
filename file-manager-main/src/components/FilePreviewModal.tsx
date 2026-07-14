import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Save, 
  FileText, 
  Play, 
  Pause,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, getFileTypeCategory, formatDate, authFetch } from '../utils';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function FilePreviewModal({ file, onClose, onRefresh }: FilePreviewModalProps) {
  if (!file) return null;

  const category = getFileTypeCategory(file.name);
  const token = localStorage.getItem('ahnaf_auth_token') || '';
  const [textContent, setTextContent] = useState<string>('');
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch text content if the file is a text/code file
  useEffect(() => {
    if (category === 'document' || category === 'code') {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      // Only fetch content for actual text-based file extensions
      const textExtensions = ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'css', 'html', 'py', 'xml', 'csv', 'yaml', 'yml'];
      
      if (textExtensions.includes(ext) || file.size < 50000) {
        setLoadingText(true);
        setEditing(false);
        setSaveStatus('idle');
        authFetch(`/api/file-content?path=${encodeURIComponent(file.path)}`)
          .then(res => {
            if (!res.ok) throw new Error('ফাইল কনটেন্ট পড়তে ব্যর্থ হয়েছে!');
            return res.json();
          })
          .then(data => {
            setTextContent(data.content);
            setLoadingText(false);
          })
          .catch(err => {
            console.error(err);
            setErrorMessage(err.message || 'টেক্সট কনটেন্ট লোড করতে ব্যর্থ হয়েছে');
            setLoadingText(false);
          });
      }
    }
  }, [file, category]);

  const handleSaveText = async () => {
    setSaveStatus('saving');
    try {
      const response = await authFetch('/api/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: file.path,
          content: textContent
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'সংরক্ষণ করতে ব্যর্থ!');
      }

      setSaveStatus('success');
      onRefresh(); // Refresh current directory to show updated size
      setTimeout(() => {
        setSaveStatus('idle');
        setEditing(false);
      }, 1500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err.message || 'ফাইলটি সেভ করা যায়নি');
    }
  };

  const renderPreviewContent = () => {
    switch (category) {
      case 'image':
        return (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl max-h-[500px] overflow-hidden group relative">
            <img
              src={`/api/view?path=${encodeURIComponent(file.path)}`}
              alt={file.name}
              className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg select-none"
              referrerPolicy="no-referrer"
            />
          </div>
        );

      case 'audio':
        return (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-inner max-w-md mx-auto w-full">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 shadow-md">
              <Play className="w-8 h-8 fill-blue-600" />
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-slate-800 text-sm truncate max-w-xs">{file.name}</h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">{formatBytes(file.size)}</p>
            </div>
            <audio
              src={`/api/view?path=${encodeURIComponent(file.path)}`}
              controls
              className="w-full h-10 mt-2"
              autoPlay={false}
            />
          </div>
        );

      case 'video':
        return (
          <div className="bg-black rounded-xl overflow-hidden shadow-lg max-w-2xl mx-auto w-full">
            <video
              src={`/api/view?path=${encodeURIComponent(file.path)}`}
              controls
              className="w-full max-h-[360px] object-contain"
              autoPlay={false}
            />
          </div>
        );

      case 'document':
      case 'code':
        const isEditable = ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'css', 'html', 'py', 'xml', 'csv', 'yaml', 'yml'].includes(file.name.split('.').pop()?.toLowerCase() || '');
        if (loadingText) {
          return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <span className="text-xs">ফাইল লোড হচ্ছে...</span>
            </div>
          );
        }

        if (isEditable) {
          return (
            <div className="flex flex-col gap-3 h-full max-h-[500px]">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs">
                <span className="text-slate-500 font-medium">সম্পাদনা মোড: {editing ? 'চালু' : 'বন্ধ'}</span>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-2.5 py-1 text-blue-600 hover:bg-blue-100/50 bg-blue-50 rounded font-bold transition-all"
                  >
                    এডিট করুন
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      disabled={saveStatus === 'saving'}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 bg-slate-150 rounded font-bold"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={handleSaveText}
                      disabled={saveStatus === 'saving'}
                      className="px-2.5 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      {saveStatus === 'saving' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>সেভ করুন</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Success/Error Feedback Alerts */}
              {saveStatus === 'success' && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>ফাইল সফলভাবে সংরক্ষিত হয়েছে!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="bg-rose-50 text-rose-700 border border-rose-100 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Text Area */}
              <div className="relative border border-slate-200 rounded-xl overflow-hidden flex-1 flex">
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={!editing}
                  className={`w-full h-80 p-4 font-mono text-xs focus:outline-none resize-none leading-relaxed bg-slate-50/50 ${
                    editing ? 'bg-white cursor-text focus:ring-1 focus:ring-blue-500/50' : 'cursor-not-allowed bg-slate-50'
                  }`}
                  placeholder="ফাইলের ভেতরের তথ্য এখানে লিখুন..."
                />
              </div>
            </div>
          );
        }

        // Fallback for PDF or uneditable doc
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-700 text-sm mb-1">{file.name}</h4>
            <p className="text-xs text-slate-400 font-mono mb-4">{formatBytes(file.size)}</p>
            <a
              href={`/api/download?path=${encodeURIComponent(file.path)}`}
              download
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-100 hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>ফাইলটি ডাউনলোড করুন</span>
            </a>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <div className="w-14 h-14 bg-slate-150 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 mb-4 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-700 text-sm mb-1">{file.name}</h4>
            <p className="text-xs text-slate-400 font-mono mb-4">{formatBytes(file.size)}</p>
            <a
              href={`/api/download?path=${encodeURIComponent(file.path)}`}
              download
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-100 hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>ফাইলটি ডাউনলোড করুন</span>
            </a>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="min-w-0 pr-4">
            <h3 className="font-bold text-slate-800 text-base truncate" title={file.name}>
              {file.name}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              পাথ: <span className="text-slate-600">{file.path || 'Root'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Viewer Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {renderPreviewContent()}
        </div>

        {/* Footer Statistics/Download */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div className="space-y-1">
            <div>ফাইলের সাইজ: <span className="font-mono text-slate-700">{formatBytes(file.size)}</span></div>
            <div>সর্বশেষ পরিবর্তন: <span className="text-slate-700">{formatDate(file.updatedAt)}</span></div>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/download?path=${encodeURIComponent(file.path)}`}
              download
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all font-bold"
            >
              <Download className="w-4 h-4" />
              <span>ডাউনলোড</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
