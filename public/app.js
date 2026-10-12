// Antigravity Chat Application - Professional Edition 2.0

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
const authModal = document.getElementById('authModal');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const submitLoginBtn = document.getElementById('submitLoginBtn');
const loginError = document.getElementById('loginError');

const registerAvatarPreview = document.getElementById('registerAvatarPreview');
const registerAvatarFile = document.getElementById('registerAvatarFile');
const registerPresets = document.querySelectorAll('.avatar-presets .preset-img');
const registerDisplayName = document.getElementById('registerDisplayName');
const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const submitRegisterBtn = document.getElementById('submitRegisterBtn');
const registerError = document.getElementById('registerError');

// Profile & Sidebar
const openMyProfileBtn = document.getElementById('openMyProfileBtn');
const userProfileModal = document.getElementById('userProfileModal');
const myProfileAvatar = document.getElementById('myProfileAvatar');
const editMyAvatarFile = document.getElementById('editMyAvatarFile');
const myUserIdBadge = document.getElementById('myUserIdBadge');
const copyMyIdBtn = document.getElementById('copyMyIdBtn');
const myDisplayNameInput = document.getElementById('myDisplayNameInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const closeProfileBtn = document.getElementById('closeProfileBtn');

const currentUserAvatar = document.getElementById('currentUserAvatar');
const currentUserName = document.getElementById('currentUserName');
const currentUserTag = document.getElementById('currentUserTag');
const quickSettingsBtn = document.getElementById('quickSettingsBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Add Contact Modal
const openAddContactBtn = document.getElementById('openAddContactBtn');
const addContactModal = document.getElementById('addContactModal');
const newContactInput = document.getElementById('newContactInput');
const confirmAddContactBtn = document.getElementById('confirmAddContactBtn');
const cancelAddContactBtn = document.getElementById('cancelAddContactBtn');
const contactError = document.getElementById('contactError');

// View Contact Profile Modal
const contactProfileModal = document.getElementById('contactProfileModal');
const viewContactAvatar = document.getElementById('viewContactAvatar');
const viewContactName = document.getElementById('viewContactName');
const viewContactStatusBadge = document.getElementById('viewContactStatusBadge');
const viewContactUsername = document.getElementById('viewContactUsername');
const viewContactUserId = document.getElementById('viewContactUserId');
const deleteChatFromProfileBtn = document.getElementById('deleteChatFromProfileBtn');
const closeContactProfileBtn = document.getElementById('closeContactProfileBtn');
const chatHeaderContactInfo = document.getElementById('chatHeaderContactInfo');
const viewProfileFromHeaderBtn = document.getElementById('viewProfileFromHeaderBtn');

// Chat Settings & Themes Modal
const chatSettingsModal = document.getElementById('chatSettingsModal');
const openChatThemeSettingsBtn = document.getElementById('openChatThemeSettingsBtn');
const closeChatSettingsBtn = document.getElementById('closeChatSettingsBtn');
const themeOptions = document.querySelectorAll('.theme-option');
const wallpaperUploadInput = document.getElementById('wallpaperUploadInput');
const resetWallpaperBtn = document.getElementById('resetWallpaperBtn');
const deleteChatBtn = document.getElementById('deleteChatBtn');
const quickDeleteChatBtn = document.getElementById('quickDeleteChatBtn');

// Tabs & Lists
const tabBtns = document.querySelectorAll('.chat-tabs .tab-btn');
const contactsList = document.getElementById('contactsList');
const chatArea = document.getElementById('chatArea');
const sidebar = document.getElementById('sidebar');
const backToSidebarBtn = document.getElementById('backToSidebarBtn');

// Chat Header & Viewport
const activeChatAvatar = document.getElementById('activeChatAvatar');
const activeChatName = document.getElementById('activeChatName');
const activeChatStatus = document.getElementById('activeChatStatus');
const activeChatStatusIndicator = document.getElementById('activeChatStatusIndicator');
const chatHeaderActions = document.getElementById('chatHeaderActions');

const messagesViewport = document.getElementById('messagesViewport');
const noChatPlaceholder = document.getElementById('noChatPlaceholder');
const messagesList = document.getElementById('messagesList');
const typingIndicator = document.getElementById('typingIndicator');
const typingText = document.getElementById('typingText');

// Chat Input
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const imageUploadInput = document.getElementById('imageUploadInput');
const recordVocalBtn = document.getElementById('recordVocalBtn');

const normalControls = document.getElementById('normalControls');
const recordingBar = document.getElementById('recordingBar');
const recordingTimer = document.getElementById('recordingTimer');
const cancelRecordBtn = document.getElementById('cancelRecordBtn');
const sendRecordBtn = document.getElementById('sendRecordBtn');

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeLightbox = document.getElementById('closeLightbox');

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

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
// AUTHENTICATION (LOGIN & REGISTER)
// -------------------------------------------------------------

// Switch Auth Tabs
tabLoginBtn.addEventListener('click', () => {
  tabLoginBtn.classList.add('active');
  tabRegisterBtn.classList.remove('active');
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  loginError.style.display = 'none';
});

tabRegisterBtn.addEventListener('click', () => {
  tabRegisterBtn.classList.add('active');
  tabLoginBtn.classList.remove('active');
  registerForm.style.display = 'block';
  loginForm.style.display = 'none';
  registerError.style.display = 'none';
});

// Register Avatar Presets
registerPresets.forEach(p => {
  p.addEventListener('click', () => {
    registerPresets.forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    registerAvatarPreview.src = p.dataset.src;
  });
});

// Upload custom avatar in register
registerAvatarFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.url) {
      registerAvatarPreview.src = d.url;
      registerPresets.forEach(x => x.classList.remove('active'));
    }
  } catch (err) {
    alert('تعذر رفع الصورة');
  }
});

