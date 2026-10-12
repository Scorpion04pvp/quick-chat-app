// ================= ONYX CHAT - INSTAGRAM EDITION CLIENT LOGIC =================

let currentUser = null;
let activeRecipient = null;
let socket = null;
let currentTab = 'contacts';
let currentView = 'home';
let contacts = [];
let postsData = [];
let reelsData = [];
let storiesData = [];
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

// DOM Elements
const authModal = document.getElementById('authModal');
const googleSignInBtn = document.getElementById('googleSignInBtn');
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

// Navigation & Views
const bottomNavBtns = document.querySelectorAll('.bnav-btn');
const viewHome = document.getElementById('viewHome');
const viewExplore = document.getElementById('viewExplore');
const viewCreate = document.getElementById('viewCreate');
const viewReels = document.getElementById('viewReels');
const viewDirect = document.getElementById('viewDirect');
const viewProfile = document.getElementById('viewProfile');

const logoHomeBtn = document.getElementById('logoHomeBtn');
const headerCreateBtn = document.getElementById('headerCreateBtn');
const headerDirectBtn = document.getElementById('headerDirectBtn');
const langToggleBtn = document.getElementById('langToggleBtn');
const currentLangLabel = document.getElementById('currentLangLabel');
const bnavAvatar = document.getElementById('bnavAvatar');

// Home Feed Elements
const storiesList = document.getElementById('storiesList');
const myStoryAvatar = document.getElementById('myStoryAvatar');
const addMyStoryBtn = document.getElementById('addMyStoryBtn');
const postsFeed = document.getElementById('postsFeed');

// Explore Elements
const exploreSearchInput = document.getElementById('exploreSearchInput');
const exploreSearchBtn = document.getElementById('exploreSearchBtn');
const searchResultCard = document.getElementById('searchResultCard');
const exploreGrid = document.getElementById('exploreGrid');

// Create Elements
const createTabBtns = document.querySelectorAll('.create-tab-btn');
const createUploadDropzone = document.getElementById('createUploadDropzone');
const createFileInput = document.getElementById('createFileInput');
const createUploadFileName = document.getElementById('createUploadFileName');
const createCaptionInput = document.getElementById('createCaptionInput');
const captionGroup = document.getElementById('captionGroup');
const submitCreateBtn = document.getElementById('submitCreateBtn');
let createType = 'post'; // 'post' | 'reel' | 'story'

// Reels Elements
const reelsFeed = document.getElementById('reelsFeed');

// Direct Elements
const directSidebar = document.getElementById('directSidebar');
const directHeaderUsername = document.getElementById('directHeaderUsername');
const directAddFriendBtn = document.getElementById('directAddFriendBtn');
const directBackToSidebar = document.getElementById('directBackToSidebar');
const contactsList = document.getElementById('contactsList');
const chatTabs = document.querySelectorAll('.chat-tabs .tab-btn');

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

// Profile Elements
const fullProfileAvatar = document.getElementById('fullProfileAvatar');
const changeFullProfileAvatar = document.getElementById('changeFullProfileAvatar');
const fullProfileDisplayName = document.getElementById('fullProfileDisplayName');
const fullProfileUsername = document.getElementById('fullProfileUsername');
const fullProfileBio = document.getElementById('fullProfileBio');
const fullProfileUserId = document.getElementById('fullProfileUserId');
const copyFullUserIdBtn = document.getElementById('copyFullUserIdBtn');
const profilePostsCount = document.getElementById('profilePostsCount');
const profileFollowersCount = document.getElementById('profileFollowersCount');
const profileFollowingCount = document.getElementById('profileFollowingCount');

const openEditProfileModalBtn = document.getElementById('openEditProfileModalBtn');
const logoutProfileBtn = document.getElementById('logoutProfileBtn');
const gridTabBtns = document.querySelectorAll('.grid-tab-btn');
const profileGridContent = document.getElementById('profileGridContent');

// Edit Profile Modal
const editProfileModal = document.getElementById('editProfileModal');
const editNameInput = document.getElementById('editNameInput');
const editBioInput = document.getElementById('editBioInput');
const editLangSelect = document.getElementById('editLangSelect');
const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');
const saveEditProfileBtn = document.getElementById('saveEditProfileBtn');

// Comments Modal
const commentsModal = document.getElementById('commentsModal');
const commentsList = document.getElementById('commentsList');
const commentTextInput = document.getElementById('commentTextInput');
const submitCommentBtn = document.getElementById('submitCommentBtn');
const closeCommentsBtn = document.getElementById('closeCommentsBtn');
let activeCommentTarget = null; // { type: 'post'|'reel', id }

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

// Add Contact Modal
const addContactModal = document.getElementById('addContactModal');
const newContactInput = document.getElementById('newContactInput');
const confirmAddContactBtn = document.getElementById('confirmAddContactBtn');
const cancelAddContactBtn = document.getElementById('cancelAddContactBtn');
const contactError = document.getElementById('contactError');

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

// Chat Settings Modal
const chatSettingsModal = document.getElementById('chatSettingsModal');
const themeOptions = document.querySelectorAll('.theme-option');
const wallpaperUploadInput = document.getElementById('wallpaperUploadInput');
const resetWallpaperBtn = document.getElementById('resetWallpaperBtn');
const deleteChatBtn = document.getElementById('deleteChatBtn');
const closeChatSettingsBtn = document.getElementById('closeChatSettingsBtn');

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
// LANGUAGE TOGGLING
// -------------------------------------------------------------

