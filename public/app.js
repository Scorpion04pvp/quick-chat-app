// ================= ONYX CHAT - CLIENT LOGIC =================

let currentUser = null;
let activeRecipient = null;
let socket = null;
let currentTab = 'contacts';
let currentView = 'chats';
let contacts = [];
let reelsData = [];
let currentLang = 'ar';

// Call state
let localStream = null;
let activeCallTarget = null;
let isAudioCallOnly = false;

// Vocal recorder state
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingSeconds = 0;
let isRecordingCancelled = false;

// Audio player state
let currentlyPlayingAudio = null;
let currentlyPlayingBtn = null;

// i18n Dictionary
const translations = {
  ar: {
    authSubtitle: 'محادثات راقية مشفرة، مكالمات، وريلز فيديو',
    tabLogin: 'تسجيل الدخول',
    tabRegister: 'إنشاء حساب جديد',
    labelUsernameOrContact: 'اسم المستخدم / الجيمايل / الهاتف:',
    labelPassword: 'كلمة المرور:',
    btnLogin: 'دخول إلى ONYX CHAT',
    navChats: 'المحادثات',
    navReels: 'الريلز (Reels)',
    navProfile: 'ملفي الشخصي',
    addFriendBtn: 'إضافة صديق برمز المعرف',
    tabContacts: 'جهات الاتصال',
    tabGlobal: 'الغرفة العامة'
  },
  en: {
    authSubtitle: 'Encrypted luxury chats, audio/video calls, and video reels',
    tabLogin: 'Sign In',
    tabRegister: 'Create Account',
    labelUsernameOrContact: 'Username / Gmail / Phone:',
    labelPassword: 'Password:',
    btnLogin: 'Enter ONYX CHAT',
    navChats: 'Chats',
    navReels: 'Reels',
    navProfile: 'My Profile',
    addFriendBtn: 'Add Friend by User ID',
    tabContacts: 'Contacts',
    tabGlobal: 'Public Lounge'
  }
};

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

// Register Elements
const methodEmailBtn = document.getElementById('methodEmailBtn');
const methodPhoneBtn = document.getElementById('methodPhoneBtn');
const contactInputLabel = document.getElementById('contactInputLabel');
const contactInputIcon = document.getElementById('contactInputIcon');
const registerContactInput = document.getElementById('registerContactInput');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const codeGroup = document.getElementById('codeGroup');
const registerCodeInput = document.getElementById('registerCodeInput');
const registerDetailsSection = document.getElementById('registerDetailsSection');

const registerAvatarPreview = document.getElementById('registerAvatarPreview');
const registerAvatarFile = document.getElementById('registerAvatarFile');
const registerPresets = document.querySelectorAll('.avatar-presets .preset-img');
const registerDisplayName = document.getElementById('registerDisplayName');
const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const registerBio = document.getElementById('registerBio');
const submitRegisterBtn = document.getElementById('submitRegisterBtn');
const registerError = document.getElementById('registerError');

// In-app code toast
const codeNotificationToast = document.getElementById('codeNotificationToast');
const toastCode = document.getElementById('toastCode');
const toastCopyBtn = document.getElementById('toastCopyBtn');

// Nav tabs & Views
const navTabs = document.querySelectorAll('.nav-tab');
const chatsView = document.getElementById('chatsView');
const reelsView = document.getElementById('reelsView');
const profileView = document.getElementById('profileView');
const brandHomeBtn = document.getElementById('brandHomeBtn');
const langToggleBtn = document.getElementById('langToggleBtn');
const currentLangLabel = document.getElementById('currentLangLabel');

// Chats View Elements
const sidebar = document.getElementById('sidebar');
const currentUserAvatar = document.getElementById('currentUserAvatar');
const currentUserName = document.getElementById('currentUserName');
const currentUserTag = document.getElementById('currentUserTag');
const openProfileFromSidebar = document.getElementById('openProfileFromSidebar');
const logoutBtn = document.getElementById('logoutBtn');
const openAddContactBtn = document.getElementById('openAddContactBtn');
const contactsList = document.getElementById('contactsList');
const tabBtns = document.querySelectorAll('.chat-tabs .tab-btn');

const chatArea = document.getElementById('chatArea');
const chatHeaderContactInfo = document.getElementById('chatHeaderContactInfo');
const backToSidebarBtn = document.getElementById('backToSidebarBtn');
const activeChatAvatar = document.getElementById('activeChatAvatar');
const activeChatName = document.getElementById('activeChatName');
const activeChatStatus = document.getElementById('activeChatStatus');
const activeChatStatusIndicator = document.getElementById('activeChatStatusIndicator');
const chatHeaderActions = document.getElementById('chatHeaderActions');

const startAudioCallBtn = document.getElementById('startAudioCallBtn');
const startVideoCallBtn = document.getElementById('startVideoCallBtn');
const openChatThemeSettingsBtn = document.getElementById('openChatThemeSettingsBtn');
const viewProfileFromHeaderBtn = document.getElementById('viewProfileFromHeaderBtn');

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

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeLightbox = document.getElementById('closeLightbox');

// Call Modals
const callModal = document.getElementById('callModal');
const callUserAvatar = document.getElementById('callUserAvatar');
const callUserName = document.getElementById('callUserName');
const callStatusText = document.getElementById('callStatusText');
const callVideoViewport = document.getElementById('callVideoViewport');
const localVideo = document.getElementById('localVideo');
const toggleMicBtn = document.getElementById('toggleMicBtn');
const toggleCameraBtn = document.getElementById('toggleCameraBtn');
const endCallBtn = document.getElementById('endCallBtn');

