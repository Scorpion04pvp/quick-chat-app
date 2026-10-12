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
  maxHttpBufferSize: 1e8 // 100MB for video reels and audio
});

const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage for images, audio, and video reels
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (!ext) {
      if (file.mimetype.startsWith('audio/')) ext = '.webm';
      else if (file.mimetype.startsWith('video/')) ext = '.mp4';
      else ext = '.jpg';
    }
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max for video reels
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Online users tracking: username.toLowerCase() -> Set(socket.id)
const onlineUsers = new Map();

// -------------------------------------------------------------
// AUTHENTICATION & VERIFICATION API
// -------------------------------------------------------------

// Step 1: Send verification code to Gmail or Phone
app.post('/api/auth/send-code', (req, res) => {
  const { emailOrPhone } = req.body;
  if (!emailOrPhone || !emailOrPhone.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف' });
  }

  const code = db.generateVerificationCode(emailOrPhone);
  // Realistic instant delivery simulation:
  const isEmail = emailOrPhone.includes('@');
  const simulatedMsg = isEmail
    ? `تم إرسال كود التحقق إلى بريدك الإلكتروني (${emailOrPhone}): ${code}`
    : `تم إرسال كود التحقق في رسالة نصية SMS إلى رقمك (${emailOrPhone}): ${code}`;

  return res.json({
    success: true,
    code, // Return code so frontend can display realistic alert / auto-fill helper
    message: simulatedMsg
  });
});

// Step 2: Verify code and Register
app.post('/api/auth/verify-and-register', (req, res) => {
  const { emailOrPhone, code, username, password, displayName, avatarUrl, bio } = req.body;

  if (!emailOrPhone || !code) {
    return res.status(400).json({ error: 'رمز التحقق مطلوب' });
  }

  const isValid = db.verifyCode(emailOrPhone, code);
  if (!isValid) {
    return res.status(400).json({ error: 'رمز التحقق غير صحيح أو انتهت صلاحيته' });
  }

  const result = db.registerUser({
    username,
    password,
    displayName,
    emailOrPhone,
    avatarUrl,
    bio
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ success: true, user: result.user });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { usernameOrContact, password } = req.body;
  const result = db.loginUser({ usernameOrContact, password });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true, user: result.user });
});

// Update Profile
app.post('/api/profile/update', (req, res) => {
  const { username, displayName, avatarUrl, bio, language, theme, chatWallpaper } = req.body;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  const result = db.updateUserProfile(username, { displayName, avatarUrl, bio, language, theme, chatWallpaper });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true, user: result.user });
});

// Get User Profile
app.get('/api/user-profile', (req, res) => {
  const { identifier, current } = req.query;
  if (!identifier) return res.status(400).json({ error: 'المعرف مطلوب' });

  const user = db.getUserByUsernameOrId(identifier);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

  const isOnline = onlineUsers.has(user.username.toLowerCase()) && onlineUsers.get(user.username.toLowerCase()).size > 0;
  const isFollowing = current && user.followers ? user.followers.includes(current) : false;

  return res.json({
    user: {
      ...user,
      online: isOnline,
      isFollowing,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0
    }
  });
});

// Follow / Unfollow User
app.post('/api/follow/toggle', (req, res) => {
  const { currentUsername, targetUsername } = req.body;
  if (!currentUsername || !targetUsername) return res.status(400).json({ error: 'بيانات غير مكتملة' });

  const result = db.toggleFollow(currentUsername, targetUsername);
  return res.json(result);
});