function setLanguage(lang) {
  currentLang = lang;
  document.body.dataset.lang = lang;
  currentLangLabel.textContent = lang === 'ar' ? 'العربية' : 'English';
  editLangSelect.value = lang;
  if (currentUser) {
    currentUser.language = lang;
    localStorage.setItem('onyx_insta_user', JSON.stringify(currentUser));
  }
}

langToggleBtn.addEventListener('click', () => {
  setLanguage(currentLang === 'ar' ? 'en' : 'ar');
});

// -------------------------------------------------------------
// AUTHENTICATION (GOOGLE & GMAIL VERIFICATION)
// -------------------------------------------------------------

// Google One-Click Auth
googleSignInBtn.addEventListener('click', async () => {
  const email = prompt('أدخل بريد Gmail الخاص بك لتسجيل الدخول الفوري:', 'user@gmail.com');
  if (!email) return;

  const name = email.split('@')[0];
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        avatarUrl: '/avatars/avatar-1.svg'
      })
    });
    const data = await res.json();
    if (data.success) {
      setCurrentUser(data.user);
      authModal.classList.remove('active');
      setupApp();
    } else {
      alert(data.error || 'فشل الدخول بحساب Google');
    }
  } catch (err) {
    alert('حدث خطأ في الاتصال');
  }
});

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

methodEmailBtn.addEventListener('click', () => {
  methodEmailBtn.classList.add('active');
  methodPhoneBtn.classList.remove('active');
  contactInputLabel.textContent = 'بريدك الإلكتروني (Gmail):';
  registerContactInput.placeholder = 'example@gmail.com';
});

methodPhoneBtn.addEventListener('click', () => {
  methodPhoneBtn.classList.add('active');
  methodEmailBtn.classList.remove('active');
  contactInputLabel.textContent = 'رقم هاتفك:';
  registerContactInput.placeholder = '0655123456';
});

// Send Verification Code (Gmail / Phone)
sendCodeBtn.addEventListener('click', async () => {
  const contactVal = registerContactInput.value.trim();
  if (!contactVal) {
    alert('يرجى إدخال البريد الإلكتروني أو رقم الهاتف');
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
      codeGroup.style.display = 'block';
      registerDetailsSection.style.display = 'block';

      toastCode.textContent = data.code;
      codeNotificationToast.style.display = 'flex';

      toastCopyBtn.onclick = () => {
        registerCodeInput.value = data.code;
        codeNotificationToast.style.display = 'none';
      };

      sendCodeBtn.textContent = 'تم الإرسال ✓';
    } else {
      alert(data.error || 'تعذر إرسال الكود');
      sendCodeBtn.textContent = 'إرسال الكود';
      sendCodeBtn.disabled = false;
    }
  } catch (err) {
    alert('فشل الاتصال');
    sendCodeBtn.textContent = 'إرسال الكود';
    sendCodeBtn.disabled = false;
  }
});

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
      registerError.textContent = data.error || 'فشل التسجيل';
      registerError.style.display = 'block';
    }
  } catch (err) {
    registerError.textContent = 'فشل الاتصال';
    registerError.style.display = 'block';
  }
});

// Submit Login
submitLoginBtn.addEventListener('click', async () => {
  const usernameOrContact = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!usernameOrContact || !password) {
    loginError.textContent = 'يرجى إدخال الحساب وكلمة المرور';
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
    loginError.textContent = 'فشل الاتصال';
    loginError.style.display = 'block';
  }
});

function setCurrentUser(user) {
  currentUser = user;
  localStorage.setItem('onyx_insta_user', JSON.stringify(user));
  setLanguage(user.language || 'ar');
  applyTheme(user.theme || 'onyx-purple');
  if (user.chatWallpaper) {
    messagesViewport.style.backgroundImage = `url("${user.chatWallpaper}")`;
  }
}

// Logout
logoutProfileBtn.addEventListener('click', () => {
  if (confirm('هل ترغب بالتأكيد في تسجيل الخروج من حسابك؟')) {
    localStorage.removeItem('onyx_insta_user');
    window.location.reload();
  }
});

// -------------------------------------------------------------
// NAVIGATION BAR ROUTING
// -------------------------------------------------------------

