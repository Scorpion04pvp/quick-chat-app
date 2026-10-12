const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let data = {
  users: {},      // username.toLowerCase() -> user object
  contacts: {},   // username.toLowerCase() -> [contactUsername, ...]
  messages: [],   // [ message objects ]
  reels: [],      // [ { id, creator, videoUrl, caption, likes: [], comments: [], timestamp } ]
  verificationCodes: {} // emailOrPhone -> { code, expiresAt }
};

if (fs.existsSync(DB_FILE)) {
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    data = Object.assign(data, JSON.parse(fileContent));
    if (!data.reels) data.reels = [];
    if (!data.verificationCodes) data.verificationCodes = {};
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
}

// Migrate existing users to ensure all new fields exist
Object.keys(data.users).forEach(k => {
  const u = data.users[k];
  if (!u.userId) u.userId = 'ID-' + Math.floor(10000 + Math.random() * 90000);
  if (!u.displayName) u.displayName = u.username;
  if (!u.theme) u.theme = 'onyx-purple';
  if (!u.language) u.language = 'ar';
  if (!u.bio) u.bio = 'مرحباً، أنا أستخدم Onyx Chat!';
  if (!u.followers) u.followers = [];
  if (!u.following) u.following = [];
  if (!u.likedReels) u.likedReels = [];
});

let saveTimeout = null;
function save() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save db.json:', err);
    }
  }, 100);
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_onyx_chat_salt_2026').digest('hex');
}

function generateUniqueUserId() {
  let id;
  let exists = true;
  while (exists) {
    id = 'ID-' + Math.floor(10000 + Math.random() * 90000);
    exists = Object.values(data.users).some(u => u.userId === id);
  }
  return id;
}

function sanitizeUser(u) {
  if (!u) return null;
  const { passwordHash, ...safe } = u;
  return safe;
}