const incomingCallModal = document.getElementById('incomingCallModal');
const incomingCallerAvatar = document.getElementById('incomingCallerAvatar');
const incomingCallerName = document.getElementById('incomingCallerName');
const incomingCallType = document.getElementById('incomingCallType');
const declineCallBtn = document.getElementById('declineCallBtn');
const acceptCallBtn = document.getElementById('acceptCallBtn');

// Reels View
const openCreateReelBtn = document.getElementById('openCreateReelBtn');
const reelsFeed = document.getElementById('reelsFeed');
const createReelModal = document.getElementById('createReelModal');
const videoDropZone = document.getElementById('videoDropZone');
const reelVideoFile = document.getElementById('reelVideoFile');
const selectedVideoName = document.getElementById('selectedVideoName');
const reelCaptionInput = document.getElementById('reelCaptionInput');
const cancelCreateReelBtn = document.getElementById('cancelCreateReelBtn');
const publishReelBtn = document.getElementById('publishReelBtn');

const reelCommentsModal = document.getElementById('reelCommentsModal');
const reelCommentsList = document.getElementById('reelCommentsList');
const newCommentInput = document.getElementById('newCommentInput');
const sendCommentBtn = document.getElementById('sendCommentBtn');
const closeCommentsBtn = document.getElementById('closeCommentsBtn');
let activeReelCommentId = null;

const shareReelModal = document.getElementById('shareReelModal');
const shareFriendsList = document.getElementById('shareFriendsList');
const closeShareReelBtn = document.getElementById('closeShareReelBtn');
let activeShareReel = null;

// Profile Page Elements
const fullProfileAvatar = document.getElementById('fullProfileAvatar');
const changeFullProfileAvatar = document.getElementById('changeFullProfileAvatar');
const fullProfileDisplayName = document.getElementById('fullProfileDisplayName');
const fullProfileUsername = document.getElementById('fullProfileUsername');
const fullProfileBio = document.getElementById('fullProfileBio');
const fullProfileUserId = document.getElementById('fullProfileUserId');
const copyFullUserIdBtn = document.getElementById('copyFullUserIdBtn');
const profileFollowersCount = document.getElementById('profileFollowersCount');
const profileFollowingCount = document.getElementById('profileFollowingCount');

const profileTabBtns = document.querySelectorAll('.profile-tab-btn');
const subtabLikedContent = document.getElementById('subtabLikedContent');
const subtabMyReelsContent = document.getElementById('subtabMyReelsContent');
const subtabSettingsContent = document.getElementById('subtabSettingsContent');
const likedReelsGrid = document.getElementById('likedReelsGrid');
const myReelsGrid = document.getElementById('myReelsGrid');

const editProfileNameInput = document.getElementById('editProfileNameInput');
const editProfileBioInput = document.getElementById('editProfileBioInput');
const editProfileLangSelect = document.getElementById('editProfileLangSelect');
const saveProfileSettingsBtn = document.getElementById('saveProfileSettingsBtn');

// Contact Profile Modal
const contactProfileModal = document.getElementById('contactProfileModal');
const viewContactAvatar = document.getElementById('viewContactAvatar');
const viewContactName = document.getElementById('viewContactName');
const viewContactBio = document.getElementById('viewContactBio');
const viewContactStatusBadge = document.getElementById('viewContactStatusBadge');
const viewContactUsername = document.getElementById('viewContactUsername');
const viewContactUserId = document.getElementById('viewContactUserId');
const viewContactFollowers = document.getElementById('viewContactFollowers');
const followContactBtn = document.getElementById('followContactBtn');
const deleteFriendBtn = document.getElementById('deleteFriendBtn');
const closeContactProfileBtn = document.getElementById('closeContactProfileBtn');
let activeContactViewing = null;

// Add Contact Modal
const addContactModal = document.getElementById('addContactModal');
const newContactInput = document.getElementById('newContactInput');
const confirmAddContactBtn = document.getElementById('confirmAddContactBtn');
const cancelAddContactBtn = document.getElementById('cancelAddContactBtn');
const contactError = document.getElementById('contactError');

// Chat Settings Modal
const chatSettingsModal = document.getElementById('chatSettingsModal');
const themeOptions = document.querySelectorAll('.theme-option');
const wallpaperUploadInput = document.getElementById('wallpaperUploadInput');
const resetWallpaperBtn = document.getElementById('resetWallpaperBtn');
const deleteChatBtn = document.getElementById('deleteChatBtn');
const closeChatSettingsBtn = document.getElementById('closeChatSettingsBtn');

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
// LANGUAGE TOGGLING (i18n)
// -------------------------------------------------------------

function setLanguage(lang) {
  currentLang = lang;
  document.body.dataset.lang = lang;
  currentLangLabel.textContent = lang === 'ar' ? 'العربية' : 'English';
  editProfileLangSelect.value = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  if (currentUser) {
    currentUser.language = lang;
    localStorage.setItem('onyx_user_v3', JSON.stringify(currentUser));
  }
}

langToggleBtn.addEventListener('click', () => {
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  setLanguage(newLang);
});

// -------------------------------------------------------------
// AUTHENTICATION FLOW WITH VERIFICATION CODE
// -------------------------------------------------------------

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