function switchView(viewName) {
  currentView = viewName;
  bottomNavBtns.forEach(btn => {
    if (btn.dataset.view === viewName) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  viewHome.classList.remove('active');
  viewExplore.classList.remove('active');
  viewCreate.classList.remove('active');
  viewReels.classList.remove('active');
  viewDirect.classList.remove('active');
  viewProfile.classList.remove('active');

  if (viewName === 'home') {
    viewHome.classList.add('active');
    loadStories();
    loadPosts();
  } else if (viewName === 'explore') {
    viewExplore.classList.add('active');
    loadExploreGrid();
  } else if (viewName === 'create') {
    viewCreate.classList.add('active');
  } else if (viewName === 'reels') {
    viewReels.classList.add('active');
    loadReels();
  } else if (viewName === 'direct') {
    viewDirect.classList.add('active');
    loadContacts();
  } else if (viewName === 'profile') {
    viewProfile.classList.add('active');
    loadProfile();
  }
}

bottomNavBtns.forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

logoHomeBtn.addEventListener('click', () => switchView('home'));
headerCreateBtn.addEventListener('click', () => switchView('create'));
headerDirectBtn.addEventListener('click', () => switchView('direct'));

// -------------------------------------------------------------
// INITIALIZATION & REALTIME
// -------------------------------------------------------------

function init() {
  refreshIcons();
  const saved = localStorage.getItem('onyx_insta_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      setCurrentUser(parsed);
      authModal.classList.remove('active');
      setupApp();
      return;
    } catch (e) {
      localStorage.removeItem('onyx_insta_user');
    }
  }
  authModal.classList.add('active');
}

function setupApp() {
  bnavAvatar.src = currentUser.avatarUrl || '/avatars/avatar-1.svg';
  myStoryAvatar.src = currentUser.avatarUrl || '/avatars/avatar-1.svg';
  directHeaderUsername.textContent = currentUser.displayName || currentUser.username;

  initSocket();
  switchView('home');
}

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
      typingText.textContent = `${sender} يكتب الآن...`;
      typingIndicator.style.display = isTyping ? 'flex' : 'none';
    }
  });

  // Calls
  socket.on('incoming_call', ({ caller, callerData, isVideo }) => {
    activeCallTarget = caller;
    isAudioCallOnly = !isVideo;
    incomingCallerName.textContent = callerData.displayName || caller;
    incomingCallerAvatar.src = callerData.avatarUrl || '/avatars/avatar-1.svg';
    incomingCallType.textContent = isVideo ? 'مكالمة فيديو واردة...' : 'مكالمة صوتية واردة...';
    incomingCallModal.classList.add('active');
  });

  socket.on('call_response', ({ from, accepted }) => {
    if (accepted) callStatusText.textContent = 'متصل (E2E مشفرة) • 00:01';
    else {
      callStatusText.textContent = 'تم رفض المكالمة';
      setTimeout(() => closeCallUI(), 2000);
    }
  });

  socket.on('call_ended', () => closeCallUI());

  // Real-time Posts, Stories & Reels
  socket.on('new_post', () => { if (currentView === 'home') loadPosts(); });
  socket.on('new_story', () => { if (currentView === 'home') loadStories(); });
  socket.on('new_reel', () => { if (currentView === 'reels') loadReels(); });
}

// -------------------------------------------------------------
// 1. HOME FEED & STORIES
// -------------------------------------------------------------

async function loadStories() {
  try {
    const res = await fetch('/api/stories');
    const data = await res.json();
    storiesData = data.stories || [];
    renderStories();
  } catch (e) {}
}

function renderStories() {
  storiesList.innerHTML = '';
  storiesData.forEach(s => {
    const div = document.createElement('div');
    div.className = 'story-item';
    div.innerHTML = `
      <div class="story-avatar-wrap">
        <img src="${s.creatorAvatar}" alt="${s.creator}">
      </div>
      <span class="story-username">${s.creatorDisplayName || s.creator}</span>
    `;
    div.onclick = () => {
      openImageModal(s.mediaUrl);
    };
    storiesList.appendChild(div);
  });
}

addMyStoryBtn.addEventListener('click', () => {
  createType = 'story';
  switchView('create');
  createTabBtns.forEach(b => {
    if (b.dataset.type === 'story') b.classList.add('active');
    else b.classList.remove('active');
  });
  captionGroup.style.display = 'none';
});

async function loadPosts() {
  try {
    const res = await fetch('/api/posts');
    const data = await res.json();
    postsData = data.posts || [];
    renderPosts();
  } catch (e) {}
}

function renderPosts() {
  postsFeed.innerHTML = '';

  if (postsData.length === 0) {
    postsFeed.innerHTML = `
      <div style="text-align:center; padding: 60px 20px; color: var(--text-muted);">
        <i data-lucide="image" style="width: 50px; height: 50px; margin-bottom: 12px; color: var(--primary);"></i>
        <h3>لا توجد منشورات بعد</h3>
        <p>كن أول من يشارك منشوراً مع الجميع! اضغط على <b>➕</b> لنشر صورة أو فيديو.</p>
      </div>
    `;
    refreshIcons();
    return;
  }

  postsData.forEach(p => {
    const isLiked = currentUser && p.likes && p.likes.includes(currentUser.username);
    const card = document.createElement('div');
    card.className = 'post-card';

    const isVideo = p.type === 'video';
    const mediaHtml = isVideo
      ? `<video src="${p.mediaUrl}" controls loop playsinline class="post-media"></video>`
      : `<img src="${p.mediaUrl}" class="post-media" onclick="openImageModal('${p.mediaUrl}')">`;

    card.innerHTML = `
      <div class="post-header">
        <div class="post-creator-info" onclick="openContactProfile('${p.creator}')">
          <div class="post-creator-avatar">
            <img src="${p.creatorAvatar || '/avatars/avatar-1.svg'}" alt="${p.creator}">
          </div>
          <div>
            <span class="post-creator-name">${p.creatorDisplayName || p.creator}</span>
            <div class="post-creator-id">${p.creatorUserId || ''}</div>
          </div>
        </div>
      </div>

      <div class="post-media-box">${mediaHtml}</div>

      <div class="post-actions-bar">
        <div class="post-action-icons">
          <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="likePost('${p.id}')">
            <i data-lucide="heart"></i>
          </button>
          <button class="post-action-btn" onclick="openComments('post', '${p.id}')">
            <i data-lucide="message-circle"></i>
          </button>
          <button class="post-action-btn" onclick="shareToDirect('${p.mediaUrl}', '${p.caption}')">
            <i data-lucide="send"></i>
          </button>
        </div>
      </div>

      <div class="post-likes-count">${p.likes ? p.likes.length : 0} إعجاب</div>

      <div class="post-caption-box">
        <strong>${p.creatorDisplayName || p.creator}</strong> ${escapeHtml(p.caption)}
      </div>

      <div class="post-comments-summary" onclick="openComments('post', '${p.id}')">
        عرض جميع التعليقات (${p.comments ? p.comments.length : 0})...
      </div>
    `;

    postsFeed.appendChild(card);
  });

  refreshIcons();
}