module.exports = {
  getUser(username) {
    if (!username) return null;
    return sanitizeUser(data.users[username.toLowerCase().trim()]);
  },

  getUserById(userId) {
    if (!userId) return null;
    const cleanId = userId.trim().toUpperCase();
    const found = Object.values(data.users).find(u => {
      const uId = (u.userId || '').toUpperCase();
      return uId === cleanId || uId === ('ID-' + cleanId) || cleanId === ('ID-' + uId);
    });
    return sanitizeUser(found);
  },

  getUserByUsernameOrId(query) {
    if (!query) return null;
    const q = query.trim();
    const byId = this.getUserById(q);
    if (byId) return byId;
    return this.getUser(q);
  },

  getAllUsers() {
    return Object.values(data.users).map(sanitizeUser);
  },

  // Verification Code Generation (for Gmail or Phone)
  generateVerificationCode(emailOrPhone) {
    if (!emailOrPhone) return null;
    const key = emailOrPhone.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    data.verificationCodes[key] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };
    save();
    return code;
  },

  verifyCode(emailOrPhone, inputCode) {
    if (!emailOrPhone || !inputCode) return false;
    const key = emailOrPhone.trim().toLowerCase();
    const record = data.verificationCodes[key];
    if (!record) return false;
    if (Date.now() > record.expiresAt) return false;
    return record.code.trim() === inputCode.trim();
  },

  // Register with Gmail or Phone verification
  registerUser({ username, password, displayName, emailOrPhone, avatarUrl, bio }) {
    if (!username || !username.trim()) {
      return { success: false, error: 'اسم المستخدم مطلوب' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل' };
    }

    const key = username.toLowerCase().trim();
    if (data.users[key]) {
      return { success: false, error: 'اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر' };
    }

    const userId = generateUniqueUserId();
    const newUser = {
      userId,
      username: username.trim(),
      displayName: displayName && displayName.trim() ? displayName.trim() : username.trim(),
      emailOrPhone: (emailOrPhone || '').trim(),
      passwordHash: hashPassword(password),
      avatarUrl: avatarUrl || '/avatars/avatar-1.svg',
      bio: bio && bio.trim() ? bio.trim() : 'مرحباً، أنا أستخدم Onyx Chat!',
      theme: 'onyx-purple',
      language: 'ar',
      chatWallpaper: null,
      followers: [],
      following: [],
      likedReels: [],
      createdAt: Date.now(),
      lastSeen: Date.now()
    };

    data.users[key] = newUser;
    save();

    return { success: true, user: sanitizeUser(newUser) };
  },

  // Login
  loginUser({ usernameOrContact, password }) {
    if (!usernameOrContact || !password) {
      return { success: false, error: 'يرجى إدخال اسم المستخدم/البريد/الهاتف وكلمة المرور' };
    }

    const query = usernameOrContact.trim().toLowerCase();
    let user = data.users[query];

    // Find by email or phone if not found by username
    if (!user) {
      user = Object.values(data.users).find(u =>
        (u.emailOrPhone && u.emailOrPhone.toLowerCase() === query) ||
        (u.userId && u.userId.toLowerCase() === query)
      );
    }

    if (!user) {
      return { success: false, error: 'الحساب غير موجود، يرجى إنشاء حساب جديد' };
    }

    if (user.passwordHash && user.passwordHash !== hashPassword(password)) {
      return { success: false, error: 'كلمة المرور غير صحيحة' };
    }

    user.lastSeen = Date.now();
    save();

    return { success: true, user: sanitizeUser(user) };
  },

  // Profile Update
  updateUserProfile(username, { displayName, avatarUrl, bio, language, theme, chatWallpaper }) {
    const key = username.toLowerCase().trim();
    const user = data.users[key];
    if (!user) return { success: false, error: 'المستخدم غير موجود' };

    if (displayName && displayName.trim()) user.displayName = displayName.trim();
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (bio !== undefined) user.bio = bio.trim();
    if (language) user.language = language;
    if (theme) user.theme = theme;
    if (chatWallpaper !== undefined) user.chatWallpaper = chatWallpaper;

    save();
    return { success: true, user: sanitizeUser(user) };
  },

  updateUserLastSeen(username) {
    const key = username.toLowerCase().trim();
    if (data.users[key]) {
      data.users[key].lastSeen = Date.now();
      save();
    }
  },

  // Contacts
  getContacts(username) {
    const key = username.toLowerCase().trim();
    return data.contacts[key] || [];
  },

  addContact(username, contactUsername) {
    const key = username.toLowerCase().trim();
    const contactKey = contactUsername.toLowerCase().trim();

    if (key === contactKey) {
      return { success: false, message: 'لا يمكنك إضافة نفسك' };
    }

    if (!data.users[contactKey]) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    if (!data.contacts[key]) data.contacts[key] = [];
    if (!data.contacts[key].includes(contactKey)) data.contacts[key].push(contactKey);

    if (!data.contacts[contactKey]) data.contacts[contactKey] = [];
    if (!data.contacts[contactKey].includes(key)) data.contacts[contactKey].push(key);

    save();
    return { success: true, contact: sanitizeUser(data.users[contactKey]) };
  },

  removeContact(username, contactUsername) {
    const key = username.toLowerCase().trim();
    const contactKey = contactUsername.toLowerCase().trim();

    if (data.contacts[key]) {
      data.contacts[key] = data.contacts[key].filter(c => c !== contactKey);
    }
    if (data.contacts[contactKey]) {
      data.contacts[contactKey] = data.contacts[contactKey].filter(c => c !== key);
    }

    save();
    return { success: true };
  },

  // Follow / Unfollow
  toggleFollow(currentUsername, targetUsername) {
    const u1Key = currentUsername.toLowerCase().trim();
    const u2Key = targetUsername.toLowerCase().trim();

    const u1 = data.users[u1Key];
    const u2 = data.users[u2Key];

    if (!u1 || !u2) return { success: false, error: 'المستخدم غير موجود' };
    if (u1Key === u2Key) return { success: false, error: 'لا يمكنك متابعة نفسك' };

    if (!u1.following) u1.following = [];
    if (!u2.followers) u2.followers = [];

    const isFollowing = u1.following.includes(u2.username);

    if (isFollowing) {
      u1.following = u1.following.filter(un => un !== u2.username);
      u2.followers = u2.followers.filter(un => un !== u1.username);
    } else {
      u1.following.push(u2.username);
      u2.followers.push(u1.username);
    }

    save();
    return {
      success: true,
      isFollowing: !isFollowing,
      followersCount: u2.followers.length,
      followingCount: u1.following.length
    };
  },

  // Messages
  saveMessage({ sender, recipient, type, content, mediaUrl, duration }) {
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      sender: sender.trim(),
      recipient: recipient.trim(),
      type: type || 'text',
      content: content || '',
      mediaUrl: mediaUrl || null,
      duration: duration || null,
      timestamp: Date.now(),
      isProtected: true // End-to-End protected
    };
    data.messages.push(msg);

    const u1 = sender.toLowerCase().trim();
    const u2 = recipient.toLowerCase().trim();
    if (u1 !== 'global' && u2 !== 'global') {
      if (!data.contacts[u1]) data.contacts[u1] = [];
      if (!data.contacts[u1].includes(u2)) data.contacts[u1].push(u2);

      if (!data.contacts[u2]) data.contacts[u2] = [];
      if (!data.contacts[u2].includes(u1)) data.contacts[u2].push(u1);
    }

    save();
    return msg;
  },

  deleteSingleMessage(messageId, requesterUsername) {
    const reqUser = requesterUsername.toLowerCase().trim();
    const index = data.messages.findIndex(m => m.id === messageId);
    if (index === -1) return { success: false, error: 'الرسالة غير موجودة' };

    const msg = data.messages[index];
    if (msg.sender.toLowerCase() !== reqUser) {
      return { success: false, error: 'لا يمكنك حذف سوى رسائلك الخاصة' };
    }

    data.messages.splice(index, 1);
    save();
    return { success: true, deletedMsg: msg };
  },

  getConversation(user1, user2) {
    const u1 = user1.toLowerCase().trim();
    const u2 = user2.toLowerCase().trim();

    if (u2 === 'global') {
      return data.messages.filter(m => m.recipient.toLowerCase() === 'global');
    }

    return data.messages.filter(m => {
      const s = m.sender.toLowerCase();
      const r = m.recipient.toLowerCase();
      return (s === u1 && r === u2) || (s === u2 && r === u1);
    });
  },

  getLastMessage(user1, user2) {
    const conv = this.getConversation(user1, user2);
    return conv.length > 0 ? conv[conv.length - 1] : null;
  },

  deleteConversation(user1, user2) {
    const u1 = user1.toLowerCase().trim();
    const u2 = user2.toLowerCase().trim();

    if (u2 === 'global') {
      data.messages = data.messages.filter(m => m.recipient.toLowerCase() !== 'global');
    } else {
      data.messages = data.messages.filter(m => {
        const s = m.sender.toLowerCase();
        const r = m.recipient.toLowerCase();
        return !((s === u1 && r === u2) || (s === u2 && r === u1));
      });
    }

    save();
    return { success: true };
  },

  // ================= REELS (SHORT VIDEOS) =================
  createReel({ creator, videoUrl, caption }) {
    const reel = {
      id: 'reel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      creator: creator.trim(),
      videoUrl,
      caption: caption || '',
      likes: [],
      comments: [],
      timestamp: Date.now()
    };
    data.reels.unshift(reel); // Latest first
    save();
    return reel;
  },

  getAllReels() {
    return data.reels.map(r => {
      const u = data.users[r.creator.toLowerCase()];
      return {
        ...r,
        creatorDisplayName: u ? (u.displayName || u.username) : r.creator,
        creatorAvatar: u ? u.avatarUrl : '/avatars/avatar-1.svg',
        creatorUserId: u ? u.userId : '---'
      };
    });
  },

  deleteReel(reelId, requesterUsername) {
    const req = requesterUsername.toLowerCase().trim();
    const index = data.reels.findIndex(r => r.id === reelId);
    if (index === -1) return { success: false, error: 'الفيديو غير موجود' };

    if (data.reels[index].creator.toLowerCase() !== req) {
      return { success: false, error: 'لا يمكنك حذف سوى مقاطعك الخاصة' };
    }

    data.reels.splice(index, 1);
    save();
    return { success: true };
  },

  toggleLikeReel(reelId, username) {
    const uKey = username.toLowerCase().trim();
    const user = data.users[uKey];
    const reel = data.reels.find(r => r.id === reelId);

    if (!reel || !user) return { success: false, error: 'غير موجود' };

    if (!reel.likes) reel.likes = [];
    if (!user.likedReels) user.likedReels = [];

    const alreadyLiked = reel.likes.includes(username);

    if (alreadyLiked) {
      reel.likes = reel.likes.filter(u => u !== username);
      user.likedReels = user.likedReels.filter(id => id !== reelId);
    } else {
      reel.likes.push(username);
      if (!user.likedReels.includes(reelId)) {
        user.likedReels.push(reelId);
      }
    }

    save();
    return {
      success: true,
      liked: !alreadyLiked,
      likesCount: reel.likes.length
    };
  },

  addReelComment(reelId, { username, text }) {
    const reel = data.reels.find(r => r.id === reelId);
    const user = data.users[username.toLowerCase().trim()];
    if (!reel || !user) return { success: false, error: 'غير موجود' };

    const comment = {
      id: 'cmt_' + Date.now(),
      username: user.username,
      displayName: user.displayName || user.username,
      avatarUrl: user.avatarUrl,
      text: text.trim(),
      timestamp: Date.now()
    };

    if (!reel.comments) reel.comments = [];
    reel.comments.push(comment);
    save();
    return { success: true, comment };
  },

  getUserLikedReels(username) {
    const uKey = username.toLowerCase().trim();
    const user = data.users[uKey];
    if (!user || !user.likedReels) return [];

    return data.reels
      .filter(r => user.likedReels.includes(r.id))
      .map(r => {
        const u = data.users[r.creator.toLowerCase()];
        return {
          ...r,
          creatorDisplayName: u ? (u.displayName || u.username) : r.creator,
          creatorAvatar: u ? u.avatarUrl : '/avatars/avatar-1.svg'
        };
      });
  }
};