// Submit Login
submitLoginBtn.addEventListener('click', async () => {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    loginError.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
    loginError.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      setCurrentUser(data.user);
      authModal.classList.remove('active');
      setupApp();
    } else {
      loginError.textContent = data.error || 'فشل تسجيل الدخول';
      loginError.style.display = 'block';
    }
  } catch (err) {
    loginError.textContent = 'فشل الاتصال بالخادم';
    loginError.style.display = 'block';
  }
});

// Submit Register
submitRegisterBtn.addEventListener('click', async () => {
  const username = registerUsername.value.trim();
  const password = registerPassword.value;
  const displayName = registerDisplayName.value.trim() || username;
  const avatarUrl = registerAvatarPreview.src;

  if (!username || !password) {
    registerError.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
    registerError.style.display = 'block';
    return;
  }

  if (password.length < 4) {
    registerError.textContent = 'كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل';
    registerError.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName, avatarUrl })
    });
    const data = await res.json();

    if (data.success) {
      setCurrentUser(data.user);
      authModal.classList.remove('active');
      setupApp();
    } else {
      registerError.textContent = data.error || 'تعذر إنشاء الحساب';
      registerError.style.display = 'block';
    }
  } catch (err) {
    registerError.textContent = 'فشل الاتصال بالخادم';
    registerError.style.display = 'block';
  }
});

function setCurrentUser(user) {
  currentUser = user;
  localStorage.setItem('chatapp_user_v2', JSON.stringify(user));
  applyTheme(user.theme || 'midnight');
  if (user.chatWallpaper) {
    messagesViewport.style.backgroundImage = `url("${user.chatWallpaper}")`;
  }
}

// Logout
logoutBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (confirm('هل ترغب بالتأكيد في تسجيل الخروج؟')) {
    localStorage.removeItem('chatapp_user_v2');
    window.location.reload();
  }
});

// -------------------------------------------------------------
// USER PROFILE MODAL & EDITING
// -------------------------------------------------------------

openMyProfileBtn.addEventListener('click', () => {
  if (!currentUser) return;
  myProfileAvatar.src = currentUser.avatarUrl || '/avatars/avatar-1.svg';
  myUserIdBadge.textContent = currentUser.userId || 'ID-00000';
  myDisplayNameInput.value = currentUser.displayName || currentUser.username;
  userProfileModal.classList.add('active');
});

closeProfileBtn.addEventListener('click', () => {
  userProfileModal.classList.remove('active');
});