window.likePost = async function(postId) {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username })
    });
    const d = await res.json();
    if (d.success) loadPosts();
  } catch (e) {}
};

// -------------------------------------------------------------
// 2. EXPLORE VIEW (SEARCH BY USER ID / USERNAME)
// -------------------------------------------------------------

exploreSearchBtn.addEventListener('click', searchUserById);
exploreSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchUserById();
});

async function searchUserById() {
  const query = exploreSearchInput.value.trim();
  if (!query) return;

  try {
    const res = await fetch(`/api/user-profile?identifier=${encodeURIComponent(query)}&current=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();

    if (data.user) {
      const u = data.user;
      searchResultCard.style.display = 'flex';
      searchResultCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="openContactProfile('${u.username}')">
          <img src="${u.avatarUrl}" style="width: 44px; height: 44px; border-radius: 50%;">
          <div>
            <strong>${u.displayName}</strong>
            <div style="font-size: 0.75rem; color: var(--primary); font-family: monospace;">${u.userId} (@${u.username})</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary" onclick="openChatWith('${u.username}', '${u.avatarUrl}', ${u.online}, '${u.displayName}')">محادثة Direct</button>
        </div>
      `;
    } else {
      searchResultCard.style.display = 'block';
      searchResultCard.innerHTML = '<span style="color:#ef4444;">لم يتم العثور على مستخدم بهذا المعرف أو الاسم.</span>';
    }
  } catch (e) {
    searchResultCard.style.display = 'block';
    searchResultCard.innerHTML = '<span style="color:#ef4444;">خطأ في البحث.</span>';
  }
}

function loadExploreGrid() {
  exploreGrid.innerHTML = '';
  const mediaList = [...postsData, ...reelsData];
  mediaList.forEach(m => {
    const div = document.createElement('div');
    div.className = 'explore-item';
    const isVideo = m.videoUrl || m.type === 'video';
    const url = m.videoUrl || m.mediaUrl;
    div.innerHTML = isVideo ? `<video src="${url}"></video>` : `<img src="${url}">`;
    div.onclick = () => {
      if (isVideo) switchView('reels');
      else openImageModal(url);
    };
    exploreGrid.appendChild(div);
  });
}

// -------------------------------------------------------------
// 3. CREATE VIEW (POST, REEL, STORY)
// -------------------------------------------------------------

createTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    createTabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    createType = btn.dataset.type;
    captionGroup.style.display = createType === 'story' ? 'none' : 'block';
  });
});

createUploadDropzone.addEventListener('click', () => createFileInput.click());

createFileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) {
    createUploadFileName.textContent = e.target.files[0].name;
  }
});

submitCreateBtn.addEventListener('click', async () => {
  const file = createFileInput.files[0];
  const caption = createCaptionInput.value.trim();

  if (!file) {
    alert('يرجى اختيار ملف صورة أو فيديو أولاً');
    return;
  }

  submitCreateBtn.disabled = true;
  submitCreateBtn.textContent = 'جاري الرفع والنشر...';

  const fd = new FormData();
  fd.append('file', file);

  try {
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
    const uploadData = await uploadRes.json();

    if (uploadData.url) {
      const isVideo = uploadData.mimetype.startsWith('video');

      if (createType === 'post') {
        await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creator: currentUser.username,
            mediaUrl: uploadData.url,
            type: isVideo ? 'video' : 'image',
            caption
          })
        });
        switchView('home');
      } else if (createType === 'reel') {
        await fetch('/api/reels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creator: currentUser.username,
            videoUrl: uploadData.url,
            caption
          })
        });
        switchView('reels');
      } else if (createType === 'story') {
        await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creator: currentUser.username,
            mediaUrl: uploadData.url
          })
        });
        switchView('home');
      }

      createFileInput.value = '';
      createUploadFileName.textContent = 'اضغط هنا لاختيار صورة أو مقطع فيديو';
      createCaptionInput.value = '';
    }
  } catch (e) {
    alert('تعذر النشر، حاول مرة أخرى');
  }

  submitCreateBtn.disabled = false;
  submitCreateBtn.textContent = 'مشاركة ونشر الآن';
});

// -------------------------------------------------------------
// 4. REELS VIEW
// -------------------------------------------------------------

async function loadReels() {
  try {
    const res = await fetch('/api/reels');
    const data = await res.json();
    reelsData = data.reels || [];
    renderReels();
  } catch (e) {}
}

