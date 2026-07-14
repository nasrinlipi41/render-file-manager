import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

// Root data store folder for user files
const DATA_STORE_ROOT = path.resolve(process.cwd(), 'data_store');

// Helper to sanitize path and prevent directory traversal attacks
function resolveAndSanitizePath(userPath: string = ''): { absolutePath: string; relativePath: string; isValid: boolean } {
  // Normalize path
  const safeRelativePath = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.resolve(DATA_STORE_ROOT, safeRelativePath);
  
  // Check if it's within the DATA_STORE_ROOT boundaries
  const isValid = absolutePath.startsWith(DATA_STORE_ROOT);
  
  // Compute clean relative path for clients
  const relativePath = path.relative(DATA_STORE_ROOT, absolutePath);
  
  return {
    absolutePath,
    relativePath,
    isValid
  };
}

// Seed initial directories and a welcome file if they do not exist
async function seedInitialData() {
  try {
    if (!fs.existsSync(DATA_STORE_ROOT)) {
      await fs.promises.mkdir(DATA_STORE_ROOT, { recursive: true });
    }

    const initialFolders = ['নথিপত্র (Documents)', 'ছবি (Images)', 'অডিও এবং ভিডিও (Media)'];
    for (const folder of initialFolders) {
      const folderPath = path.join(DATA_STORE_ROOT, folder);
      if (!fs.existsSync(folderPath)) {
        await fs.promises.mkdir(folderPath, { recursive: true });
      }
    }

    // Create a Bengali Welcome file
    const welcomeFilePath = path.join(DATA_STORE_ROOT, 'নথিপত্র (Documents)', 'স্বাগতম.txt');
    if (!fs.existsSync(welcomeFilePath)) {
      const welcomeContent = `স্বাগতম! 

এটি আপনার নিজস্ব আধুনিক ফাইল ম্যানেজার। এই ওয়েবসাইটে আপনি যা যা করতে পারবেন:

১. ফোল্ডার তৈরি (Create Folder): আপনার ফাইলগুলো গুছিয়ে রাখতে নতুন ফোল্ডার তৈরি করতে পারেন।
২. ফাইল আপলোড (Upload File): ড্র্যাগ-অ্যান্ড-ড্রপ অথবা ব্রাউজ করে যেকোনো ফাইল আপলোড করতে পারবেন।
৩. কপি, কাট এবং পেস্ট (Copy, Cut, Paste): সহজেই ফাইল বা ফোল্ডার এক স্থান থেকে অন্য স্থানে কপি বা মুভ করতে পারবেন।
৪. রিনেম এবং ডিলিট (Rename & Delete): যেকোনো ফাইল বা ফোল্ডারের নাম পরিবর্তন এবং স্থায়ীভাবে মুছে ফেলতে পারবেন।
৫. টেক্সট ফাইল এডিটর (Text Editor): টেক্সট ফাইল (.txt, .md, .json ইত্যাদি) সরাসরি ব্রাউজারে দেখতে এবং এডিট করে সেভ করতে পারবেন।
৬. ফাইল প্রিভিউ (Previews): ইমেজ, অডিও, ভিডিও এবং টেক্সট ফাইলগুলো সরাসরি ব্রাউজারেই প্লে বা ভিউ করতে পারবেন।

ওয়েবসাইটটি সম্পূর্ণ রেসপন্সিভ এবং ব্যবহারের জন্য অত্যন্ত সহজ। এটি ব্যবহার করার জন্য আপনাকে ধন্যবাদ!`;
      await fs.promises.writeFile(welcomeFilePath, welcomeContent, 'utf8');
    }

    // Create a demo markdown instructions file
    const markdownFilePath = path.join(DATA_STORE_ROOT, 'নথিপত্র (Documents)', 'নির্দেশনা.md');
    if (!fs.existsSync(markdownFilePath)) {
      const markdownContent = `# ফাইল ম্যানেজার গাইড (File Manager Guide)

আপনার ফাইলগুলো পরিচালনা করার জন্য কিছু প্রয়োজনীয় টিপস:

### ফোল্ডার নেভিগেশন (Folder Navigation)
- যেকোনো ফোল্ডারে প্রবেশ করতে তার ওপর ডাবল-ক্লিক করুন।
- উপরে থাকা **Breadcrumb** ব্যবহার করে আগের যেকোনো ডিরেক্টরিতে ফিরে যেতে পারবেন।

### মাল্টি-সিলেক্ট এবং অপারেশন (Multi-Select & Operations)
- আপনি একসাথে একাধিক ফাইল/ফোল্ডার সিলেক্ট করতে পারেন।
- সিলেক্ট করার পর নিচে একটি **অ্যাকশন বার** দৃশ্যমান হবে যেখান থেকে আপনি কপি, কাট বা ডিলিট করতে পারবেন।

### কি-বোর্ড শর্টকাট (Keyboard Integration)
- আপনার ব্রাউজিং অভিজ্ঞতা সহজ করতে এই ইন্টারফেসটি সুন্দর করে ডিজাইন করা হয়েছে।

ফাইল ম্যানেজারটি উপভোগ করুন!`;
      await fs.promises.writeFile(markdownFilePath, markdownContent, 'utf8');
    }

  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

// Recursive helper to calculate total size of a directory
async function getDirectoryStats(dirPath: string): Promise<{ size: number; fileCount: number; folderCount: number }> {
  let size = 0;
  let fileCount = 0;
  let folderCount = 0;

  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        folderCount++;
        const subStats = await getDirectoryStats(fullPath);
        size += subStats.size;
        fileCount += subStats.fileCount;
        folderCount += subStats.folderCount;
      } else {
        fileCount++;
        try {
          const stat = await fs.promises.stat(fullPath);
          size += stat.size;
        } catch (e) {
          // Ignore files we cannot access
        }
      }
    }
  } catch (err) {
    // Ignore reading errors
  }

  return { size, fileCount, folderCount };
}

