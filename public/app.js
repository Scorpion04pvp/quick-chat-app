// Antigravity Chat Application - Client Logic

let currentUser = null;
let activeRecipient = null; // username or 'global'
let socket = null;
let currentTab = 'contacts'; // 'contacts' | 'global'
let contacts = [];

// Audio recording state
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingSeconds = 0;
let isRecordingCancelled = false;

// Audio player state
let currentlyPlayingAudio = null;
let currentlyPlayingBtn = null;

// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const usernameInput = document.getElementById('usernameInput');
const avatarPreview = document.getElementById('avatarPreview');
const customAvatarInput = document.getElementById('customAvatarInput');
const avatarPresets = document.querySelectorAll('.preset-img');

const currentUserAvatar = document.getElementById('currentUserAvatar');
const currentUserName = document.getElementById('currentUserName');
const logoutBtn = document.getElementById('logoutBtn');

const openAddContactBtn = document.getElementById('openAddContactBtn');
const addContactModal = document.getElementById('addContactModal');
const newContactInput = document.getElementById('newContactInput');
const confirmAddContactBtn = document.getElementById('confirmAddContactBtn');
const cancelAddContactBtn = document.getElementById('cancelAddContactBtn');
const contactError = document.getElementById('contactError');

const tabBtns = document.querySelectorAll('.tab-btn');
const contactsList = document.getElementById('contactsList');

const chatArea = document.getElementById('chatArea');
const sidebar = document.getElementById('sidebar');
const backToSidebarBtn = document.getElementById('backToSidebarBtn');

const activeChatAvatar = document.getElementById('activeChatAvatar');
const activeChatName = document.getElementById('activeChatName');
const activeChatStatus = document.getElementById('activeChatStatus');
const activeChatStatusIndicator = document.getElementById('activeChatStatusIndicator');

const messagesViewport = document.getElementById('messagesViewport');
const noChatPlaceholder = document.getElementById('noChatPlaceholder');
const messagesList = document.getElementById('messagesList');
const typingIndicator = document.getElementById('typingIndicator');
const typingText = document.getElementById('typingText');

const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const imageUploadInput = document.getElementById('imageUploadInput');
const recordVocalBtn = document.getElementById('recordVocalBtn');

const normalControls = document.getElementById('normalControls');
const recordingBar = document.getElementById('recordingBar');
const recordingTimer = document.getElementById('recordingTimer');
const cancelRecordBtn = document.getElementById('cancelRecordBtn');
const sendRecordBtn = document.getElementById('sendRecordBtn');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeLightbox = document.getElementById('closeLightbox');

// Initialize Lucide Icons
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Format time
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// -------------------------------------------------------------
// USER LOGIN & PROFILE LOGIC
// -------------------------------------------------------------

// Select preset avatar
avatarPresets.forEach(preset => {
  preset.addEventListener('click', () => {
    avatarPresets.forEach(p => p.classList.remove('active'));
    preset.classList.add('active');
    avatarPreview.src = preset.dataset.src;
  });
});

// Upload custom avatar
customAvatarInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.url) {
      avatarPreview.src = data.url;
      avatarPresets.forEach(p => p.classList.remove('active'));
    }
  } catch (err) {
    alert('تعذر رفع الصورة، حاول مرة أخرى');
  }
});

// Submit Login
loginBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if (!username) {
    usernameInput.focus();
    usernameInput.style.borderColor = '#ef4444';
    return;
  }

  const avatarUrl = avatarPreview.src;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, avatarUrl })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('chatapp_user', JSON.stringify(currentUser));
      loginModal.classList.remove('active');
      setupApp();
    } else {
      alert(data.error || 'حدث خطأ أثناء الدخول');
    }
  } catch (err) {
    alert('فشل الاتصال بالخادم');
  }
});

usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