function renderReels() {
  reelsFeed.innerHTML = '';
  if (reelsData.length === 0) {
    reelsFeed.innerHTML = `
      <div style="text-align:center; padding: 60px 20px; color: var(--text-muted);">
        <i data-lucide="play-square" style="width: 50px; height: 50px; margin-bottom: 12px; color: var(--primary);"></i>
        <h3>لا توجد مقاطع ريلز بعد</h3>
        <p>اضغط على <b>➕</b> لنشر ريلز جديد الآن!</p>
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

      <div class="reel-overlay">
        <div class="reel-creator-row">
          <img src="${r.creatorAvatar || '/avatars/avatar-1.svg'}" class="reel-avatar">
          <span class="reel-creator-name">${r.creatorDisplayName || r.creator}</span>
          ${!isOwner ? `<button class="btn-follow-pill" onclick="toggleFollowUser('${r.creator}')">+ متابعة</button>` : ''}
        </div>
        <p class="reel-caption">${escapeHtml(r.caption)}</p>
      </div>

      <div class="reel-side-actions">
        <button class="reel-action-btn ${isLiked ? 'liked' : ''}" onclick="likeReel('${r.id}')">
          <i data-lucide="heart"></i>
        </button>
        <span style="font-size:0.75rem; color:white;">${r.likes ? r.likes.length : 0}</span>

        <button class="reel-action-btn" onclick="openComments('reel', '${r.id}')">
          <i data-lucide="message-circle"></i>
        </button>
        <span style="font-size:0.75rem; color:white;">${r.comments ? r.comments.length : 0}</span>

        <button class="reel-action-btn" onclick="shareToDirect('${r.videoUrl}', '${r.caption}')">
          <i data-lucide="send"></i>
        </button>

        ${isOwner ? `
          <button class="reel-action-btn" onclick="deleteMyReel('${r.id}')">
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
    if (d.success) loadReels();
  } catch (e) {}
};

