const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial state
let data = {
  users: {},      // username -> { username, avatarUrl, createdAt, lastSeen }
  contacts: {},   // username -> [contactUsername, ...]
  messages: []    // [ { id, sender, recipient, type, content, mediaUrl, timestamp } ]
};

// Load existing data
if (fs.existsSync(DB_FILE)) {
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    data = Object.assign(data, JSON.parse(fileContent));
  } catch (err) {
    console.error('Error reading db.json, initializing fresh data:', err);
  }
}

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

module.exports = {
  getUser(username) {
    if (!username) return null;
    return data.users[username.toLowerCase().trim()] || null;
  },

  getAllUsers() {
    return Object.values(data.users);
  },

  saveUser(username, avatarUrl) {
    const key = username.toLowerCase().trim();
    if (!data.users[key]) {
      data.users[key] = {
        username: username.trim(),
        avatarUrl: avatarUrl || '/avatars/default.png',
        createdAt: Date.now(),
        lastSeen: Date.now()
      };
    } else {
      data.users[key].lastSeen = Date.now();
      if (avatarUrl) {
        data.users[key].avatarUrl = avatarUrl;
      }
    }
    save();
    return data.users[key];
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

    if (!data.contacts[key]) {
      data.contacts[key] = [];
    }

    if (!data.contacts[key].includes(contactKey)) {
      data.contacts[key].push(contactKey);
    }

    // Also auto-add reverse contact so both see each other
    if (!data.contacts[contactKey]) {
      data.contacts[contactKey] = [];
    }
    if (!data.contacts[contactKey].includes(key)) {
      data.contacts[contactKey].push(key);
    }

    save();
    return { success: true, contact: data.users[contactKey] };
  },

  saveMessage({ sender, recipient, type, content, mediaUrl, duration }) {
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      sender: sender.trim(),
      recipient: recipient.trim(),
      type: type || 'text', // 'text' | 'image' | 'audio'
      content: content || '',
      mediaUrl: mediaUrl || null,
      duration: duration || null,
      timestamp: Date.now()
    };
    data.messages.push(msg);

    // Automatically ensure they are in each other's contacts
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
  }
};