// Logout / Switch account
logoutBtn.addEventListener('click', () => {
  if (confirm('هل ترغب في تسجيل الخروج أو تغيير الحساب؟')) {
    localStorage.removeItem('chatapp_user');
    window.location.reload();
  }
});

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------

function init() {
  refreshIcons();
  const saved = localStorage.getItem('chatapp_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      loginModal.classList.remove('active');
      setupApp();
      return;
    } catch (e) {
      localStorage.removeItem('chatapp_user');
    }
  }
  loginModal.classList.add('active');
}

function setupApp() {
  currentUserName.textContent = currentUser.username;
  currentUserAvatar.src = currentUser.avatarUrl;

  initSocket();
  loadContacts();
}

// -------------------------------------------------------------
// SOCKET.IO REALTIME CONNECTION
// -------------------------------------------------------------

function initSocket() {
  socket = io();

  socket.on('connect', () => {
    socket.emit('user_join', { username: currentUser.username });
  });

  socket.on('user_status', ({ username, online }) => {
    // Update contact online status in list
    const c = contacts.find(x => x.username.toLowerCase() === username.toLowerCase());
    if (c) {
      c.online = online;
      renderContactsList();
    }
    // Update active chat if currently talking to this user
    if (activeRecipient && activeRecipient.toLowerCase() === username.toLowerCase()) {
      updateActiveChatHeaderStatus(online);
    }
  });

  socket.on('new_message', (msg) => {
    const isFromMe = msg.sender.toLowerCase() === currentUser.username.toLowerCase();
    const isRelevantToCurrentChat =
      (activeRecipient === 'global' && msg.recipient.toLowerCase() === 'global') ||
      (activeRecipient &&
        ((msg.sender.toLowerCase() === activeRecipient.toLowerCase() && msg.recipient.toLowerCase() === currentUser.username.toLowerCase()) ||
         (isFromMe && msg.recipient.toLowerCase() === activeRecipient.toLowerCase())));

    if (isRelevantToCurrentChat) {
      appendMessageToUI(msg);
      messagesViewport.scrollTop = messagesViewport.scrollHeight;
    }

    // Update contacts list last message
    loadContacts();
  });

  socket.on('user_typing', ({ sender, recipient, isTyping }) => {
    if (activeRecipient && activeRecipient.toLowerCase() === sender.toLowerCase()) {
      if (isTyping) {
        typingText.textContent = `${sender} يكتب الآن...`;
        typingIndicator.style.display = 'flex';
      } else {
        typingIndicator.style.display = 'none';
      }
    }
  });
}

// -------------------------------------------------------------
// CONTACTS MANAGEMENT
// -------------------------------------------------------------

async function loadContacts() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/contacts?username=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();
    contacts = data.contacts || [];
    renderContactsList();
  } catch (err) {
    console.error('Failed to load contacts', err);
  }
}

