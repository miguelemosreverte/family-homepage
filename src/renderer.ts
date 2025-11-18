const { ipcRenderer } = require('electron');

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let isRecordingVoice = false;
let isRecordingVideo = false;
let mediaStream: MediaStream | null = null;
let deviceName = '';

// Get device name on startup
ipcRenderer.invoke('get-device-name').then((name: string) => {
    deviceName = name;
    console.log('Device name:', deviceName);
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Family Homepage loaded!');

    const voiceBtn = document.getElementById('voiceBtn') as HTMLButtonElement;
    const videoBtn = document.getElementById('videoBtn') as HTMLButtonElement;
    const imageBtn = document.getElementById('imageBtn') as HTMLButtonElement;
    const imageInput = document.getElementById('imageInput') as HTMLInputElement;
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;

    voiceBtn?.addEventListener('click', toggleVoiceRecording);
    videoBtn?.addEventListener('click', toggleVideoRecording);
    imageBtn?.addEventListener('click', () => imageInput?.click());
    imageInput?.addEventListener('change', handleImageUpload);
    sendBtn?.addEventListener('click', sendTextMessage);

    // Listen for new messages from git polling
    ipcRenderer.on('new-messages', () => {
        console.log('New messages received!');
        loadNotes();
    });

    messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendTextMessage();
        }
    });

    loadNotes();
});

async function toggleVoiceRecording() {
    const btn = document.getElementById('voiceBtn') as HTMLButtonElement;

    if (!isRecordingVoice) {
        try {
            btn.textContent = '🔄 Starting...';

            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            mediaRecorder = new MediaRecorder(mediaStream);
            recordedChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                await saveMediaFile(blob, 'audio');
                cleanupMediaStream();
            };

            mediaRecorder.start(1000);
            isRecordingVoice = true;
            btn.textContent = '⏹️ Stop Voice';
            btn.classList.add('recording');

        } catch (err: any) {
            console.error('Microphone error:', err);
            btn.textContent = '🎤 Voice';
            alert('Microphone access denied: ' + err.message);
        }
    } else {
        mediaRecorder?.stop();
        isRecordingVoice = false;
        btn.textContent = '🎤 Voice';
        btn.classList.remove('recording');
    }
}

async function toggleVideoRecording() {
    const btn = document.getElementById('videoBtn') as HTMLButtonElement;

    if (!isRecordingVideo) {
        try {
            btn.textContent = '🔄 Starting...';

            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            });

            const preview = document.getElementById('videoPreview') as HTMLVideoElement;
            if (preview) {
                preview.srcObject = mediaStream;
                preview.style.display = 'block';
                preview.play();
            }

            mediaRecorder = new MediaRecorder(mediaStream);
            recordedChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                await saveMediaFile(blob, 'video');

                const preview = document.getElementById('videoPreview') as HTMLVideoElement;
                if (preview) {
                    preview.style.display = 'none';
                    preview.srcObject = null;
                }

                cleanupMediaStream();
            };

            mediaRecorder.start(1000);
            isRecordingVideo = true;
            btn.textContent = '⏹️ Stop Video';
            btn.classList.add('recording');

        } catch (err: any) {
            console.error('Camera error:', err);
            btn.textContent = '📹 Video';
            alert('Camera access denied: ' + err.message);
        }
    } else {
        mediaRecorder?.stop();
        isRecordingVideo = false;
        btn.textContent = '📹 Video';
        btn.classList.remove('recording');
    }
}

function cleanupMediaStream() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}

async function saveMediaFile(blob: Blob, type: string) {
    try {
        const reader = new FileReader();

        reader.onloadend = async () => {
            const dataURL = reader.result as string;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${deviceName}-${type}-${timestamp}.webm`;

            const result = await ipcRenderer.invoke('save-media', filename, dataURL);

            if (result.success) {
                console.log('Media saved:', filename);
                loadNotes();
            } else {
                alert('Failed to save: ' + result.error);
            }
        };

        reader.readAsDataURL(blob);
    } catch (err: any) {
        console.error('Save error:', err);
        alert('Failed to save: ' + err.message);
    }
}

async function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
        const dataURL = reader.result as string;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `${deviceName}-image-${timestamp}.${extension}`;

        const result = await ipcRenderer.invoke('save-media', filename, dataURL);

        if (result.success) {
            console.log('Image uploaded:', filename);
            loadNotes();
            input.value = ''; // Reset input
        } else {
            alert('Failed to upload image: ' + result.error);
        }
    };

    reader.readAsDataURL(file);
}

async function sendTextMessage() {
    const input = document.getElementById('messageInput') as HTMLTextAreaElement;
    const text = input.value.trim();

    if (!text) return;

    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `note-${timestamp}.md`;

        const result = await ipcRenderer.invoke('save-note', filename, text);

        if (result.success) {
            input.value = '';
            loadNotes();
        } else {
            alert('Failed to save note: ' + result.error);
        }
    } catch (err: any) {
        console.error('Send error:', err);
        alert('Failed to send: ' + err.message);
    }
}

async function loadNotes() {
    try {
        const result = await ipcRenderer.invoke('load-notes');

        if (result.success) {
            displayNotes(result.notes);
        }
    } catch (err) {
        console.error('Load notes error:', err);
    }
}

function displayNotes(notes: any[]) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    console.log('displayNotes called with:', notes);

    if (!notes || notes.length === 0) {
        container.innerHTML = '<div class="empty-message">No notes yet. Start creating some!</div>';
        return;
    }

    container.innerHTML = '';

    notes.forEach(note => {
        console.log('Processing note:', note.file, 'content:', note.content ? 'YES' : 'NO');

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date(note.updated).toLocaleString();

        const content = document.createElement('div');
        content.className = 'message-content';

        const filename = note.file;
        if (filename.endsWith('.md')) {
            console.log('Displaying markdown:', filename, 'content:', note.content);
            content.textContent = note.content || note.name;
        } else if (filename.includes('image') || filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
            console.log('Displaying image:', filename);
            // Check image files
            const img = document.createElement('img');
            img.src = 'file://' + note.path;  // Convert to file:// URL
            img.style.maxWidth = '100%';
            img.style.borderRadius = '12px';
            img.onerror = () => console.error('Failed to load image:', note.path);
            content.appendChild(img);
        } else if (filename.includes('video')) {
            console.log('Displaying video:', filename);
            // Check video FIRST before checking .webm extension
            const video = document.createElement('video');
            video.controls = true;
            video.src = 'file://' + note.path;  // Convert to file:// URL
            video.style.maxWidth = '100%';
            video.onerror = () => console.error('Failed to load video:', note.path);
            content.appendChild(video);
        } else if (filename.includes('audio') || filename.endsWith('.webm')) {
            console.log('Displaying audio:', filename);
            // Audio check second
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = 'file://' + note.path;  // Convert to file:// URL
            audio.onerror = () => console.error('Failed to load audio:', note.path);
            content.appendChild(audio);
        } else {
            console.log('WARNING: Unknown file type:', filename);
        }

        messageDiv.appendChild(timestamp);
        messageDiv.appendChild(content);
        container.appendChild(messageDiv);
    });

    // Scroll to bottom after rendering
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}
