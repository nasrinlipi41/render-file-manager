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
}

export interface ClipboardState {
  action: 'copy' | 'cut' | null;
  sources: FileItem[];
}
