const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let data = {
  users: {},      // username.toLowerCase() -> user object
  contacts: {},   // username.toLowerCase() -> [contactUsername, ...]
  messages: []    // [ message objects ]
};

// Load existing data
if (fs.existsSync(DB_FILE)) {
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    data = Object.assign(data, JSON.parse(fileContent));
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
}

// Ensure every existing user has a userId, displayName, theme
Object.keys(data.users).forEach(k => {
  const u = data.users[k];
  if (!u.userId) {
    u.userId = 'ID-' + Math.floor(10000 + Math.random() * 90000);
  }
  if (!u.displayName) {
    u.displayName = u.username;
  }
  if (!u.theme) {
    u.theme = 'midnight';
  }
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
  return crypto.createHash('sha256').update(password + '_secret_salt_chat_app_2026').digest('hex');
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
    // Try user ID first
    const byId = this.getUserById(q);
    if (byId) return byId;
    // Try username
    return this.getUser(q);
  },

  getAllUsers() {
    return Object.values(data.users).map(sanitizeUser);
  },

  registerUser({ username, password, displayName, avatarUrl }) {
    if (!username || !username.trim()) {
      return { success: false, error: 'اسم المستخدم مطلوب' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'كلمة المرور يجب أن تتكون من 4 أحرف أو أرقام على الأقل' };
    }

    const key = username.toLowerCase().trim();
    if (data.users[key]) {
      return { success: false, error: 'اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر أو تسجيل الدخول' };
    }

    const userId = generateUniqueUserId();
    const newUser = {
      userId,
      username: username.trim(),
      displayName: displayName && displayName.trim() ? displayName.trim() : username.trim(),
      passwordHash: hashPassword(password),
      avatarUrl: avatarUrl || '/avatars/avatar-1.svg',
      chatWallpaper: null,
      theme: 'midnight',
      createdAt: Date.now(),
      lastSeen: Date.now()
    };

    data.users[key] = newUser;
    save();

    return { success: true, user: sanitizeUser(newUser) };
  },

  loginUser({ username, password }) {
    if (!username || !password) {
      return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }

    const key = username.toLowerCase().trim();
    const user = data.users[key];

    if (!user) {
      return { success: false, error: 'اسم المستخدم غير موجود، يرجى إنشاء حساب جديد' };
    }

    // Check password
    if (user.passwordHash && user.passwordHash !== hashPassword(password)) {
      return { success: false, error: 'كلمة المرور غير صحيحة' };
    }

    user.lastSeen = Date.now();
    save();

    return { success: true, user: sanitizeUser(user) };
  },

  updateUserProfile(username, { displayName, avatarUrl, chatWallpaper, theme }) {
    const key = username.toLowerCase().trim();
    const user = data.users[key];
    if (!user) return { success: false, error: 'المستخدم غير موجود' };

    if (displayName && displayName.trim()) user.displayName = displayName.trim();
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (chatWallpaper !== undefined) user.chatWallpaper = chatWallpaper;
    if (theme) user.theme = theme;

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

  getContacts(username) {
    const key = username.toLowerCase().trim();
    return data.contacts[key] || [];
  },

  addContact(username, contactUsername) {
    const key = username.toLowerCase().trim();
    const contactKey = contactUsername.toLowerCase().trim();

    if (key === contactKey) {
      return { success: false, message: 'لا يمكنك إضافة نفسك كجهة اتصال' };
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

  saveMessage({ sender, recipient, type, content, mediaUrl, duration }) {
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      sender: sender.trim(),
      recipient: recipient.trim(),
      type: type || 'text',
      content: content || '',
      mediaUrl: mediaUrl || null,
      duration: duration || null,
      timestamp: Date.now()
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
  }
};