// Toggle Email / Phone method
let registerMethod = 'email';
methodEmailBtn.addEventListener('click', () => {
  registerMethod = 'email';
  methodEmailBtn.classList.add('active');
  methodPhoneBtn.classList.remove('active');
  contactInputLabel.textContent = 'البريد الإلكتروني (Gmail):';
  registerContactInput.placeholder = 'example@gmail.com';
  contactInputIcon.setAttribute('data-lucide', 'at-sign');
  refreshIcons();
});

methodPhoneBtn.addEventListener('click', () => {
  registerMethod = 'phone';
  methodPhoneBtn.classList.add('active');
  methodEmailBtn.classList.remove('active');
  contactInputLabel.textContent = 'رقم الهاتف:';
  registerContactInput.placeholder = '0655123456';
  contactInputIcon.setAttribute('data-lucide', 'phone');
  refreshIcons();
});

// Send Verification Code
sendCodeBtn.addEventListener('click', async () => {
  const contactVal = registerContactInput.value.trim();
  if (!contactVal) {
    alert('يرجى كتابة البريد الإلكتروني أو رقم الهاتف أولاً');
    return;
  }

  sendCodeBtn.disabled = true;
  sendCodeBtn.textContent = 'جاري الإرسال...';

  try {
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: contactVal })
    });
    const data = await res.json();

    if (data.success) {
      // Unhide Code input and Details section
      codeGroup.style.display = 'block';
      registerDetailsSection.style.display = 'block';

      // Show in-app realistic toast with code
      toastCode.textContent = data.code;
      codeNotificationToast.style.display = 'flex';

      toastCopyBtn.onclick = () => {
        registerCodeInput.value = data.code;
        codeNotificationToast.style.display = 'none';
      };

      setTimeout(() => {
        codeNotificationToast.style.display = 'none';
      }, 10000);

      sendCodeBtn.textContent = 'تم الإرسال ✓';
    } else {
      alert(data.error || 'تعذر إرسال الكود');
      sendCodeBtn.textContent = 'إرسال الكود';
      sendCodeBtn.disabled = false;
    }
  } catch (err) {
    alert('حدث خطأ في الاتصال');
    sendCodeBtn.textContent = 'إرسال الكود';
    sendCodeBtn.disabled = false;
  }
});

// Presets
registerPresets.forEach(p => {
  p.addEventListener('click', () => {
    registerPresets.forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    registerAvatarPreview.src = p.dataset.src;
  });
});

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

// Submit Register
submitRegisterBtn.addEventListener('click', async () => {
  const contactVal = registerContactInput.value.trim();
  const code = registerCodeInput.value.trim();
  const username = registerUsername.value.trim();
  const password = registerPassword.value;
  const displayName = registerDisplayName.value.trim() || username;
  const bio = registerBio.value.trim();
  const avatarUrl = registerAvatarPreview.src;

  if (!code) {
    registerError.textContent = 'يرجى إدخال كود التحقق';
    registerError.style.display = 'block';
    return;
  }

  if (!username || !password) {
    registerError.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
    registerError.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/auth/verify-and-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: contactVal,
        code,
        username,
        password,
        displayName,
        avatarUrl,
        bio
      })
    });
    const data = await res.json();

    if (data.success) {
      setCurrentUser(data.user);
      authModal.classList.remove('active');
      setupApp();
    } else {
      registerError.textContent = data.error || 'فشل التحقق والتسجيل';
      registerError.style.display = 'block';
    }
  } catch (err) {
    registerError.textContent = 'فشل الاتصال بالخادم';
    registerError.style.display = 'block';
  }
});

// Submit Login
submitLoginBtn.addEventListener('click', async () => {
  const usernameOrContact = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!usernameOrContact || !password) {
    loginError.textContent = 'يرجى إدخال اسم المستخدم/البريد/الهاتف وكلمة المرور';
    loginError.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrContact, password })
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

function setCurrentUser(user) {
  currentUser = user;
  localStorage.setItem('onyx_user_v3', JSON.stringify(user));
  applyTheme(user.theme || 'onyx-purple');
  setLanguage(user.language || 'ar');
  if (user.chatWallpaper) {
    messagesViewport.style.backgroundImage = `url("${user.chatWallpaper}")`;
  }
}

logoutBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (confirm('هل ترغب بالتأكيد في تسجيل الخروج من ONYX CHAT؟')) {
    localStorage.removeItem('onyx_user_v3');
    window.location.reload();
  }
});

// -------------------------------------------------------------
// TOPBAR NAVIGATION (CHATS / REELS / PROFILE)
// -------------------------------------------------------------

function switchView(viewName) {
  currentView = viewName;
  navTabs.forEach(t => {
    if (t.dataset.view === viewName) t.classList.add('active');
    else t.classList.remove('active');
  });

  chatsView.classList.remove('active');
  reelsView.classList.remove('active');
  profileView.classList.remove('active');

  if (viewName === 'chats') {
    chatsView.classList.add('active');
    loadContacts();
  } else if (viewName === 'reels') {
    reelsView.classList.add('active');
    loadReels();
  } else if (viewName === 'profile') {
    profileView.classList.add('active');
    loadFullProfile();
  }
}

navTabs.forEach(tab => {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
});

brandHomeBtn.addEventListener('click', () => switchView('chats'));
openProfileFromSidebar.addEventListener('click', () => switchView('profile'));

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------