function renderContactsList() {
  contactsList.innerHTML = '';

  if (contacts.length === 0) {
    contactsList.innerHTML = `
      <div style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">
        لا توجد جهات اتصال بعد.<br>
        اضغط على <b>إضافة شخص جديد</b> بالأعلى أو انتقل إلى <b>الغرفة العامة</b> للتحدث مع المتصلين.
      </div>
    `;
    return;
  }

  contacts.forEach(c => {
    const card = document.createElement('div');
    card.className = `contact-card ${activeRecipient && activeRecipient.toLowerCase() === c.username.toLowerCase() ? 'active' : ''}`;
    
    let lastMsgText = 'لا توجد رسائل سابقة';
    if (c.lastMessage) {
      if (c.lastMessage.type === 'image') lastMsgText = '📷 صورة';
      else if (c.lastMessage.type === 'audio') lastMsgText = '🎙️ رسالة صوتية (فوكال)';
      else lastMsgText = c.lastMessage.content;
    }

    card.innerHTML = `
      <div class="avatar-container">
        <img src="${c.avatarUrl || '/avatars/avatar-1.svg'}" alt="${c.username}">
        <span class="status-indicator ${c.online ? 'online' : ''}"></span>
      </div>
      <div class="contact-info">
        <div class="contact-top">
          <span class="contact-name">${c.username}</span>
          <span class="contact-time">${c.lastMessage ? formatTime(c.lastMessage.timestamp) : ''}</span>
        </div>
        <p class="contact-last-msg">${lastMsgText}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      openChatWith(c.username, c.avatarUrl, c.online);
    });

    contactsList.appendChild(card);
  });
}

// Tab Switching (Contacts vs Global Lounge)
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;

    if (currentTab === 'global') {
      openChatWith('global', '/avatars/avatar-1.svg', true, 'الغرفة العامة (الكل)');
    } else {
      renderContactsList();
    }
  });
});

// Add Contact Modal
openAddContactBtn.addEventListener('click', () => {
  newContactInput.value = '';
  contactError.style.display = 'none';
  addContactModal.classList.add('active');
  newContactInput.focus();
});

cancelAddContactBtn.addEventListener('click', () => {
  addContactModal.classList.remove('active');
});

confirmAddContactBtn.addEventListener('click', async () => {
  const targetUser = newContactInput.value.trim();
  if (!targetUser) return;

  try {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser.username,
        contactUsername: targetUser
      })
    });
    const data = await res.json();

    if (data.success) {
      addContactModal.classList.remove('active');
      await loadContacts();
      openChatWith(data.contact.username, data.contact.avatarUrl, data.contact.online);
    } else {
      contactError.textContent = data.error || 'تعذر إضافة المستخدم';
      contactError.style.display = 'block';
    }
  } catch (err) {
    contactError.textContent = 'حدث خطأ في الاتصال';
    contactError.style.display = 'block';
  }
});

newContactInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmAddContactBtn.click();
});

// -------------------------------------------------------------
// CHAT MESSAGES LOGIC
// -------------------------------------------------------------

async function openChatWith(username, avatarUrl, isOnline, customTitle = null) {
  activeRecipient = username;

  // Mobile layout switch
  if (window.innerWidth <= 768) {
    sidebar.classList.add('hidden');
  }

  // Update Header
  activeChatName.textContent = customTitle || username;
  activeChatAvatar.src = avatarUrl || '/avatars/avatar-1.svg';
  updateActiveChatHeaderStatus(isOnline);

  // Switch Viewport
  noChatPlaceholder.style.display = 'none';
  messagesList.style.display = 'flex';
  messagesList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">جاري تحميل المحادثة...</div>';

  // Highlight in sidebar
  renderContactsList();

  // Load History
  try {
    const res = await fetch(`/api/messages?user1=${encodeURIComponent(currentUser.username)}&user2=${encodeURIComponent(username)}`);
    const data = await res.json();
    messagesList.innerHTML = '';
    
    if (data.messages && data.messages.length > 0) {
      data.messages.forEach(msg => appendMessageToUI(msg));
    } else {
      messagesList.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted); font-size: 0.9rem;">
          لا توجد رسائل سابقة. ابدأ المحادثة الآن بإرسال رسالة، صورة، أو تسجيل صوتي (فوكال)!
        </div>
      `;
    }
    messagesViewport.scrollTop = messagesViewport.scrollHeight;
  } catch (err) {
    messagesList.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444;">تعذر تحميل الرسائل</div>';
  }

  messageInput.focus();
}

function updateActiveChatHeaderStatus(isOnline) {
  if (activeRecipient === 'global') {
    activeChatStatus.textContent = 'مفتوحة للجميع للدردشة والمشاركة';
    activeChatStatusIndicator.className = 'status-indicator online';
    return;
  }
  if (isOnline) {
    activeChatStatus.textContent = 'متصل الآن';
    activeChatStatusIndicator.className = 'status-indicator online';
  } else {
    activeChatStatus.textContent = 'غير متصل';
    activeChatStatusIndicator.className = 'status-indicator';
  }
}