// Copy User ID Button
copyMyIdBtn.addEventListener('click', () => {
  if (!currentUser || !currentUser.userId) return;
  navigator.clipboard.writeText(currentUser.userId).then(() => {
    const origText = copyMyIdBtn.innerHTML;
    copyMyIdBtn.innerHTML = '<i data-lucide="check"></i> <span>تم النسخ!</span>';
    refreshIcons();
    setTimeout(() => {
      copyMyIdBtn.innerHTML = origText;
      refreshIcons();
    }, 2000);
  });
});

// Edit profile avatar
editMyAvatarFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) {
      myProfileAvatar.src = data.url;
    }
  } catch (err) {
    alert('تعذر رفع الصورة');
  }
});

// Save Profile Updates
saveProfileBtn.addEventListener('click', async () => {
  const newName = myDisplayNameInput.value.trim();
  const newAvatar = myProfileAvatar.src;

  try {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser.username,
        displayName: newName,
        avatarUrl: newAvatar
      })
    });
    const data = await res.json();
    if (data.success) {
      setCurrentUser(data.user);
      currentUserName.textContent = data.user.displayName;
      currentUserAvatar.src = data.user.avatarUrl;
      userProfileModal.classList.remove('active');
      alert('تم حفظ بيانات الملف الشخصي بنجاح!');
    }
  } catch (err) {
    alert('تعذر حفظ البيانات');
  }
});

// -------------------------------------------------------------
// THEMES & CHAT WALLPAPERS
// -------------------------------------------------------------

quickSettingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  chatSettingsModal.classList.add('active');
});

openChatThemeSettingsBtn.addEventListener('click', () => {
  chatSettingsModal.classList.add('active');
});

closeChatSettingsBtn.addEventListener('click', () => {
  chatSettingsModal.classList.remove('active');
});

function applyTheme(themeName) {
  document.body.dataset.theme = themeName;
  themeOptions.forEach(opt => {
    if (opt.dataset.themeVal === themeName) opt.classList.add('active');
    else opt.classList.remove('active');
  });
}

themeOptions.forEach(opt => {
  opt.addEventListener('click', async () => {
    const chosenTheme = opt.dataset.themeVal;
    applyTheme(chosenTheme);
    if (currentUser) {
      currentUser.theme = chosenTheme;
      localStorage.setItem('chatapp_user_v2', JSON.stringify(currentUser));
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, theme: chosenTheme })
      });
    }
  });
});

// Wallpaper upload
wallpaperUploadInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) {
      messagesViewport.style.backgroundImage = `url("${data.url}")`;
      if (currentUser) {
        currentUser.chatWallpaper = data.url;
        localStorage.setItem('chatapp_user_v2', JSON.stringify(currentUser));
        await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username, chatWallpaper: data.url })
        });
      }
      alert('تم تعيين خلفية المحادثة بنجاح!');
    }
  } catch (err) {
    alert('تعذر تعيين الخلفية');
  }
});

// Reset Wallpaper
resetWallpaperBtn.addEventListener('click', async () => {
  messagesViewport.style.backgroundImage = '';
  if (currentUser) {
    currentUser.chatWallpaper = null;
    localStorage.setItem('chatapp_user_v2', JSON.stringify(currentUser));
    await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, chatWallpaper: null })
    });
  }
  alert('تمت استعادة الخلفية الافتراضية');
});

// -------------------------------------------------------------
// DELETE CONVERSATION
// -------------------------------------------------------------

