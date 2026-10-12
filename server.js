const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 1e8 // 100MB
});

const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('audio/') ? '.webm' : '.jpg');
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Track online users: username.toLowerCase() -> Set of socket.ids
const onlineUsers = new Map();

// -------------------------------------------------------------------
// REST API
// -------------------------------------------------------------------

// Register new account with password
app.post('/api/register', (req, res) => {
  const { username, password, displayName, avatarUrl } = req.body;
  const result = db.registerUser({ username, password, displayName, avatarUrl });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true, user: result.user });
});

// Login with username and password
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const result = db.loginUser({ username, password });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true, user: result.user });
});

// Update Profile (Display Name, Avatar, Chat Wallpaper, Theme)
app.post('/api/profile/update', (req, res) => {
  const { username, displayName, avatarUrl, chatWallpaper, theme } = req.body;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  const result = db.updateUserProfile(username, { displayName, avatarUrl, chatWallpaper, theme });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true, user: result.user });
});

// Get user profile (for viewing someone's profile card)
app.get('/api/user-profile', (req, res) => {
  const { identifier } = req.query;
  if (!identifier) return res.status(400).json({ error: 'المعرف مطلوب' });

  const user = db.getUserByUsernameOrId(identifier);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

  const isOnline = onlineUsers.has(user.username.toLowerCase()) && onlineUsers.get(user.username.toLowerCase()).size > 0;
  return res.json({
    user: {
      ...user,
      online: isOnline
    }
  });
});

// Upload media (image, audio, wallpaper)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم إرسال أي ملف' });
  }
  const fileUrl = '/uploads/' + req.file.filename;
  return res.json({
    url: fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// Get contacts list
app.get('/api/contacts', (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  const contactUsernames = db.getContacts(username);
  const contacts = contactUsernames.map(cName => {
    const u = db.getUser(cName);
    const lastMsg = db.getLastMessage(username, cName);
    const isOnline = onlineUsers.has(cName.toLowerCase()) && onlineUsers.get(cName.toLowerCase()).size > 0;
    return {
      userId: u ? u.userId : '---',
      username: u ? u.username : cName,
      displayName: u ? (u.displayName || u.username) : cName,
      avatarUrl: u ? u.avatarUrl : '/avatars/avatar-1.svg',
      online: isOnline,
      lastMessage: lastMsg
    };
  });

  contacts.sort((a, b) => {
    const timeA = a.lastMessage ? a.lastMessage.timestamp : 0;
    const timeB = b.lastMessage ? b.lastMessage.timestamp : 0;
    return timeB - timeA;
  });

  return res.json({ contacts });
});

// Add contact by User ID or Username
app.post('/api/contacts', (req, res) => {
  const { username, identifier } = req.body;
  if (!username || !identifier) {
    return res.status(400).json({ error: 'البيانات غير مكتملة' });
  }

  // Find user by ID or Username
  const targetUser = db.getUserByUsernameOrId(identifier);
  if (!targetUser) {
    return res.status(404).json({ error: 'لم يتم العثور على مستخدم بهذا المعرف (User ID) أو الاسم' });
  }

  const result = db.addContact(username, targetUser.username);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  const isOnline = onlineUsers.has(targetUser.username.toLowerCase());
  return res.json({
    success: true,
    contact: {
      ...result.contact,
      online: isOnline,
      lastMessage: null
    }
  });
});

// Delete conversation
app.post('/api/conversation/delete', (req, res) => {
  const { user1, user2 } = req.body;
  if (!user1 || !user2) return res.status(400).json({ error: 'بيانات غير مكتملة' });

  db.deleteConversation(user1, user2);

  // Notify socket rooms
  const u1Key = user1.toLowerCase();
  const u2Key = user2.toLowerCase();
  if (u2Key === 'global') {
    io.to('room:global').emit('conversation_deleted', { recipient: 'global' });
  } else {
    io.to('user:' + u1Key).emit('conversation_deleted', { withUser: user2 });
    io.to('user:' + u2Key).emit('conversation_deleted', { withUser: user1 });
  }

  return res.json({ success: true });
});

// Get messages history
app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) {
    return res.status(400).json({ error: 'المستخدمان مطلوبان' });
  }

  const messages = db.getConversation(user1, user2);
  return res.json({ messages });
});

// -------------------------------------------------------------------
// Socket.io Realtime Logic
// -------------------------------------------------------------------
io.on('connection', (socket) => {
  let authenticatedUser = null;

  socket.on('user_join', (data) => {
    if (!data || !data.username) return;
    const username = data.username.trim();
    authenticatedUser = username;
    const key = username.toLowerCase();

    if (!onlineUsers.has(key)) {
      onlineUsers.set(key, new Set());
    }
    onlineUsers.get(key).add(socket.id);

    socket.join('user:' + key);
    socket.join('room:global');

    db.updateUserLastSeen(username);
    io.emit('user_status', { username, online: true });
  });

  socket.on('send_message', (msgData) => {
    if (!authenticatedUser || !msgData) return;

    const { recipient, type, content, mediaUrl, duration } = msgData;
    if (!recipient) return;

    const savedMsg = db.saveMessage({
      sender: authenticatedUser,
      recipient,
      type: type || 'text',
      content: content || '',
      mediaUrl: mediaUrl || null,
      duration: duration || null
    });

    const senderKey = authenticatedUser.toLowerCase();
    const recipientKey = recipient.toLowerCase();

    if (recipientKey === 'global') {
      io.to('room:global').emit('new_message', savedMsg);
    } else {
      io.to('user:' + recipientKey).emit('new_message', savedMsg);
      io.to('user:' + senderKey).emit('new_message', savedMsg);
    }
  });

  socket.on('typing', ({ recipient, isTyping }) => {
    if (!authenticatedUser || !recipient) return;
    const recipientKey = recipient.toLowerCase();
    if (recipientKey === 'global') {
      socket.to('room:global').emit('user_typing', { sender: authenticatedUser, recipient: 'global', isTyping });
    } else {
      io.to('user:' + recipientKey).emit('user_typing', { sender: authenticatedUser, isTyping });
    }
  });

  socket.on('disconnect', () => {
    if (authenticatedUser) {
      const key = authenticatedUser.toLowerCase();
      if (onlineUsers.has(key)) {
        onlineUsers.get(key).delete(socket.id);
        if (onlineUsers.get(key).size === 0) {
          onlineUsers.delete(key);
          io.emit('user_status', { username: authenticatedUser, online: false });
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
