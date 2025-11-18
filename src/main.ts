import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import AutoLaunch from 'auto-launch';

const execAsync = promisify(exec);

// Configure auto-launch
const autoLauncher = new AutoLaunch({
    name: 'Family Homepage',
    path: app.getPath('exe'),
});

// Enable auto-launch
autoLauncher.enable().catch((err: any) => {
    console.log('Auto-launch setup error:', err);
});

const notesDir = path.join(app.getPath('home'), 'Desktop', 'FamilyHomepage', 'notes');
const deviceName = os.hostname().replace(/[^a-zA-Z0-9]/g, '-'); // Unique device identifier

let mainWindow: BrowserWindow | null = null;
let lastCommitHash = '';

// Ensure notes directory exists
if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });

    // Initialize git repo with LFS
    exec(`cd "${notesDir}" && git init && git lfs install && git lfs track "*.webm" && git lfs track "*.mp4" && git lfs track "*.jpg" && git lfs track "*.jpeg" && git lfs track "*.png" && git lfs track "*.gif" && git add .gitattributes && git commit --allow-empty -m "Initial commit with LFS"`, (err) => {
        if (err) console.error('Git init error:', err);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        title: 'Family Homepage',
        icon: path.join(__dirname, '../icon.icns'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../index.html'));

    // Clear badge when window is focused
    mainWindow.on('focus', () => {
        if (process.platform === 'darwin' && app.dock) {
            app.dock.setBadge('');
        }
    });

    // Open DevTools only in development (use Cmd+Option+I to open manually)
    // mainWindow.webContents.openDevTools();

    // Start Git polling after window is created
    startGitPolling();
}

// Save note
ipcMain.handle('save-note', async (_event, filename: string, content: string) => {
    try {
        const filePath = path.join(notesDir, filename);
        fs.writeFileSync(filePath, content);

        // Git commit
        await execAsync(`cd "${notesDir}" && git add "${filename}" && git commit -m "Add ${filename}"`);

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// Save media file
ipcMain.handle('save-media', async (_event, filename: string, dataURL: string) => {
    try {
        const filePath = path.join(notesDir, filename);
        const base64Data = dataURL.replace(/^data:\w+\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        fs.writeFileSync(filePath, buffer);

        // Git commit
        await execAsync(`cd "${notesDir}" && git add "${filename}" && git commit -m "Add ${filename}"`);

        return { success: true, path: filePath };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// Load notes
ipcMain.handle('load-notes', async () => {
    try {
        const files = fs.readdirSync(notesDir);
        console.log('All files in notes directory:', files);

        const notes = files
            .filter(f => !f.startsWith('.'))  // Skip hidden files
            .filter(f => {
                // Only allow specific file types
                return f.endsWith('.md') ||
                       f.endsWith('.webm') ||
                       f.endsWith('.mp4') ||
                       f.endsWith('.jpg') ||
                       f.endsWith('.jpeg') ||
                       f.endsWith('.png') ||
                       f.endsWith('.gif');
            })
            .map(f => {
                const filePath = path.join(notesDir, f);
                const stats = fs.statSync(filePath);
                const note: any = {
                    file: f,
                    name: f.replace(/\.\w+$/, ''),
                    updated: stats.mtime.toISOString(),
                    size: stats.size,
                    path: filePath  // Full absolute path
                };

                // Read content for markdown files ONLY - never read binary files
                if (f.endsWith('.md')) {
                    try {
                        note.content = fs.readFileSync(filePath, 'utf-8');
                    } catch (err) {
                        note.content = '';
                    }
                }
                // For all other files, do NOT read content - just metadata

                return note;
            })
            .sort((a, b) => new Date(a.updated).getTime() - new Date(b.updated).getTime());  // Oldest first

        console.log('Filtered notes:', notes.map(n => ({ file: n.file, hasContent: !!n.content })));
        return { success: true, notes };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// Get device name for renderer
ipcMain.handle('get-device-name', async () => {
    return deviceName;
});

// Git polling - check for new commits every minute
async function startGitPolling() {
    // Get initial commit hash
    try {
        const { stdout } = await execAsync(`cd "${notesDir}" && git rev-parse HEAD 2>/dev/null || echo ""`);
        lastCommitHash = stdout.trim();
    } catch (err) {
        console.log('No commits yet');
    }

    // Poll every minute
    setInterval(async () => {
        try {
            // Fetch from remote
            await execAsync(`cd "${notesDir}" && git fetch 2>/dev/null || true`);

            // Get current remote HEAD
            const { stdout } = await execAsync(`cd "${notesDir}" && git rev-parse origin/main 2>/dev/null || git rev-parse origin/master 2>/dev/null || echo ""`);
            const remoteHash = stdout.trim();

            if (remoteHash && remoteHash !== lastCommitHash) {
                console.log('New commits detected! Pulling...');

                // Pull changes
                await execAsync(`cd "${notesDir}" && git pull --rebase 2>/dev/null || true`);

                // Update hash
                const { stdout: newHash } = await execAsync(`cd "${notesDir}" && git rev-parse HEAD`);
                lastCommitHash = newHash.trim();

                // Bring window to front and notify
                if (mainWindow) {
                    // Restore from minimized state if needed
                    if (mainWindow.isMinimized()) {
                        mainWindow.restore();
                    }

                    mainWindow.show();
                    mainWindow.focus();
                    mainWindow.flashFrame(true);

                    // macOS dock notification - bounce icon
                    if (process.platform === 'darwin' && app.dock) {
                        app.dock.bounce('critical'); // 'critical' bounces until user clicks
                        app.dock.setBadge('•'); // Show notification badge
                    }

                    // Send event to renderer
                    mainWindow.webContents.send('new-messages');
                }
            }
        } catch (err) {
            // Silently fail - might not have remote yet
            console.log('Git poll error (expected if no remote):', err);
        }
    }, 60000); // Every 60 seconds
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