async function deleteActiveConversation() {
  if (!activeRecipient) {
    alert('يرجى اختيار محادثة أولاً');
    return;
  }

  const isGlobal = activeRecipient === 'global';
  const confirmMsg = isGlobal
    ? 'هل أنت متأكد من مسح جميع رسائل الغرفة العامة؟'
    : `هل أنت متأكد من حذف جميع الرسائل في المحادثة مع "${activeRecipient}"؟`;

  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch('/api/conversation/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user1: currentUser.username,
        user2: activeRecipient
      })
    });
    const data = await res.json();

    if (data.success) {
      messagesList.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted); font-size: 0.9rem;">
          تم مسح سجل المحادثة بالكامل.
        </div>
      `;
      chatSettingsModal.classList.remove('active');
      contactProfileModal.classList.remove('active');
      loadContacts();
    }
  } catch (err) {
    alert('تعذر حذف المحادثة');
  }
}

deleteChatBtn.addEventListener('click', deleteActiveConversation);
quickDeleteChatBtn.addEventListener('click', deleteActiveConversation);
deleteChatFromProfileBtn.addEventListener('click', deleteActiveConversation);

// -------------------------------------------------------------
// CONTACT PROFILE MODAL (VIEW OTHERS)
// -------------------------------------------------------------

async function openContactProfile(identifier) {
  if (!identifier || identifier === 'global') return;

  try {
    const res = await fetch(`/api/user-profile?identifier=${encodeURIComponent(identifier)}`);
    const data = await res.json();

    if (data.user) {
      const u = data.user;
      viewContactAvatar.src = u.avatarUrl || '/avatars/avatar-1.svg';
      viewContactName.textContent = u.displayName || u.username;
      viewContactUsername.textContent = '@' + u.username;
      viewContactUserId.textContent = u.userId || '---';

      if (u.online) {
        viewContactStatusBadge.textContent = 'متصل الآن';
        viewContactStatusBadge.className = 'status-badge online';
      } else {
        viewContactStatusBadge.textContent = 'غير متصل';
        viewContactStatusBadge.className = 'status-badge';
      }

      contactProfileModal.classList.add('active');
    }
  } catch (err) {
    alert('تعذر عرض بيانات الصديق');
  }
}

chatHeaderContactInfo.addEventListener('click', () => {
  if (activeRecipient && activeRecipient !== 'global') {
    openContactProfile(activeRecipient);
  }
});

viewProfileFromHeaderBtn.addEventListener('click', () => {
  if (activeRecipient && activeRecipient !== 'global') {
    openContactProfile(activeRecipient);
  }
});

closeContactProfileBtn.addEventListener('click', () => {
  contactProfileModal.classList.remove('active');
});

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------

function init() {
  refreshIcons();
  const saved = localStorage.getItem('chatapp_user_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      setCurrentUser(parsed);
      authModal.classList.remove('active');
      setupApp();
      return;
    } catch (e) {
      localStorage.removeItem('chatapp_user_v2');
    }
  }
  authModal.classList.add('active');
}

function setupApp() {
  currentUserName.textContent = currentUser.displayName || currentUser.username;
  currentUserTag.textContent = currentUser.userId || 'ID-00000';
  currentUserAvatar.src = currentUser.avatarUrl || '/avatars/avatar-1.svg';

  initSocket();
  loadContacts();
}

// -------------------------------------------------------------
// SOCKET.IO REALTIME
// -------------------------------------------------------------

function initSocket() {
  socket = io();

  socket.on('connect', () => {
    socket.emit('user_join', { username: currentUser.username });
  });

  socket.on('user_status', ({ username, online }) => {
    const c = contacts.find(x => x.username.toLowerCase() === username.toLowerCase());
    if (c) {
      c.online = online;
      renderContactsList();
    }
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

    loadContacts();
  });

  socket.on('conversation_deleted', (payload) => {
    if (activeRecipient === 'global' && payload.recipient === 'global') {
      messagesList.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">تم مسح المحادثة.</div>';
    } else if (activeRecipient && payload.withUser && payload.withUser.toLowerCase() === currentUser.username.toLowerCase()) {
      messagesList.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">تم مسح المحادثة من الطرف الآخر.</div>';
    }
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
// CONTACTS LIST & ADD FRIEND
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
      <div style="text-align:center; padding: 24px 16px; color: var(--text-muted); font-size: 0.85rem;">
        لا يوجد أصدقاء مضافين بعد.<br>
        اضغط على <b>إضافة صديق برمز المعرف</b> أو شارك معرفك <b>${currentUser ? currentUser.userId : ''}</b> مع أصدقائك!
      </div>
    `;
    return;
  }

  contacts.forEach(c => {
    const card = document.createElement('div');
    card.className = `contact-card ${activeRecipient && activeRecipient.toLowerCase() === c.username.toLowerCase() ? 'active' : ''}`;
    
    let lastMsgText = 'لا توجد رسائل';
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
          <span class="contact-name">${c.displayName || c.username}</span>
          <span class="contact-time">${c.lastMessage ? formatTime(c.lastMessage.timestamp) : ''}</span>
        </div>
        <p class="contact-last-msg">${lastMsgText}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      openChatWith(c.username, c.avatarUrl, c.online, c.displayName);
    });

    contactsList.appendChild(card);
  });
}

