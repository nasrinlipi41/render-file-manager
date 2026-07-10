import { 
  FileText, 
  Image, 
  FileAudio, 
  FileVideo, 
  FileCode, 
  FileSpreadsheet, 
  Presentation, 
  FileArchive, 
  File, 
  Folder 
} from 'lucide-react';

// Format bytes into readable format
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Map file names/extensions to file types
export function getFileTypeCategory(fileName: string): 'image' | 'document' | 'audio' | 'video' | 'code' | 'archive' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  if (['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'rtf', 'md'].includes(ext)) {
    return 'document';
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'].includes(ext)) {
    return 'video';
  }
  if (['html', 'css', 'js', 'ts', 'tsx', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'sh', 'php', 'rb'].includes(ext)) {
    return 'code';
  }
  if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2'].includes(ext)) {
    return 'archive';
  }
  return 'other';
}

// Get the corresponding Lucide Icon for a file
export function getFileIcon(type: 'file' | 'directory', fileName: string) {
  if (type === 'directory') return Folder;
  
  const category = getFileTypeCategory(fileName);
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  switch (category) {
    case 'image':
      return Image;
    case 'document':
      if (ext === 'pdf') return FileText; // or can use custom for PDF
      if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
      if (['ppt', 'pptx'].includes(ext)) return Presentation;
      return FileText;
    case 'audio':
      return FileAudio;
    case 'video':
      return FileVideo;
    case 'code':
      return FileCode;
    case 'archive':
      return FileArchive;
    default:
      return File;
  }
}

// Format Date nicely
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}