// Upload media
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرسال أي ملف' });
  const fileUrl = '/uploads/' + req.file.filename;
  return res.json({
    url: fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// -------------------------------------------------------------
// CONTACTS & MESSAGES API
// -------------------------------------------------------------

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
      bio: u ? u.bio : '',
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

app.post('/api/contacts', (req, res) => {
  const { username, identifier } = req.body;
  if (!username || !identifier) return res.status(400).json({ error: 'البيانات غير مكتملة' });

  const targetUser = db.getUserByUsernameOrId(identifier);
  if (!targetUser) {
    return res.status(404).json({ error: 'لم يتم العثور على مستخدم بهذا المعرف (User ID) أو الاسم' });
  }

  const result = db.addContact(username, targetUser.username);
  if (!result.success) return res.status(400).json({ error: result.message });

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

app.post('/api/contacts/remove', (req, res) => {
  const { username, targetUsername } = req.body;
  if (!username || !targetUsername) return res.status(400).json({ error: 'البيانات غير مكتملة' });

  db.removeContact(username, targetUsername);
  return res.json({ success: true });
});

// Delete Single Message
app.post('/api/messages/delete-one', (req, res) => {
  const { messageId, username } = req.body;
  if (!messageId || !username) return res.status(400).json({ error: 'البيانات غير مكتملة' });

  const result = db.deleteSingleMessage(messageId, username);
  if (!result.success) return res.status(400).json({ error: result.error });

  const msg = result.deletedMsg;
  const sKey = msg.sender.toLowerCase();
  const rKey = msg.recipient.toLowerCase();

  if (rKey === 'global') {
    io.to('room:global').emit('message_deleted', { messageId });
  } else {
    io.to('user:' + sKey).emit('message_deleted', { messageId });
    io.to('user:' + rKey).emit('message_deleted', { messageId });
  }

  return res.json({ success: true });
});

// Delete entire conversation
app.post('/api/conversation/delete', (req, res) => {
  const { user1, user2 } = req.body;
  if (!user1 || !user2) return res.status(400).json({ error: 'بيانات غير مكتملة' });

  db.deleteConversation(user1, user2);

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
  if (!user1 || !user2) return res.status(400).json({ error: 'المستخدمان مطلوبان' });

  const messages = db.getConversation(user1, user2);
  return res.json({ messages });
});

// -------------------------------------------------------------
// REELS (SHORT VIDEOS) API
// -------------------------------------------------------------

app.get('/api/reels', (req, res) => {
  const reels = db.getAllReels();
  return res.json({ reels });
});

app.post('/api/reels', (req, res) => {
  const { creator, videoUrl, caption } = req.body;
  if (!creator || !videoUrl) return res.status(400).json({ error: 'بيانات الفيديو غير مكتملة' });

  const reel = db.createReel({ creator, videoUrl, caption });
  const allReels = db.getAllReels();
  const created = allReels.find(r => r.id === reel.id);

  // Real-time broadcast new reel to everyone
  io.emit('new_reel', created);

  return res.json({ success: true, reel: created });
});

app.delete('/api/reels/:id', (req, res) => {
  const { username } = req.query;
  const reelId = req.params.id;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  const result = db.deleteReel(reelId, username);
  if (!result.success) return res.status(400).json({ error: result.error });

  io.emit('reel_deleted', { reelId });
  return res.json({ success: true });
});

app.post('/api/reels/:id/like', (req, res) => {
  const { username } = req.body;
  const reelId = req.params.id;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  const result = db.toggleLikeReel(reelId, username);
  if (result.success) {
    io.emit('reel_liked', { reelId, likesCount: result.likesCount });
  }
  return res.json(result);
});

app.post('/api/reels/:id/comment', (req, res) => {
  const { username, text } = req.body;
  const reelId = req.params.id;
  if (!username || !text) return res.status(400).json({ error: 'نص التعليق مطلوب' });

  const result = db.addReelComment(reelId, { username, text });
  if (result.success) {
    io.emit('reel_new_comment', { reelId, comment: result.comment });
  }
  return res.json(result);
});

app.get('/api/reels/liked', (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  const liked = db.getUserLikedReels(username);
  return res.json({ reels: liked });
});

// -------------------------------------------------------------
// SOCKET.IO REALTIME EVENTS (CALLS, MESSAGES, REELS)
// -------------------------------------------------------------

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

  // Call Signaling (Audio & Video Calls)
  socket.on('call_start', ({ recipient, isVideo, callerData }) => {
    if (!authenticatedUser || !recipient) return;
    const rKey = recipient.toLowerCase();
    io.to('user:' + rKey).emit('incoming_call', {
      caller: authenticatedUser,
      callerData,
      isVideo
    });
  });

  socket.on('call_answer', ({ caller, accepted }) => {
    if (!authenticatedUser || !caller) return;
    const cKey = caller.toLowerCase();
    io.to('user:' + cKey).emit('call_response', {
      from: authenticatedUser,
      accepted
    });
  });

  socket.on('call_end', ({ targetUser }) => {
    if (!targetUser) return;
    io.to('user:' + targetUser.toLowerCase()).emit('call_ended');
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
  console.log(`ONYX CHAT Server running at http://localhost:${PORT}`);
});