window.deleteMyReel = async function(reelId) {
  if (!confirm('هل تريد حذف هذا الريلز؟')) return;
  try {
    const res = await fetch(`/api/reels/${reelId}?username=${encodeURIComponent(currentUser.username)}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) {
      const c = document.getElementById('reel_card_' + reelId);
      if (c) c.remove();
    }
  } catch (e) {}
};

// -------------------------------------------------------------
// COMMENTS MODAL (POSTS & REELS)
// -------------------------------------------------------------

window.openComments = function(type, id) {
  activeCommentTarget = { type, id };
  let comments = [];

  if (type === 'post') {
    const p = postsData.find(x => x.id === id);
    if (p) comments = p.comments || [];
  } else {
    const r = reelsData.find(x => x.id === id);
    if (r) comments = r.comments || [];
  }

  renderComments(comments);
  commentsModal.classList.add('active');
};

closeCommentsBtn.addEventListener('click', () => {
  commentsModal.classList.remove('active');
  activeCommentTarget = null;
});

function renderComments(list) {
  commentsList.innerHTML = '';
  if (list.length === 0) {
    commentsList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">لا توجد تعليقات بعد.</div>';
    return;
  }
  list.forEach(c => {
    const row = document.createElement('div');
    row.className = 'comment-row';
    row.innerHTML = `
      <img src="${c.avatarUrl || '/avatars/avatar-1.svg'}" class="comment-avatar">
      <div class="comment-bubble">
        <div class="comment-author">${c.displayName || c.username}</div>
        <div>${escapeHtml(c.text)}</div>
      </div>
    `;
    commentsList.appendChild(row);
  });
}

submitCommentBtn.addEventListener('click', async () => {
  if (!activeCommentTarget) return;
  const text = commentTextInput.value.trim();
  if (!text) return;

  const endpoint = activeCommentTarget.type === 'post'
    ? `/api/posts/${activeCommentTarget.id}/comment`
    : `/api/reels/${activeCommentTarget.id}/comment`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, text })
    });
    const d = await res.json();
    if (d.success) {
      commentTextInput.value = '';
      if (activeCommentTarget.type === 'post') loadPosts();
      else loadReels();
      commentsModal.classList.remove('active');
    }
  } catch (e) {}
});

// Share to Direct
window.shareToDirect = function(url, caption) {
  switchView('direct');
  if (activeRecipient) {
    socket.emit('send_message', {
      recipient: activeRecipient,
      type: 'text',
      content: `مشاركة من ONYX:\n${caption}\n${window.location.origin}${url}`
    });
    alert('تم إرسال الرابط في المحادثة الحالية!');
  } else {
    alert('اختر صديقاً من قائمة الرسائل الخاصة لإرسال المنشور إليه.');
  }
};

// -------------------------------------------------------------
// 5. DIRECT MESSAGES VIEW
// -------------------------------------------------------------

async function loadContacts() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/contacts?username=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();
    contacts = data.contacts || [];
    renderContactsList();
  } catch (e) {}
}

function renderContactsList() {
  contactsList.innerHTML = '';
  if (contacts.length === 0) {
    contactsList.innerHTML = `
      <div style="text-align:center; padding:24px 16px; color:var(--text-muted); font-size:0.85rem;">
        لا توجد محادثات بعد.<br>
        أضف صديقك برمز المعرف <b>${currentUser.userId}</b>!
      </div>
    `;
    return;
  }

  contacts.forEach(c => {
    const card = document.createElement('div');
    card.className = `contact-card ${activeRecipient && activeRecipient.toLowerCase() === c.username.toLowerCase() ? 'active' : ''}`;
    
    let lastMsg = 'لا توجد رسائل';
    if (c.lastMessage) {
      if (c.lastMessage.type === 'image') lastMsg = '📷 صورة';
      else if (c.lastMessage.type === 'audio') lastMsg = '🎙️ فوكال';
      else lastMsg = c.lastMessage.content;
    }

    card.innerHTML = `
      <div class="avatar-container">
        <img src="${c.avatarUrl || '/avatars/avatar-1.svg'}" alt="${c.username}">
        <span class="status-indicator ${c.online ? 'online' : ''}"></span>
      </div>
      <div class="contact-info">
        <div class="contact-top">
          <span class="contact-name">${c.displayName || c.username}</span>
          <span style="font-size:0.7rem; color:var(--text-muted);">${c.lastMessage ? formatTime(c.lastMessage.timestamp) : ''}</span>
        </div>
        <p class="contact-last-msg">${lastMsg}</p>
      </div>
    `;
    card.onclick = () => openChatWith(c.username, c.avatarUrl, c.online, c.displayName);
    contactsList.appendChild(card);
  });
}

chatTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    chatTabs.forEach(b => b.classList.remove('active'));
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
    directSidebar.classList.add('hidden');
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
      messagesList.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">المحادثة فارغة ومشفرة. ابدأ بالتحدث الآن!</div>';
    }
    messagesViewport.scrollTop = messagesViewport.scrollHeight;
  } catch (err) {
    messagesList.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444;">تعذر تحميل الرسائل</div>';
  }

  messageInput.focus();
}

function updateActiveChatHeaderStatus(isOnline) {
  if (activeRecipient === 'global') {
    activeChatStatus.textContent = 'غرفة عامة مشفرة';
    activeChatStatusIndicator.className = 'status-indicator online';
    return;
  }
  if (isOnline) {
    activeChatStatus.textContent = 'متصل الآن • E2E مشفرة';
    activeChatStatusIndicator.className = 'status-indicator online';
  } else {
    activeChatStatus.textContent = 'غير متصل';
    activeChatStatusIndicator.className = 'status-indicator';
  }
}

directBackToSidebar.addEventListener('click', () => {
  directSidebar.classList.remove('hidden');
});

function appendMessageToUI(msg) {
  const isOutgoing = msg.sender.toLowerCase() === currentUser.username.toLowerCase();
  const row = document.createElement('div');
  row.className = `message-row ${isOutgoing ? 'outgoing' : 'incoming'}`;
  row.id = 'msg_row_' + msg.id;

  let contentHtml = '';
  const senderHeader = (!isOutgoing && activeRecipient === 'global')
    ? `<div style="font-size:0.75rem; font-weight:700; color:#38bdf8; margin-bottom:4px;">${msg.sender}</div>`
    : '';

  if (msg.type === 'image') {
    contentHtml = `
      ${senderHeader}
      <img src="${msg.mediaUrl}" style="max-width:260px; max-height:260px; border-radius:12px; cursor:pointer;" onclick="openImageModal('${msg.mediaUrl}')">
      <div style="font-size:0.65rem; opacity:0.7; margin-top:4px; text-align:left; direction:ltr;">${formatTime(msg.timestamp)}</div>
    `;
  } else if (msg.type === 'audio') {
    const audioId = 'audio_' + msg.id;
    contentHtml = `
      ${senderHeader}
      <div class="vocal-player">
        <button class="vocal-play-btn" onclick="toggleAudioPlay('${audioId}', this)"><i data-lucide="play"></i></button>
        <div class="vocal-progress-bar" onclick="seekAudio('${audioId}', event)">
          <div class="vocal-progress-fill" id="fill_${audioId}"></div>
        </div>
        <span style="font-size:0.75rem; font-family:monospace;" id="time_${audioId}">${msg.duration ? formatDuration(msg.duration) : '0:00'}</span>
        <audio id="${audioId}" src="${msg.mediaUrl}" preload="metadata"></audio>
      </div>
      <div style="font-size:0.65rem; opacity:0.7; margin-top:4px; text-align:left; direction:ltr;">${formatTime(msg.timestamp)}</div>
    `;
  } else {
    contentHtml = `
      ${senderHeader}
      <div style="font-size:0.95rem; line-height:1.4;">${escapeHtml(msg.content)}</div>
      <div style="font-size:0.65rem; opacity:0.7; margin-top:4px; text-align:left; direction:ltr;">${formatTime(msg.timestamp)}</div>
    `;
  }

  let deleteBtn = isOutgoing ? `<button class="msg-delete-btn" onclick="deleteSingleMessage('${msg.id}')" title="حذف الرسالة"><i data-lucide="trash-2"></i></button>` : '';

  row.innerHTML = `<div class="msg-bubble">${contentHtml}</div>${deleteBtn}`;
  messagesList.appendChild(row);
  refreshIcons();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.deleteSingleMessage = async function(messageId) {
  if (!confirm('حذف هذه الرسالة؟')) return;
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
  } catch (e) {}
};

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
  } catch (e) {}
  imageUploadInput.value = '';
});

// Vocal recording
recordVocalBtn.addEventListener('click', async () => {
  if (!activeRecipient) {
    alert('اختر محادثة أولاً');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startRecording(stream);
  } catch (e) {
    alert('يرجى السماح بالوصول للميكروفون');
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
  mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
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
    } catch (e) {}
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
// CALLS SYSTEM
// -------------------------------------------------------------

async function initiateCall(isVideo) {
  if (!activeRecipient || activeRecipient === 'global') return;
  activeCallTarget = activeRecipient;
  isAudioCallOnly = !isVideo;
  callUserName.textContent = activeChatName.textContent;
  callUserAvatar.src = activeChatAvatar.src;
  callStatusText.textContent = isVideo ? 'بدء مكالمة فيديو...' : 'جاري الاتصال...';

  callModal.classList.add('active');

  if (isVideo) {
    callVideoViewport.style.display = 'block';
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    } catch (e) {}
  } else {
    callVideoViewport.style.display = 'none';
  }

  socket.emit('call_start', {
    recipient: activeRecipient,
    isVideo,
    callerData: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl }
  });
}

startAudioCallBtn.addEventListener('click', () => initiateCall(false));
startVideoCallBtn.addEventListener('click', () => initiateCall(true));

acceptCallBtn.addEventListener('click', async () => {
  incomingCallModal.classList.remove('active');
  callModal.classList.add('active');
  callUserName.textContent = incomingCallerName.textContent;
  callUserAvatar.src = incomingCallerAvatar.src;
  callStatusText.textContent = 'متصل • 00:01';

  if (!isAudioCallOnly) {
    callVideoViewport.style.display = 'block';
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    } catch (e) {}
  }

  socket.emit('call_answer', { caller: activeCallTarget, accepted: true });
});

declineCallBtn.addEventListener('click', () => {
  incomingCallModal.classList.remove('active');
  socket.emit('call_answer', { caller: activeCallTarget, accepted: false });
  activeCallTarget = null;
});

endCallBtn.addEventListener('click', () => {
  if (activeCallTarget) socket.emit('call_end', { targetUser: activeCallTarget });
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
// 6. INSTAGRAM PROFILE VIEW
// -------------------------------------------------------------

async function loadProfile() {
  if (!currentUser) return;

  fullProfileAvatar.src = currentUser.avatarUrl || '/avatars/avatar-1.svg';
  fullProfileDisplayName.textContent = currentUser.displayName || currentUser.username;
  fullProfileUsername.textContent = '@' + currentUser.username;
  fullProfileBio.textContent = currentUser.bio || 'مرحباً، أنا أستخدم ONYX CHAT!';
  fullProfileUserId.textContent = currentUser.userId || 'ID-00000';

  try {
    const res = await fetch(`/api/user-profile?identifier=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();
    if (data.user) {
      profilePostsCount.textContent = data.user.postsCount || 0;
      profileFollowersCount.textContent = data.user.followersCount || 0;
      profileFollowingCount.textContent = data.user.followingCount || 0;
    }
  } catch (e) {}

  loadProfileGrid('posts');
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
      bnavAvatar.src = d.url;
      currentUser.avatarUrl = d.url;
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, avatarUrl: d.url })
      });
      localStorage.setItem('onyx_insta_user', JSON.stringify(currentUser));
    }
  } catch (e) {}
});

gridTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    gridTabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadProfileGrid(btn.dataset.subtab);
  });
});

async function loadProfileGrid(subtab) {
  profileGridContent.innerHTML = '';

  if (subtab === 'posts') {
    const myPosts = postsData.filter(p => p.creator.toLowerCase() === currentUser.username.toLowerCase());
    if (myPosts.length === 0) {
      profileGridContent.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">لا توجد منشورات بعد.</div>';
      return;
    }
    myPosts.forEach(p => {
      const div = document.createElement('div');
      div.className = 'grid-thumb';
      div.innerHTML = p.type === 'video' ? `<video src="${p.mediaUrl}"></video>` : `<img src="${p.mediaUrl}">`;
      div.onclick = () => openImageModal(p.mediaUrl);
      profileGridContent.appendChild(div);
    });
  } else if (subtab === 'myreels') {
    const myReels = reelsData.filter(r => r.creator.toLowerCase() === currentUser.username.toLowerCase());
    if (myReels.length === 0) {
      profileGridContent.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">لا توجد مقاطع ريلز بعد.</div>';
      return;
    }
    myReels.forEach(r => {
      const div = document.createElement('div');
      div.className = 'grid-thumb';
      div.innerHTML = `<video src="${r.videoUrl}"></video>`;
      div.onclick = () => switchView('reels');
      profileGridContent.appendChild(div);
    });
  } else if (subtab === 'liked') {
    try {
      const res = await fetch(`/api/reels/liked?username=${encodeURIComponent(currentUser.username)}`);
      const data = await res.json();
      const list = data.reels || [];
      if (list.length === 0) {
        profileGridContent.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">لم تقم بوضع قلب لأي محتوى بعد.</div>';
        return;
      }
      list.forEach(r => {
        const div = document.createElement('div');
        div.className = 'grid-thumb';
        div.innerHTML = `<video src="${r.videoUrl}"></video>`;
        div.onclick = () => switchView('reels');
        profileGridContent.appendChild(div);
      });
    } catch (e) {}
  }
}