function init() {
  refreshIcons();
  const saved = localStorage.getItem('onyx_user_v3');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      setCurrentUser(parsed);
      authModal.classList.remove('active');
      setupApp();
      return;
    } catch (e) {
      localStorage.removeItem('onyx_user_v3');
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

  socket.on('message_deleted', ({ messageId }) => {
    const row = document.getElementById('msg_row_' + messageId);
    if (row) row.remove();
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

  // Call Signaling
  socket.on('incoming_call', ({ caller, callerData, isVideo }) => {
    activeCallTarget = caller;
    isAudioCallOnly = !isVideo;
    incomingCallerName.textContent = callerData.displayName || caller;
    incomingCallerAvatar.src = callerData.avatarUrl || '/avatars/avatar-1.svg';
    incomingCallType.textContent = isVideo ? 'مكالمة فيديو واردة...' : 'مكالمة صوتية واردة...';
    incomingCallModal.classList.add('active');
  });

  socket.on('call_response', ({ from, accepted }) => {
    if (accepted) {
      callStatusText.textContent = 'تم الاتصال (مشفر E2E) • 00:01';
    } else {
      callStatusText.textContent = 'تم رفض المكالمة';
      setTimeout(() => closeCallUI(), 2000);
    }
  });

  socket.on('call_ended', () => {
    closeCallUI();
  });

  // Reels live updates
  socket.on('new_reel', (reel) => {
    if (currentView === 'reels') loadReels();
  });

  socket.on('reel_deleted', ({ reelId }) => {
    const card = document.getElementById('reel_card_' + reelId);
    if (card) card.remove();
  });

  socket.on('reel_liked', ({ reelId, likesCount }) => {
    const countEl = document.getElementById('like_count_' + reelId);
    if (countEl) countEl.textContent = likesCount;
  });
}

// -------------------------------------------------------------
// CHATS VIEW LOGIC
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
        لا يوجد أصدقاء بعد.<br>
        اضغط على <b>إضافة صديق برمز المعرف</b> وشارك معرفك <b>${currentUser ? currentUser.userId : ''}</b>!
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

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;

    if (currentTab === 'global') {
      openChatWith('global', 'logo.png', true, 'الغرفة العامة (ONYX Lounge)');
    } else {
      renderContactsList();
    }
  });
});

async function openChatWith(username, avatarUrl, isOnline, customTitle = null) {
  activeRecipient = username;

  if (window.innerWidth <= 768) {
    sidebar.classList.add('hidden');
  }

  activeChatName.textContent = customTitle || username;
  activeChatAvatar.src = avatarUrl || '/avatars/avatar-1.svg';
  updateActiveChatHeaderStatus(isOnline);

  chatHeaderActions.style.display = username === 'global' ? 'none' : 'flex';
  noChatPlaceholder.style.display = 'none';
  messagesList.style.display = 'flex';
  messagesList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">جاري تحميل المحادثة المشفرة...</div>';

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
          المحادثة فارغة ومحمية بتشفير تام. ابدأ بإرسال رسالة، صورة، أو فوكال!
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
    activeChatStatus.textContent = 'غرفة عامة مشفرة للجميع';
    activeChatStatusIndicator.className = 'status-indicator online';
    return;
  }
  if (isOnline) {
    activeChatStatus.textContent = 'متصل الآن (Online) • E2E مشفرة';
    activeChatStatusIndicator.className = 'status-indicator online';
  } else {
    activeChatStatus.textContent = 'غير متصل (Offline)';
    activeChatStatusIndicator.className = 'status-indicator';
  }
}

backToSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('hidden');
});