// Add Friend Modal
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
  const targetId = newContactInput.value.trim();
  if (!targetId) return;

  try {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser.username,
        identifier: targetId
      })
    });
    const data = await res.json();

    if (data.success) {
      addContactModal.classList.remove('active');
      await loadContacts();
      openChatWith(data.contact.username, data.contact.avatarUrl, data.contact.online, data.contact.displayName);
    } else {
      contactError.textContent = data.error || 'تعذر إضافة الصديق';
      contactError.style.display = 'block';
    }
  } catch (err) {
    contactError.textContent = 'حدث خطأ أثناء البحث';
    contactError.style.display = 'block';
  }
});

newContactInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmAddContactBtn.click();
});

// Tab switcher (Contacts vs Global Lounge)
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;

    if (currentTab === 'global') {
      openChatWith('global', '/avatars/avatar-1.svg', true, 'الغرفة العامة (الجميع)');
    } else {
      renderContactsList();
    }
  });
});

// -------------------------------------------------------------
// CHAT CONVERSATION VIEWPORT
// -------------------------------------------------------------

async function openChatWith(username, avatarUrl, isOnline, customTitle = null) {
  activeRecipient = username;

  if (window.innerWidth <= 768) {
    sidebar.classList.add('hidden');
  }

  activeChatName.textContent = customTitle || username;
  activeChatAvatar.src = avatarUrl || '/avatars/avatar-1.svg';
  updateActiveChatHeaderStatus(isOnline);

  chatHeaderActions.style.display = 'flex';
  noChatPlaceholder.style.display = 'none';
  messagesList.style.display = 'flex';
  messagesList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">جاري تحميل المحادثة...</div>';

  renderContactsList();

  try {
    const res = await fetch(`/api/messages?user1=${encodeURIComponent(currentUser.username)}&user2=${encodeURIComponent(username)}`);
    const data = await res.json();
    messagesList.innerHTML = '';
    
    if (data.messages && data.messages.length > 0) {
      data.messages.forEach(msg => appendMessageToUI(msg));
    } else {
      messagesList.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted); font-size: 0.9rem;">
          لا توجد رسائل بعد. ابدأ المحادثة الآن بإرسال رسالة نصية، صورة، أو تسجيل صوتي (فوكال)!
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
    activeChatStatus.textContent = 'غرفة عامة مفتوحة للجميع';
    activeChatStatusIndicator.className = 'status-indicator online';
    return;
  }
  if (isOnline) {
    activeChatStatus.textContent = 'متصل الآن (Online)';
    activeChatStatusIndicator.className = 'status-indicator online';
  } else {
    activeChatStatus.textContent = 'غير متصل (Offline)';
    activeChatStatusIndicator.className = 'status-indicator';
  }
}

backToSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('hidden');
});

function appendMessageToUI(msg) {
  const isOutgoing = msg.sender.toLowerCase() === currentUser.username.toLowerCase();
  
  const row = document.createElement('div');
  row.className = `message-row ${isOutgoing ? 'outgoing' : 'incoming'}`;

  let contentHtml = '';
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

// Send Image
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
// AUDIO RECORDING (VOCAL)
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
    alert('يرجى السماح للتطبيق بالوصول إلى الميكروفون لتسجيل الفوكال');
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
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    stream.getTracks().forEach(track => track.stop());
    clearInterval(recordingInterval);

    if (isRecordingCancelled || audioChunks.length === 0) return;

    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const finalDuration = recordingSeconds;

    const formData = new FormData();
    const ext = mimeType.includes('ogg') ? '.ogg' : (mimeType.includes('mp4') ? '.m4a' : '.webm');
    formData.append('file', audioBlob, 'vocal_' + Date.now() + ext);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
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
  if (e.target === lightbox) lightbox.classList.remove('active');
});

// Launch
init();