// Mobile back button
backToSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('hidden');
});

// Append Message to UI
function appendMessageToUI(msg) {
  const isOutgoing = msg.sender.toLowerCase() === currentUser.username.toLowerCase();
  
  const row = document.createElement('div');
  row.className = `message-row ${isOutgoing ? 'outgoing' : 'incoming'}`;

  let contentHtml = '';

  // Show sender name in Global lounge
  const senderHeader = (!isOutgoing && activeRecipient === 'global')
    ? `<div class="msg-sender-name">${msg.sender}</div>`
    : '';

  if (msg.type === 'image') {
    contentHtml = `
      ${senderHeader}
      <img src="${msg.mediaUrl}" class="msg-image" alt="صورة مرسلة" onclick="openImageModal('${msg.mediaUrl}')">
      <div class="msg-time">${formatTime(msg.timestamp)}</div>
    `;
  } else if (msg.type === 'audio') {
    const audioId = 'audio_' + msg.id;
    contentHtml = `
      ${senderHeader}
      <div class="vocal-player">
        <button class="vocal-play-btn" onclick="toggleAudioPlay('${audioId}', this)">
          <i data-lucide="play"></i>
        </button>
        <div class="vocal-progress-bar" onclick="seekAudio('${audioId}', event)">
          <div class="vocal-progress-fill" id="fill_${audioId}"></div>
        </div>
        <span class="vocal-time" id="time_${audioId}">${msg.duration ? formatDuration(msg.duration) : '0:00'}</span>
        <audio id="${audioId}" src="${msg.mediaUrl}" preload="metadata"></audio>
      </div>
      <div class="msg-time">${formatTime(msg.timestamp)}</div>
    `;
  } else {
    contentHtml = `
      ${senderHeader}
      <div class="msg-text">${escapeHtml(msg.content)}</div>
      <div class="msg-time">${formatTime(msg.timestamp)}</div>
    `;
  }

  row.innerHTML = `<div class="msg-bubble">${contentHtml}</div>`;
  messagesList.appendChild(row);
  refreshIcons();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// -------------------------------------------------------------
// SENDING MESSAGES (TEXT & IMAGE)
// -------------------------------------------------------------

function sendTextMessage() {
  if (!activeRecipient) {
    alert('يرجى اختيار شخص من القائمة أولاً');
    return;
  }
  const text = messageInput.value.trim();
  if (!text) return;

  socket.emit('send_message', {
    recipient: activeRecipient,
    type: 'text',
    content: text
  });

  messageInput.value = '';
}

sendBtn.addEventListener('click', sendTextMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendTextMessage();
  }
});

// Image Upload & Send
imageUploadInput.addEventListener('change', async (e) => {
  if (!activeRecipient) {
    alert('يرجى اختيار شخص من القائمة أولاً');
    return;
  }
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.url) {
      socket.emit('send_message', {
        recipient: activeRecipient,
        type: 'image',
        mediaUrl: data.url
      });
    }
  } catch (err) {
    alert('تعذر إرسال الصورة');
  }
  imageUploadInput.value = '';
});

// -------------------------------------------------------------
// VOCAL / VOICE NOTE RECORDING LOGIC
// -------------------------------------------------------------

recordVocalBtn.addEventListener('click', async () => {
  if (!activeRecipient) {
    alert('يرجى اختيار شخص من القائمة أولاً لتسجيل فوكال معه');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startRecording(stream);
  } catch (err) {
    console.error('Microphone error:', err);
    alert('تعذر الوصول إلى الميكروفون. يرجى السماح للتطبيق باستخدام الميكروفون في المتصفح.');
  }
});