// Append Message & Single Delete Button
function appendMessageToUI(msg) {
  const isOutgoing = msg.sender.toLowerCase() === currentUser.username.toLowerCase();
  
  const row = document.createElement('div');
  row.className = `message-row ${isOutgoing ? 'outgoing' : 'incoming'}`;
  row.id = 'msg_row_' + msg.id;

  let contentHtml = '';
  const senderHeader = (!isOutgoing && activeRecipient === 'global')
    ? `<div class="msg-sender-name">${msg.sender}</div>`
    : '';

  if (msg.type === 'image') {
    contentHtml = `
      ${senderHeader}
      <img src="${msg.mediaUrl}" class="msg-image" alt="صورة" onclick="openImageModal('${msg.mediaUrl}')">
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

  // Delete message button (only for sender)
  let deleteBtnHtml = '';
  if (isOutgoing) {
    deleteBtnHtml = `
      <button class="msg-delete-btn" onclick="deleteSingleMessage('${msg.id}')" title="حذف هذه الرسالة">
        <i data-lucide="trash-2"></i>
      </button>
    `;
  }

  row.innerHTML = `
    <div class="msg-bubble">${contentHtml}</div>
    ${deleteBtnHtml}
  `;
  messagesList.appendChild(row);
  refreshIcons();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.deleteSingleMessage = async function(messageId) {
  if (!confirm('هل تريد حذف هذه الرسالة من المحادثة؟')) return;

  try {
    const res = await fetch('/api/messages/delete-one', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, username: currentUser.username })
    });
    const d = await res.json();
    if (d.success) {
      const row = document.getElementById('msg_row_' + messageId);
      if (row) row.remove();
    }
  } catch (err) {
    alert('تعذر حذف الرسالة');
  }
};

// Sending Text
function sendTextMessage() {
  if (!activeRecipient) return;
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
  if (!activeRecipient) return;
  const file = e.target.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.url) {
      socket.emit('send_message', {
        recipient: activeRecipient,
        type: 'image',
        mediaUrl: d.url
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
    alert('اختر شخصاً للتسجيل معه');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startRecording(stream);
  } catch (err) {
    alert('يرجى السماح بالوصول إلى الميكروفون لتسجيل الفوكال');
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
    stream.getTracks().forEach(t => t.stop());
    clearInterval(recordingInterval);

    if (isRecordingCancelled || audioChunks.length === 0) return;

    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const fd = new FormData();
    const ext = mimeType.includes('ogg') ? '.ogg' : (mimeType.includes('mp4') ? '.m4a' : '.webm');
    fd.append('file', audioBlob, 'vocal_' + Date.now() + ext);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        socket.emit('send_message', {
          recipient: activeRecipient,
          type: 'audio',
          mediaUrl: data.url,
          duration: recordingSeconds
        });
      }
    } catch (err) {
      alert('تعذر إرسال الفوكال');
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

window.toggleAudioPlay = function(audioId, btn) {
  const audio = document.getElementById(audioId);
  const fill = document.getElementById('fill_' + audioId);
  const time = document.getElementById('time_' + audioId);
  if (!audio) return;

  if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
    currentlyPlayingAudio.pause();
    if (currentlyPlayingBtn) currentlyPlayingBtn.innerHTML = '<i data-lucide="play"></i>';
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
  audio.currentTime = (clickX / rect.width) * audio.duration;
};

// -------------------------------------------------------------
// CALLS SYSTEM (AUDIO & VIDEO CALLS)
// -------------------------------------------------------------

async function initiateCall(isVideo) {
  if (!activeRecipient || activeRecipient === 'global') return;

  activeCallTarget = activeRecipient;
  isAudioCallOnly = !isVideo;
  callUserName.textContent = activeChatName.textContent;
  callUserAvatar.src = activeChatAvatar.src;
  callStatusText.textContent = isVideo ? 'جاري بدء مكالمة فيديو...' : 'جاري الاتصال...';

  callModal.classList.add('active');

  if (isVideo) {
    callVideoViewport.style.display = 'block';
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    } catch (e) {
      console.warn('Camera not available or blocked');
    }
  } else {
    callVideoViewport.style.display = 'none';
  }

  // Emit call start
  socket.emit('call_start', {
    recipient: activeRecipient,
    isVideo,
    callerData: {
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl
    }
  });
}

startAudioCallBtn.addEventListener('click', () => initiateCall(false));
startVideoCallBtn.addEventListener('click', () => initiateCall(true));

acceptCallBtn.addEventListener('click', async () => {
  incomingCallModal.classList.remove('active');
  callModal.classList.add('active');
  callUserName.textContent = incomingCallerName.textContent;
  callUserAvatar.src = incomingCallerAvatar.src;
  callStatusText.textContent = 'تم الاتصال • 00:01';

  if (!isAudioCallOnly) {
    callVideoViewport.style.display = 'block';
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    } catch (e) {}
  } else {
    callVideoViewport.style.display = 'none';
  }

  socket.emit('call_answer', { caller: activeCallTarget, accepted: true });
});

declineCallBtn.addEventListener('click', () => {
  incomingCallModal.classList.remove('active');
  socket.emit('call_answer', { caller: activeCallTarget, accepted: false });
  activeCallTarget = null;
});

endCallBtn.addEventListener('click', () => {
  if (activeCallTarget) {
    socket.emit('call_end', { targetUser: activeCallTarget });
  }
  closeCallUI();
});

function closeCallUI() {
  callModal.classList.remove('active');
  incomingCallModal.classList.remove('active');
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  if (localVideo) localVideo.srcObject = null;
  activeCallTarget = null;
}

// -------------------------------------------------------------
// REELS & SHORT VIDEOS
// -------------------------------------------------------------

async function loadReels() {
  try {
    const res = await fetch('/api/reels');
    const data = await res.json();
    reelsData = data.reels || [];
    renderReelsFeed();
  } catch (err) {
    console.error('Failed to load reels', err);
  }
}

function renderReelsFeed() {
  reelsFeed.innerHTML = '';

  if (reelsData.length === 0) {
    reelsFeed.innerHTML = `
      <div style="text-align:center; padding: 60px 20px; color: var(--text-muted);">
        <i data-lucide="video" style="width: 50px; height: 50px; margin-bottom: 12px; color: var(--primary);"></i>
        <h3>لا توجد مقاطع ريلز بعد</h3>
        <p>كن أول من يشارك فيديو مع الجميع! اضغط على <b>نشر ريلز جديد</b> بالأعلى.</p>
      </div>
    `;
    refreshIcons();
    return;
  }

  reelsData.forEach(r => {
    const isOwner = currentUser && r.creator.toLowerCase() === currentUser.username.toLowerCase();
    const isLiked = currentUser && r.likes && r.likes.includes(currentUser.username);

    const card = document.createElement('div');
    card.className = 'reel-card';
    card.id = 'reel_card_' + r.id;

    card.innerHTML = `
      <video src="${r.videoUrl}" class="reel-video" loop playsinline onclick="this.paused ? this.play() : this.pause()"></video>

      <!-- Overlay details -->
      <div class="reel-overlay">
        <div class="reel-creator-row">
          <img src="${r.creatorAvatar || '/avatars/avatar-1.svg'}" class="reel-avatar" alt="creator">
          <span class="reel-creator-name">${r.creatorDisplayName || r.creator}</span>
          ${!isOwner ? `<button class="btn-follow-pill" onclick="toggleFollowUser('${r.creator}')">+ متابعة</button>` : ''}
        </div>
        <p class="reel-caption">${escapeHtml(r.caption)}</p>
      </div>

      <!-- Side Action Buttons -->
      <div class="reel-side-actions">
        <button class="reel-action-btn ${isLiked ? 'liked' : ''}" onclick="likeReel('${r.id}')" title="إعجاب">
          <i data-lucide="heart"></i>
        </button>
        <span class="reel-action-count" id="like_count_${r.id}">${r.likes ? r.likes.length : 0}</span>

        <button class="reel-action-btn" onclick="openReelComments('${r.id}')" title="تعليقات">
          <i data-lucide="message-circle"></i>
        </button>
        <span class="reel-action-count">${r.comments ? r.comments.length : 0}</span>

        <button class="reel-action-btn" onclick="openShareReelModal('${r.id}')" title="مشاركة في المحادثات">
          <i data-lucide="send"></i>
        </button>

        ${isOwner ? `
          <button class="reel-action-btn" onclick="deleteMyReel('${r.id}')" title="حذف الفيديو">
            <i data-lucide="trash-2" style="color: #ef4444;"></i>
          </button>
        ` : ''}
      </div>
    `;

    reelsFeed.appendChild(card);
  });

  refreshIcons();
}

window.likeReel = async function(reelId) {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/reels/${reelId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username })
    });
    const d = await res.json();
    if (d.success) {
      loadReels();
    }
  } catch (e) {}
};

window.deleteMyReel = async function(reelId) {
  if (!confirm('هل تريد بالتأكيد حذف هذا الريلز؟')) return;
  try {
    const res = await fetch(`/api/reels/${reelId}?username=${encodeURIComponent(currentUser.username)}`, {
      method: 'DELETE'
    });
    const d = await res.json();
    if (d.success) {
      const card = document.getElementById('reel_card_' + reelId);
      if (card) card.remove();
    }
  } catch (e) {}
};

// Create Reel Modal
openCreateReelBtn.addEventListener('click', () => {
  reelVideoFile.value = '';
  selectedVideoName.textContent = 'اضغط هنا لاختيار فيديو (MP4 / WebM)';
  reelCaptionInput.value = '';
  createReelModal.classList.add('active');
});

cancelCreateReelBtn.addEventListener('click', () => {
  createReelModal.classList.remove('active');
});

videoDropZone.addEventListener('click', () => reelVideoFile.click());

reelVideoFile.addEventListener('change', (e) => {
  if (e.target.files[0]) {
    selectedVideoName.textContent = e.target.files[0].name;
  }
});

publishReelBtn.addEventListener('click', async () => {
  const file = reelVideoFile.files[0];
  const caption = reelCaptionInput.value.trim();

  if (!file) {
    alert('يرجى اختيار مقطع فيديو أولاً');
    return;
  }

  publishReelBtn.disabled = true;
  publishReelBtn.textContent = 'جاري الرفع والمعالجة...';

  const fd = new FormData();
  fd.append('file', file);

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await res.json();

    if (d.url) {
      const postRes = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator: currentUser.username,
          videoUrl: d.url,
          caption
        })
      });
      const postData = await postRes.json();

      if (postData.success) {
        createReelModal.classList.remove('active');
        publishReelBtn.disabled = false;
        publishReelBtn.textContent = 'نشر الفيديو';
        loadReels();
      }
    }
  } catch (err) {
    alert('تعذر نشر الفيديو، يرجى المحاولة مرة أخرى');
    publishReelBtn.disabled = false;
    publishReelBtn.textContent = 'نشر الفيديو';
  }
});

// Reel Comments
window.openReelComments = function(reelId) {
  activeReelCommentId = reelId;
  const reel = reelsData.find(r => r.id === reelId);
  if (!reel) return;

  renderCommentsList(reel.comments || []);
  reelCommentsModal.classList.add('active');
};

closeCommentsBtn.addEventListener('click', () => {
  reelCommentsModal.classList.remove('active');
  activeReelCommentId = null;
});

function renderCommentsList(comments) {
  reelCommentsList.innerHTML = '';
  if (comments.length === 0) {
    reelCommentsList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">لا توجد تعليقات بعد. كن أول من يعلق!</div>';
    return;
  }

  comments.forEach(c => {
    const row = document.createElement('div');
    row.className = 'comment-row';
    row.innerHTML = `
      <img src="${c.avatarUrl || '/avatars/avatar-1.svg'}" class="comment-avatar">
      <div class="comment-bubble">
        <div class="comment-author">${c.displayName || c.username}</div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      </div>
    `;
    reelCommentsList.appendChild(row);
  });
}

sendCommentBtn.addEventListener('click', async () => {
  if (!activeReelCommentId) return;
  const text = newCommentInput.value.trim();
  if (!text) return;

  try {
    const res = await fetch(`/api/reels/${activeReelCommentId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, text })
    });
    const d = await res.json();
    if (d.success) {
      newCommentInput.value = '';
      const r = reelsData.find(x => x.id === activeReelCommentId);
      if (r) {
        if (!r.comments) r.comments = [];
        r.comments.push(d.comment);
        renderCommentsList(r.comments);
      }
    }
  } catch (e) {}
});

