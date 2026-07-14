export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  itemCount?: number;
  extension?: string;
  updatedAt: string;
  createdAt: string;
}

export interface StorageStats {
  usedBytes: number;
  totalBytesLimit: number;
  fileCount: number;
  folderCount: number;
  isRealDisk?: boolean;
  freeBytes?: number;
  systemUsedBytes?: number;
  otherFilesBytes?: number;
}

export interface ClipboardState {
  action: 'copy' | 'cut' | null;
  sources: FileItem[];
}

export interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'cancelled' | 'error';
  error?: string;
  xhr?: XMLHttpRequest;
}