// Edit Profile Modal
openEditProfileModalBtn.addEventListener('click', () => {
  editNameInput.value = currentUser.displayName || '';
  editBioInput.value = currentUser.bio || '';
  editLangSelect.value = currentUser.language || 'ar';
  editProfileModal.classList.add('active');
});

cancelEditProfileBtn.addEventListener('click', () => editProfileModal.classList.remove('active'));

saveEditProfileBtn.addEventListener('click', async () => {
  const newName = editNameInput.value.trim();
  const newBio = editBioInput.value.trim();
  const newLang = editLangSelect.value;

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
      editProfileModal.classList.remove('active');
      loadProfile();
      alert('تم حفظ البيانات بنجاح!');
    }
  } catch (e) {}
});

// Follow toggle helper
window.toggleFollowUser = async function(targetUsername) {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/follow/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUsername: currentUser.username, targetUsername })
    });
    const d = await res.json();
    if (d.success) {
      alert(d.isFollowing ? `أصبحت الآن تتابع ${targetUsername}` : `ألغيت متابعة ${targetUsername}`);
      loadPosts();
      loadReels();
    }
  } catch (e) {}
};

// Contact Profile
window.openContactProfile = async function(identifier) {
  if (!identifier || identifier === 'global') return;
  activeContactViewing = identifier;

  try {
    const res = await fetch(`/api/user-profile?identifier=${encodeURIComponent(identifier)}&current=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();

    if (data.user) {
      const u = data.user;
      viewContactAvatar.src = u.avatarUrl || '/avatars/avatar-1.svg';
      viewContactName.textContent = u.displayName || u.username;
      viewContactBio.textContent = u.bio || 'مستخدم على ONYX CHAT';
      viewContactUsername.textContent = '@' + u.username;
      viewContactUserId.textContent = u.userId || '---';
      viewContactFollowers.textContent = u.followersCount || 0;

      viewContactStatusBadge.textContent = u.online ? 'متصل الآن' : 'غير متصل';
      viewContactStatusBadge.className = `status-badge ${u.online ? 'online' : ''}`;
      followContactBtn.textContent = u.isFollowing ? 'إلغاء المتابعة' : '+ متابعة';

      contactProfileModal.classList.add('active');
    }
  } catch (e) {}
};

closeContactProfileBtn.addEventListener('click', () => contactProfileModal.classList.remove('active'));

followContactBtn.addEventListener('click', async () => {
  if (!activeContactViewing) return;
  await toggleFollowUser(activeContactViewing);
  openContactProfile(activeContactViewing);
});

deleteFriendBtn.addEventListener('click', async () => {
  if (!activeContactViewing) return;
  if (!confirm(`حذف ${activeContactViewing} من أصدقائك؟`)) return;

  try {
    const res = await fetch('/api/contacts/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, targetUsername: activeContactViewing })
    });
    const d = await res.json();
    if (d.success) {
      contactProfileModal.classList.remove('active');
      loadContacts();
    }
  } catch (e) {}
});

// Add Friend Modal
directAddFriendBtn.addEventListener('click', () => {
  newContactInput.value = '';
  contactError.style.display = 'none';
  addContactModal.classList.add('active');
  newContactInput.focus();
});

cancelAddContactBtn.addEventListener('click', () => addContactModal.classList.remove('active'));

confirmAddContactBtn.addEventListener('click', async () => {
  const targetId = newContactInput.value.trim();
  if (!targetId) return;

  try {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, identifier: targetId })
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
  } catch (e) {
    contactError.textContent = 'حدث خطأ في البحث';
    contactError.style.display = 'block';
  }
});

// Chat Themes & Wallpaper
openChatThemeSettingsBtn.addEventListener('click', () => chatSettingsModal.classList.add('active'));
closeChatSettingsBtn.addEventListener('click', () => chatSettingsModal.classList.remove('active'));

function applyTheme(themeName) {
  document.body.dataset.theme = themeName;
  themeOptions.forEach(opt => {
    if (opt.dataset.themeVal === themeName) opt.classList.add('active');
    else opt.classList.remove('active');
  });
}

themeOptions.forEach(opt => {
  opt.addEventListener('click', async () => {
    const t = opt.dataset.themeVal;
    applyTheme(t);
    if (currentUser) {
      currentUser.theme = t;
      localStorage.setItem('onyx_insta_user', JSON.stringify(currentUser));
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, theme: t })
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
        localStorage.setItem('onyx_insta_user', JSON.stringify(currentUser));
        await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username, chatWallpaper: data.url })
        });
      }
      alert('تم تعيين خلفية المحادثة!');
    }
  } catch (e) {}
});

resetWallpaperBtn.addEventListener('click', async () => {
  messagesViewport.style.backgroundImage = '';
  if (currentUser) {
    currentUser.chatWallpaper = null;
    localStorage.setItem('onyx_insta_user', JSON.stringify(currentUser));
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
  if (!confirm(`حذف جميع رسائل المحادثة مع "${activeRecipient}"؟`)) return;

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
  } catch (e) {}
});

// Lightbox
window.openImageModal = function(url) {
  lightboxImg.src = url;
  lightbox.classList.add('active');
};
closeLightbox.addEventListener('click', () => lightbox.classList.remove('active'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });

// Start
init();