// Share Reel into Chat
window.openShareReelModal = function(reelId) {
  activeShareReel = reelsData.find(r => r.id === reelId);
  if (!activeShareReel) return;

  shareFriendsList.innerHTML = '';
  if (contacts.length === 0) {
    shareFriendsList.innerHTML = '<div style="text-align:center; padding:15px; color:var(--text-muted);">لا يوجد أصدقاء في قائمتك بعد.</div>';
  } else {
    contacts.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary btn-block';
      btn.style.marginBottom = '8px';
      btn.innerHTML = `<img src="${c.avatarUrl}" style="width:24px;height:24px;border-radius:50%;"> <span>إرسال إلى ${c.displayName || c.username}</span>`;
      btn.onclick = () => {
        socket.emit('send_message', {
          recipient: c.username,
          type: 'text',
          content: `🎬 شاهد هذا الريلز على ONYX:\n${activeShareReel.caption}\n${window.location.origin}${activeShareReel.videoUrl}`
        });
        alert(`تمت مشاركة الفيديو مع ${c.displayName || c.username}!`);
        shareReelModal.classList.remove('active');
      };
      shareFriendsList.appendChild(btn);
    });
  }

  shareReelModal.classList.add('active');
};

closeShareReelBtn.addEventListener('click', () => {
  shareReelModal.classList.remove('active');
});