function startRecording(stream) {
  audioChunks = [];
  isRecordingCancelled = false;
  recordingSeconds = 0;

  let mimeType = 'audio/webm';
  if (!MediaRecorder.isTypeSupported('audio/webm')) {
    mimeType = MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : 'audio/mp4';
  }

  mediaRecorder = new MediaRecorder(stream, { mimeType });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      audioChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = async () => {
    // Stop all tracks to release mic
    stream.getTracks().forEach(track => track.stop());
    clearInterval(recordingInterval);

    if (isRecordingCancelled) {
      audioChunks = [];
      return;
    }

    if (audioChunks.length === 0) return;

    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const finalDuration = recordingSeconds;

    // Upload vocal audio
    const formData = new FormData();
    const extension = mimeType.includes('ogg') ? '.ogg' : (mimeType.includes('mp4') ? '.m4a' : '.webm');
    formData.append('file', audioBlob, 'vocal_' + Date.now() + extension);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.url) {
        socket.emit('send_message', {
          recipient: activeRecipient,
          type: 'audio',
          mediaUrl: data.url,
          duration: finalDuration
        });
      }
    } catch (err) {
      alert('تعذر إرسال التسجيل الصوتي');
    }
  };

  mediaRecorder.start(200);

  // Switch UI to recording bar
  normalControls.style.display = 'none';
  recordingBar.style.display = 'flex';
  recordingTimer.textContent = '00:00';

  recordingInterval = setInterval(() => {
    recordingSeconds++;
    const m = Math.floor(recordingSeconds / 60);
    const s = recordingSeconds % 60;
    recordingTimer.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }, 1000);
}

cancelRecordBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    isRecordingCancelled = true;
    mediaRecorder.stop();
  }
  stopRecordingUI();
});

sendRecordBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    isRecordingCancelled = false;
    mediaRecorder.stop();
  }
  stopRecordingUI();
});

function stopRecordingUI() {
  clearInterval(recordingInterval);
  recordingBar.style.display = 'none';
  normalControls.style.display = 'flex';
  refreshIcons();
}

// -------------------------------------------------------------
// AUDIO PLAYER INTERACTION
// -------------------------------------------------------------

window.toggleAudioPlay = function(audioId, btn) {
  const audio = document.getElementById(audioId);
  const fill = document.getElementById('fill_' + audioId);
  const time = document.getElementById('time_' + audioId);

  if (!audio) return;

  if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
    currentlyPlayingAudio.pause();
    if (currentlyPlayingBtn) {
      currentlyPlayingBtn.innerHTML = '<i data-lucide="play"></i>';
    }
  }

  if (audio.paused) {
    audio.play();
    currentlyPlayingAudio = audio;
    currentlyPlayingBtn = btn;
    btn.innerHTML = '<i data-lucide="pause"></i>';
    refreshIcons();

    audio.ontimeupdate = () => {
      const progress = (audio.currentTime / (audio.duration || 1)) * 100;
      if (fill) fill.style.width = progress + '%';
      if (time) time.textContent = formatDuration(audio.currentTime);
    };

    audio.onended = () => {
      btn.innerHTML = '<i data-lucide="play"></i>';
      if (fill) fill.style.width = '0%';
      if (time) time.textContent = formatDuration(audio.duration || 0);
      currentlyPlayingAudio = null;
      refreshIcons();
    };
  } else {
    audio.pause();
    btn.innerHTML = '<i data-lucide="play"></i>';
    currentlyPlayingAudio = null;
    refreshIcons();
  }
};

window.seekAudio = function(audioId, event) {
  const audio = document.getElementById(audioId);
  const bar = event.currentTarget;
  if (!audio || !audio.duration) return;

  const rect = bar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percent = clickX / rect.width;
  audio.currentTime = percent * audio.duration;
};

// -------------------------------------------------------------
// IMAGE LIGHTBOX
// -------------------------------------------------------------

window.openImageModal = function(url) {
  lightboxImg.src = url;
  lightbox.classList.add('active');
};

closeLightbox.addEventListener('click', () => {
  lightbox.classList.remove('active');
});

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    lightbox.classList.remove('active');
  }
});

// START
init();
