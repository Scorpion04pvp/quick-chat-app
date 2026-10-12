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
  maxHttpBufferSize: 1e8 // 100MB for media
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
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Track online users: username.toLowerCase() -> Set of socket.ids
const onlineUsers = new Map();

// REST API
app.post('/api/login', (req, res) => {
  const { username, avatarUrl } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
  }

  const cleanUser = username.trim();
  const user = db.saveUser(cleanUser, avatarUrl);
  return res.json({ success: true, user });
});

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

app.get('/api/contacts', (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  const contactUsernames = db.getContacts(username);
  const contacts = contactUsernames.map(cName => {
    const u = db.getUser(cName);
    const lastMsg = db.getLastMessage(username, cName);
    const isOnline = onlineUsers.has(cName.toLowerCase()) && onlineUsers.get(cName.toLowerCase()).size > 0;
    return {
      username: u ? u.username : cName,
      avatarUrl: u ? u.avatarUrl : '/avatars/avatar-1.svg',
      online: isOnline,
      lastMessage: lastMsg
    };
  });

  // Sort contacts by latest message timestamp
  contacts.sort((a, b) => {
    const timeA = a.lastMessage ? a.lastMessage.timestamp : 0;
    const timeB = b.lastMessage ? b.lastMessage.timestamp : 0;
    return timeB - timeA;
  });

  return res.json({ contacts });
});

app.post('/api/contacts', (req, res) => {
  const { username, contactUsername } = req.body;
  if (!username || !contactUsername) {
    return res.status(400).json({ error: 'البيانات غير مكتملة' });
  }

  const result = db.addContact(username, contactUsername);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  const isOnline = onlineUsers.has(contactUsername.toLowerCase().trim());
  return res.json({
    success: true,
    contact: {
      ...result.contact,
      online: isOnline,
      lastMessage: null
    }
  });
});

app.get('/api/users/search', (req, res) => {
  const { query, current } = req.query;
  if (!query) return res.json({ users: [] });

  const q = query.toLowerCase().trim();
  const curr = (current || '').toLowerCase().trim();

  const all = db.getAllUsers();
  const matched = all.filter(u => {
    const un = u.username.toLowerCase();
    return un !== curr && un.includes(q);
  }).map(u => ({
    username: u.username,
    avatarUrl: u.avatarUrl,
    online: onlineUsers.has(u.username.toLowerCase())
  }));

  return res.json({ users: matched });
});

app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) {
    return res.status(400).json({ error: 'المستخدمان مطلوبان' });
  }

  const messages = db.getConversation(user1, user2);
  return res.json({ messages });
});

// Socket.io Realtime Logic
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

    // Join room with own username for direct messages
    socket.join('user:' + key);
    // Join global public room
    socket.join('room:global');

    db.updateUserLastSeen(username);

    // Broadcast online status
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
      // Send to recipient
      io.to('user:' + recipientKey).emit('new_message', savedMsg);
      // Send back to sender's devices
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