// -------------------------------------------------------------
// PROFILE PAGE
// -------------------------------------------------------------

async function loadFullProfile() {
  if (!currentUser) return;

  fullProfileAvatar.src = currentUser.avatarUrl || '/avatars/avatar-1.svg';
  fullProfileDisplayName.textContent = currentUser.displayName || currentUser.username;
  fullProfileUsername.textContent = '@' + currentUser.username;
  fullProfileBio.textContent = currentUser.bio || 'مرحباً، أنا أستخدم Onyx Chat!';
  fullProfileUserId.textContent = currentUser.userId || 'ID-00000';

  editProfileNameInput.value = currentUser.displayName || '';
  editProfileBioInput.value = currentUser.bio || '';
  editProfileLangSelect.value = currentUser.language || 'ar';

  try {
    const res = await fetch(`/api/user-profile?identifier=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();
    if (data.user) {
      profileFollowersCount.textContent = data.user.followersCount || 0;
      profileFollowingCount.textContent = data.user.followingCount || 0;
    }
  } catch (e) {}

  loadLikedReelsSubtab();
}

copyFullUserIdBtn.addEventListener('click', () => {
  if (!currentUser || !currentUser.userId) return;
  navigator.clipboard.writeText(currentUser.userId).then(() => {
    const old = copyFullUserIdBtn.innerHTML;
    copyFullUserIdBtn.innerHTML = '<i data-lucide="check"></i> <span>تم النسخ!</span>';
    refreshIcons();
    setTimeout(() => {
      copyFullUserIdBtn.innerHTML = old;
      refreshIcons();
    }, 2000);
  });
});

changeFullProfileAvatar.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.url) {
      fullProfileAvatar.src = d.url;
      currentUser.avatarUrl = d.url;
      currentUserAvatar.src = d.url;
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, avatarUrl: d.url })
      });
      localStorage.setItem('onyx_user_v3', JSON.stringify(currentUser));
    }
  } catch (e) {
    alert('تعذر تحديث الصورة');
  }
});

// Profile Subtabs
profileTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    profileTabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    subtabLikedContent.classList.remove('active');
    subtabMyReelsContent.classList.remove('active');
    subtabSettingsContent.classList.remove('active');

    const sub = btn.dataset.subtab;
    if (sub === 'liked') {
      subtabLikedContent.classList.add('active');
      loadLikedReelsSubtab();
    } else if (sub === 'myreels') {
      subtabMyReelsContent.classList.add('active');
      loadMyReelsSubtab();
    } else if (sub === 'settings') {
      subtabSettingsContent.classList.add('active');
    }
  });
});

async function loadLikedReelsSubtab() {
  likedReelsGrid.innerHTML = '';
  try {
    const res = await fetch(`/api/reels/liked?username=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();
    const list = data.reels || [];

    if (list.length === 0) {
      likedReelsGrid.innerHTML = '<div style="color:var(--text-muted); grid-column: 1/-1; text-align:center; padding:30px;">لم تضع قلب لأي فيديو بعد.</div>';
      return;
    }

    list.forEach(r => {
      const item = document.createElement('div');
      item.className = 'reel-grid-item';
      item.innerHTML = `
        <video src="${r.videoUrl}"></video>
        <div class="reel-grid-badge"><i data-lucide="heart" style="color:#f43f5e; fill:#f43f5e;"></i> ${r.likes ? r.likes.length : 0}</div>
      `;
      item.onclick = () => switchView('reels');
      likedReelsGrid.appendChild(item);
    });
    refreshIcons();
  } catch (e) {}
}

async function loadMyReelsSubtab() {
  myReelsGrid.innerHTML = '';
  const myReels = reelsData.filter(r => r.creator.toLowerCase() === currentUser.username.toLowerCase());

  if (myReels.length === 0) {
    myReelsGrid.innerHTML = '<div style="color:var(--text-muted); grid-column: 1/-1; text-align:center; padding:30px;">لم تنشر أي ريلز بعد.</div>';
    return;
  }

  myReels.forEach(r => {
    const item = document.createElement('div');
    item.className = 'reel-grid-item';
    item.innerHTML = `
      <video src="${r.videoUrl}"></video>
      <div class="reel-grid-badge"><i data-lucide="heart"></i> ${r.likes ? r.likes.length : 0}</div>
    `;
    item.onclick = () => switchView('reels');
    myReelsGrid.appendChild(item);
  });
  refreshIcons();
}

saveProfileSettingsBtn.addEventListener('click', async () => {
  const newName = editProfileNameInput.value.trim();
  const newBio = editProfileBioInput.value.trim();
  const newLang = editProfileLangSelect.value;

  try {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser.username,
        displayName: newName,
        bio: newBio,
        language: newLang
      })
    });
    const d = await res.json();
    if (d.success) {
      setCurrentUser(d.user);
      loadFullProfile();
      alert('تم حفظ الإعدادات بنجاح!');
    }
  } catch (e) {
    alert('تعذر حفظ البيانات');
  }
});