// Main server launcher
async function startServer() {
  await seedInitialData();

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- AUTHENTICATION MODULE ---
  const AUTH_TOKEN = 'ahnaf_secure_session_token_2026_07';

  // Public endpoint to login
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'ahnafsaikat08' && password === '280323') {
      return res.json({ success: true, token: AUTH_TOKEN });
    }
    return res.status(401).json({ error: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড!' });
  });

  // Auth check middleware for all other /api/* routes
  app.use('/api', (req, res, next) => {
    if (req.path === '/login' || req.path === '/download' || req.path === '/view') {
      return next();
    }

    // Check header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === `Bearer ${AUTH_TOKEN}`) {
      return next();
    }

    // Check query token
    const queryToken = req.query.token as string;
    if (queryToken && queryToken === AUTH_TOKEN) {
      return next();
    }

    // Check cookies
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const parts = c.trim().split('=');
          return [parts[0], parts.slice(1).join('=')];
        })
      );
      if (cookies.token === AUTH_TOKEN) {
        return next();
      }
    }

    return res.status(401).json({ error: 'অননুমোদিত অ্যাক্সেস! অনুগ্রহ করে লগইন করুন।' });
  });

  // Verification endpoint
  app.get('/api/verify', (req, res) => {
    res.json({ valid: true });
  });

  // Configure multer memory storage
  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit per file
  });

  // --- API ENDPOINTS ---

  // 1. Get Storage Statistics
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await getDirectoryStats(DATA_STORE_ROOT);
      
      let limit = 0;
      let isRealDisk = false;
      let freeBytes = 0;
      let systemUsedBytes = 0;
      let otherFilesBytes = 0;
      
      try {
        if (fs.promises && typeof fs.promises.statfs === 'function') {
          const diskStats = await fs.promises.statfs(DATA_STORE_ROOT);
          const totalDiskBytes = Number(diskStats.blocks) * Number(diskStats.bsize);
          const freeDiskBytes = Number(diskStats.bfree) * Number(diskStats.bsize);
          if (totalDiskBytes > 0) {
            limit = totalDiskBytes;
            freeBytes = freeDiskBytes;
            systemUsedBytes = totalDiskBytes - freeDiskBytes;
            otherFilesBytes = Math.max(0, systemUsedBytes - stats.size);
            isRealDisk = true;
          }
        }
      } catch (e) {
        console.warn('statfs calculation failed, fallback to 0', e);
      }

      res.json({
        usedBytes: stats.size,
        totalBytesLimit: limit,
        freeBytes: freeBytes,
        systemUsedBytes: systemUsedBytes,
        otherFilesBytes: otherFilesBytes,
        fileCount: stats.fileCount,
        folderCount: stats.folderCount,
        isRealDisk: isRealDisk
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. List Files and Directories inside a path
  app.get('/api/files', async (req, res) => {
    try {
      const requestedPath = (req.query.path as string) || '';
      const { absolutePath, relativePath, isValid } = resolveAndSanitizePath(requestedPath);

      if (!isValid) {
        return res.status(400).json({ error: 'অবৈধ ডিরেক্টরি পাথ!' });
      }

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: 'ডিরেক্টরি খুঁজে পাওয়া যায়নি!' });
      }

      const stat = await fs.promises.stat(absolutePath);
      if (!stat.isDirectory()) {
        return res.status(400).json({ error: 'অনুরোধকৃত পাথটি ডিরেক্টরি নয়!' });
      }

      const items = await fs.promises.readdir(absolutePath, { withFileTypes: true });
      const fileList = [];

      for (const item of items) {
        const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
        const itemAbsolutePath = path.join(absolutePath, item.name);
        
        try {
          const itemStat = await fs.promises.stat(itemAbsolutePath);
          const isDir = item.isDirectory();
          
          let subItemsCount = 0;
          if (isDir) {
            try {
              const subItems = await fs.promises.readdir(itemAbsolutePath);
              subItemsCount = subItems.length;
            } catch (e) {
              // Ignore folder counting errors
            }
          }

          fileList.push({
            name: item.name,
            path: itemRelativePath,
            type: isDir ? 'directory' : 'file',
            size: isDir ? 0 : itemStat.size,
            itemCount: isDir ? subItemsCount : undefined,
            extension: isDir ? '' : path.extname(item.name).toLowerCase(),
            updatedAt: itemStat.mtime.toISOString(),
            createdAt: itemStat.birthtime.toISOString()
          });
        } catch (e) {
          // Skip items that error out (e.g., broken symlinks or locked files)
        }
      }

      res.json({
        currentPath: relativePath,
        files: fileList
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Create a New Folder
  app.post('/api/folder', async (req, res) => {
    try {
      const { parentPath, name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'ফোল্ডারের নাম আবশ্যক!' });
      }

      const safeFolderName = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
      if (safeFolderName === '') {
        return res.status(400).json({ error: 'ফোল্ডারের নাম অবৈধ!' });
      }

      const { absolutePath: parentDir, isValid: isParentValid } = resolveAndSanitizePath(parentPath || '');
      if (!isParentValid) {
        return res.status(400).json({ error: 'অবৈধ ডিরেক্টরি পাথ!' });
      }

      const newFolderAbsolutePath = path.join(parentDir, safeFolderName);
      if (fs.existsSync(newFolderAbsolutePath)) {
        return res.status(400).json({ error: 'এই নামের একটি ফোল্ডার ইতিমধ্যেই বিদ্যমান আছে!' });
      }

      await fs.promises.mkdir(newFolderAbsolutePath, { recursive: true });
      res.json({ success: true, message: 'ফোল্ডার সফলভাবে তৈরি হয়েছে!' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Upload Files
  app.post('/api/upload', upload.array('files'), async (req, res) => {
    try {
      const parentPath = req.body.parentPath || '';
      const { absolutePath, isValid } = resolveAndSanitizePath(parentPath);

      if (!isValid) {
        return res.status(400).json({ error: 'অবৈধ ডিরেক্টরি পাথ!' });
      }

      if (!fs.existsSync(absolutePath)) {
        await fs.promises.mkdir(absolutePath, { recursive: true });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'কোনো ফাইল আপলোড করা হয়নি!' });
      }

      for (const file of files) {
        // Keep original filename, sanitizing invalid characters but retaining Bengali characters and standard chars
        const safeName = file.originalname.replace(/[/\\?%*:|"<>\x00-\x1F]/g, '_').trim();
        const destFilePath = path.join(absolutePath, safeName);
        await fs.promises.writeFile(destFilePath, file.buffer);
      }

      res.json({ success: true, message: `${files.length}টি ফাইল সফলভাবে আপলোড হয়েছে!` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4b. Upload from URL Link
  app.post('/api/upload-url', async (req, res) => {
    try {
      const { parentPath, url } = req.body;
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return res.status(400).json({ error: 'অবৈধ লিঙ্ক প্রদান করা হয়েছে!' });
      }

      const { absolutePath, isValid } = resolveAndSanitizePath(parentPath || '');
      if (!isValid) {
        return res.status(400).json({ error: 'অবৈধ ডিরেক্টরি পাথ!' });
      }

      if (!fs.existsSync(absolutePath)) {
        await fs.promises.mkdir(absolutePath, { recursive: true });
      }

      // Fetch the URL
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(400).json({ error: `লিঙ্ক থেকে ফাইল ডাউনলোড করতে ব্যর্থ! স্ট্যাটাস কোড: ${response.status}` });
      }

      // Extract filename
      let filename = '';
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        } else {
          const matchSimple = contentDisposition.match(/filename="?([^";\n]+)"?/i);
          if (matchSimple && matchSimple[1]) {
            filename = matchSimple[1];
          }
        }
      }

      if (!filename) {
        try {
          const urlObj = new URL(url);
          filename = path.basename(urlObj.pathname);
        } catch (e) {}
      }

      filename = filename ? filename.trim() : '';
      filename = filename.split('?')[0].split('#')[0];

      if (!filename) {
        filename = 'downloaded_file';
        const contentType = response.headers.get('content-type');
        if (contentType) {
          const mimeMap: { [key: string]: string } = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'application/pdf': '.pdf',
            'audio/mpeg': '.mp3',
            'video/mp4': '.mp4',
            'application/zip': '.zip',
            'text/plain': '.txt',
            'text/html': '.html',
            'application/json': '.json'
          };
          const ext = mimeMap[contentType.split(';')[0].trim().toLowerCase()];
          if (ext) {
            filename += ext;
          }
        }
      }

      const safeName = filename.replace(/[/\\?%*:|"<>\x00-\x1F]/g, '_').trim();
      const destFilePath = path.join(absolutePath, safeName);

      // Save the file
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(destFilePath, buffer);

      res.json({ 
        success: true, 
        message: 'লিঙ্ক থেকে ফাইল সফলভাবে আপলোড হয়েছে!', 
        file: {
          name: safeName,
          size: buffer.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Delete Files/Folders (Supports multiple deletions)
  app.post('/api/delete', async (req, res) => {
    try {
      const { paths } = req.body; // Expecting array of relative paths
      if (!paths || !Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ error: 'মুছে ফেলার জন্য অন্তত একটি পাথ সিলেক্ট করুন!' });
      }

      for (const relPath of paths) {
        const { absolutePath, isValid } = resolveAndSanitizePath(relPath);
        if (isValid && fs.existsSync(absolutePath)) {
          await fs.promises.rm(absolutePath, { recursive: true, force: true });
        }
      }

      res.json({ success: true, message: 'আইটেমগুলো সফলভাবে মুছে ফেলা হয়েছে!' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Rename/Move a Single Item (Same Folder rename)
  app.post('/api/rename', async (req, res) => {
    try {
      const { relativePath, newName } = req.body;
      if (!relativePath || !newName || typeof newName !== 'string' || newName.trim() === '') {
        return res.status(400).json({ error: 'পূর্বের পাথ এবং নতুন নাম আবশ্যক!' });
      }

      const { absolutePath: srcAbsolutePath, isValid: isSrcValid } = resolveAndSanitizePath(relativePath);
      if (!isSrcValid || !fs.existsSync(srcAbsolutePath)) {
        return res.status(400).json({ error: 'মূল ফাইল বা ফোল্ডারটি খুঁজে পাওয়া যায়নি!' });
      }

      // Safe clean name (allows dots)
      const safeNewName = newName.replace(/[/\\?%*:|"<>]/g, '_').trim();
      const parentDir = path.dirname(srcAbsolutePath);
      const destAbsolutePath = path.join(parentDir, safeNewName);

      if (fs.existsSync(destAbsolutePath)) {
        return res.status(400).json({ error: 'এই নামের ফাইল বা ফোল্ডার ইতিমধ্যেই বিদ্যমান আছে!' });
      }

      await fs.promises.rename(srcAbsolutePath, destAbsolutePath);
      res.json({ success: true, message: 'সফলভাবে নাম পরিবর্তন করা হয়েছে!' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Get File Content (For View/Edit)
  app.get('/api/file-content', async (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'ফাইল পাথ প্রয়োজন!' });
      }

      const { absolutePath, isValid } = resolveAndSanitizePath(filePath);
      if (!isValid || !fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: 'ফাইল খুঁজে পাওয়া যায়নি!' });
      }

      const stat = await fs.promises.stat(absolutePath);
      if (stat.isDirectory()) {
        return res.status(400).json({ error: 'এটি একটি ফোল্ডার, ফাইল নয়!' });
      }

      // Check size (reject reading text files larger than 5MB to prevent memory bloat)
      if (stat.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'এই টেক্সট ফাইলটি অনেক বড় (৫ মেগাবাইটের বেশি)। সরাসরি ব্রাউজারে এডিট করা যাবে না!' });
      }

      const content = await fs.promises.readFile(absolutePath, 'utf8');
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Save Edited File Content
  app.post('/api/save-content', async (req, res) => {
    try {
      const { path: relativeFilePath, content } = req.body;
      if (!relativeFilePath) {
        return res.status(400).json({ error: 'ফাইল পাথ প্রয়োজন!' });
      }

      const { absolutePath, isValid } = resolveAndSanitizePath(relativeFilePath);
      if (!isValid) {
        return res.status(400).json({ error: 'অবৈধ ফাইল পাথ!' });
      }

      await fs.promises.writeFile(absolutePath, content || '', 'utf8');
      res.json({ success: true, message: 'ফাইল সফলভাবে সংরক্ষিত হয়েছে!' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 9. Cut, Copy and Paste Operations
  app.post('/api/paste', async (req, res) => {
    try {
      const { action, sources, destination } = req.body; // action: 'copy' | 'cut', sources: string[], destination: string
      if (!action || !sources || !Array.isArray(sources) || sources.length === 0) {
        return res.status(400).json({ error: 'কপি বা কাট করার জন্য আইটেম এবং ডেস্টিনেশন প্রয়োজন!' });
      }

      const { absolutePath: destDirAbs, isValid: isDestValid } = resolveAndSanitizePath(destination || '');
      if (!isDestValid || !fs.existsSync(destDirAbs)) {
        return res.status(400).json({ error: 'পেস্ট করার ফোল্ডারটি খুঁজে পাওয়া যায়নি!' });
      }

      for (const srcRelPath of sources) {
        const { absolutePath: srcAbs, isValid: isSrcValid } = resolveAndSanitizePath(srcRelPath);
        if (!isSrcValid || !fs.existsSync(srcAbs)) {
          continue; // Skip invalid source files
        }

        const itemName = path.basename(srcAbs);
        let targetAbsPath = path.join(destDirAbs, itemName);

        // Avoid copying a folder into itself (circular check)
        if (targetAbsPath.startsWith(srcAbs + path.sep) || targetAbsPath === srcAbs) {
          if (action === 'cut') {
            return res.status(400).json({ error: `ফোল্ডারকে নিজের ভেতরে স্থানান্তর (Cut) করা সম্ভব নয়!` });
          }
          // If copy, create a duplicate name
          const ext = path.extname(itemName);
          const base = path.basename(itemName, ext);
          targetAbsPath = path.join(destDirAbs, `${base} - কপি${ext}`);
        }

        // Handle duplicates by adding " - কপি" suffix if copying
        if (fs.existsSync(targetAbsPath) && action === 'copy') {
          const ext = path.extname(itemName);
          const base = path.basename(itemName, ext);
          targetAbsPath = path.join(destDirAbs, `${base} - কপি${ext}`);
        }

        if (action === 'copy') {
          // Recursive copy using Node's native cp
          await fs.promises.cp(srcAbs, targetAbsPath, { recursive: true });
        } else if (action === 'cut') {
          // If destination exists, remove first to prevent rename failure
          if (fs.existsSync(targetAbsPath)) {
            await fs.promises.rm(targetAbsPath, { recursive: true, force: true });
          }
          await fs.promises.rename(srcAbs, targetAbsPath);
        }
      }

      res.json({ 
        success: true, 
        message: action === 'copy' ? 'ফাইলগুলো সফলভাবে কপি পেস্ট করা হয়েছে!' : 'ফাইলগুলো সফলভাবে মুভ করা হয়েছে!' 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 10. Direct File Stream / Download Handler
  app.get('/api/download', async (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).send('ফাইল পাথ প্রয়োজন!');
      }

      const { absolutePath, isValid } = resolveAndSanitizePath(filePath);
      if (!isValid || !fs.existsSync(absolutePath)) {
        return res.status(404).send('ফাইল খুঁজে পাওয়া যায়নি!');
      }

      const stat = await fs.promises.stat(absolutePath);
      if (stat.isDirectory()) {
        return res.status(400).send('ডিরেক্টরি ডাউনলোড সমর্থিত নয়!');
      }

      const fileName = path.basename(absolutePath);
      res.download(absolutePath, fileName);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // 11. View Raw Media/Files Directly
  app.get('/api/view', async (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).send('ফাইল পাথ প্রয়োজন!');
      }

      const { absolutePath, isValid } = resolveAndSanitizePath(filePath);
      if (!isValid || !fs.existsSync(absolutePath)) {
        return res.status(404).send('ফাইল খুঁজে পাওয়া যায়নি!');
      }

      const stat = await fs.promises.stat(absolutePath);
      if (stat.isDirectory()) {
        return res.status(400).send('ডিরেক্টরি প্রদর্শন সম্ভব নয়!');
      }

      res.sendFile(absolutePath);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });


  // --- VITE DEV OR PRODUCTION HANDLERS ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