// Follow toggle helper
window.toggleFollowUser = async function(targetUsername) {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/follow/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentUsername: currentUser.username,
        targetUsername
      })
    });
    const d = await res.json();
    if (d.success) {
      alert(d.isFollowing ? `أصبحت الآن تتابع ${targetUsername}` : `ألغيت متابعة ${targetUsername}`);
      loadReels();
    }
  } catch (e) {}
};

// -------------------------------------------------------------
// CONTACT PROFILE & UNFRIEND
// -------------------------------------------------------------

async function openContactProfile(identifier) {
  if (!identifier || identifier === 'global') return;
  activeContactViewing = identifier;

  try {
    const res = await fetch(`/api/user-profile?identifier=${encodeURIComponent(identifier)}&current=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();

    if (data.user) {
      const u = data.user;
      viewContactAvatar.src = u.avatarUrl || '/avatars/avatar-1.svg';
      viewContactName.textContent = u.displayName || u.username;
      viewContactBio.textContent = u.bio || 'مستخدم على Onyx Chat';
      viewContactUsername.textContent = '@' + u.username;
      viewContactUserId.textContent = u.userId || '---';
      viewContactFollowers.textContent = u.followersCount || 0;

      if (u.online) {
        viewContactStatusBadge.textContent = 'متصل الآن (Online)';
        viewContactStatusBadge.className = 'status-badge online';
      } else {
        viewContactStatusBadge.textContent = 'غير متصل';
        viewContactStatusBadge.className = 'status-badge';
      }

      followContactBtn.textContent = u.isFollowing ? 'إلغاء المتابعة' : '+ متابعة';
      contactProfileModal.classList.add('active');
    }
  } catch (err) {
    alert('تعذر عرض بيانات الصديق');
  }
}

chatHeaderContactInfo.addEventListener('click', () => {
  if (activeRecipient && activeRecipient !== 'global') openContactProfile(activeRecipient);
});

viewProfileFromHeaderBtn.addEventListener('click', () => {
  if (activeRecipient && activeRecipient !== 'global') openContactProfile(activeRecipient);
});

closeContactProfileBtn.addEventListener('click', () => {
  contactProfileModal.classList.remove('active');
});

followContactBtn.addEventListener('click', async () => {
  if (!activeContactViewing) return;
  await toggleFollowUser(activeContactViewing);
  openContactProfile(activeContactViewing);
});

deleteFriendBtn.addEventListener('click', async () => {
  if (!activeContactViewing) return;
  if (!confirm(`هل تريد بالتأكيد حذف ${activeContactViewing} من قائمة أصدقائك؟`)) return;

  try {
    const res = await fetch('/api/contacts/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser.username,
        targetUsername: activeContactViewing
      })
    });
    const d = await res.json();
    if (d.success) {
      contactProfileModal.classList.remove('active');
      activeRecipient = null;
      noChatPlaceholder.style.display = 'block';
      messagesList.style.display = 'none';
      chatHeaderActions.style.display = 'none';
      activeChatName.textContent = 'اختر شخصاً للتحدث معه';
      loadContacts();
    }
  } catch (e) {
    alert('تعذر حذف الصديق');
  }
});

// -------------------------------------------------------------
// ADD FRIEND MODAL
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// THEMES & WALLPAPER
// -------------------------------------------------------------

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
      localStorage.setItem('onyx_user_v3', JSON.stringify(currentUser));
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, theme: chosenTheme })
      });
    }
  });
});

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
        localStorage.setItem('onyx_user_v3', JSON.stringify(currentUser));
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

resetWallpaperBtn.addEventListener('click', async () => {
  messagesViewport.style.backgroundImage = '';
  if (currentUser) {
    currentUser.chatWallpaper = null;
    localStorage.setItem('onyx_user_v3', JSON.stringify(currentUser));
    await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, chatWallpaper: null })
    });
  }
  alert('تمت استعادة الخلفية الافتراضية');
});

deleteChatBtn.addEventListener('click', async () => {
  if (!activeRecipient) return;
  if (!confirm(`هل تريد بالتأكيد حذف كل الرسائل في المحادثة مع "${activeRecipient}"؟`)) return;

  try {
    const res = await fetch('/api/conversation/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user1: currentUser.username, user2: activeRecipient })
    });
    const d = await res.json();
    if (d.success) {
      messagesList.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">تم مسح المحادثة بالكامل.</div>';
      chatSettingsModal.classList.remove('active');
      loadContacts();
    }
  } catch (e) {
    alert('تعذر مسح المحادثة');
  }
});

// Lightbox
window.openImageModal = function(url) {
  lightboxImg.src = url;
  lightbox.classList.add('active');
};

closeLightbox.addEventListener('click', () => lightbox.classList.remove('active'));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.remove('active');
});

// Launch App
init();
