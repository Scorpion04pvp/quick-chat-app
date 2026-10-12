const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
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
  limits: { fileSize: 100 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Online users tracking
const onlineUsers = new Map();

// Helper: Send Real Email via Gmail SMTP
async function sendRealVerificationEmail(toEmail, code) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.log(`[SMTP Notice] SMTP_USER/SMTP_PASS not set in environment. Code for ${toEmail}: ${code}`);
    return { sent: false, note: 'SMTP_USER_NOT_SET' };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass }
    });

    await transporter.sendMail({
      from: `"ONYX CHAT" <${smtpUser}>`,
      to: toEmail,
      subject: `ONYX CHAT - رمز التحقق الخاص بك: ${code}`,
      html: `
        <div style="font-family: Cairo, Arial, sans-serif; direction: rtl; text-align: right; background: #090511; color: white; padding: 30px; border-radius: 16px; border: 1px solid #a855f7;">
          <h2 style="color: #a855f7; margin-bottom: 8px;">مرحباً بك في ONYX CHAT 🔮</h2>
          <p style="color: #cbd5e1; font-size: 16px;">شكراً لانضمامك. رمز التحقق لتأكيد حسابك هو:</p>
          <div style="background: #190e32; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px dashed #a855f7;">
            <span style="color: #38bdf8; letter-spacing: 8px; font-size: 36px; font-weight: bold; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">صلاحية هذا الرمز هي 15 دقيقة. يرجى عدم مشاركته مع أي شخص.</p>
        </div>
      `
    });
    return { sent: true };
  } catch (err) {
    console.error('Nodemailer Error:', err.message);
    return { sent: false, error: err.message };
  }
}

// -------------------------------------------------------------
// AUTHENTICATION API
// -------------------------------------------------------------

// Step 1: Send Verification Code
app.post('/api/auth/send-code', async (req, res) => {
  const { emailOrPhone } = req.body;
  if (!emailOrPhone || !emailOrPhone.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف' });
  }

  const code = db.generateVerificationCode(emailOrPhone);
  const isEmail = emailOrPhone.includes('@');
  let realEmailResult = { sent: false };

  if (isEmail) {
    realEmailResult = await sendRealVerificationEmail(emailOrPhone, code);
  }

  return res.json({
    success: true,
    code, // Returned to client so user can also use in-app toast preview without failure
    emailSent: realEmailResult.sent,
    message: realEmailResult.sent
      ? `تم إرسال كود التحقق الفعلي إلى بريدك الإلكتروني (${emailOrPhone})`
      : `تم إنشاء كود التحقق لحسابك: ${code}`
  });
});

// Step 2: Verify Code and Register
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

  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json({ success: true, user: result.user });
});

// Google One-Click Auth
app.post('/api/auth/google', (req, res) => {
  const { email, name, avatarUrl } = req.body;
  if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });

  const result = db.googleLogin({ email, name, avatarUrl });
  if (!result.success) return res.status(400).json({ error: result.error });

  return res.json({ success: true, user: result.user });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { usernameOrContact, password } = req.body;
  const result = db.loginUser({ usernameOrContact, password });
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json({ success: true, user: result.user });
});

// Update Profile
app.post('/api/profile/update', (req, res) => {
  const { username, displayName, avatarUrl, bio, language, theme, chatWallpaper } = req.body;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  const result = db.updateUserProfile(username, { displayName, avatarUrl, bio, language, theme, chatWallpaper });
  if (!result.success) return res.status(400).json({ error: result.error });
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

  const allPosts = db.getAllPosts().filter(p => p.creator.toLowerCase() === user.username.toLowerCase());
  const allReels = db.getAllReels().filter(r => r.creator.toLowerCase() === user.username.toLowerCase());

  return res.json({
    user: {
      ...user,
      online: isOnline,
      isFollowing,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      postsCount: allPosts.length,
      reelsCount: allReels.length
    }
  });
});

// Follow / Unfollow
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
// INSTAGRAM FEED & STORIES API
// -------------------------------------------------------------

app.get('/api/posts', (req, res) => {
  const posts = db.getAllPosts();
  return res.json({ posts });
});

app.post('/api/posts', (req, res) => {
  const { creator, mediaUrl, type, caption } = req.body;
  if (!creator || !mediaUrl) return res.status(400).json({ error: 'بيانات المنشور غير مكتملة' });

  const post = db.createPost({ creator, mediaUrl, type, caption });
  const all = db.getAllPosts();
  const created = all.find(p => p.id === post.id);

  io.emit('new_post', created);
  return res.json({ success: true, post: created });
});

app.post('/api/posts/:id/like', (req, res) => {
  const { username } = req.body;
  const result = db.toggleLikePost(req.params.id, username);
  if (result.success) {
    io.emit('post_liked', { postId: req.params.id, likesCount: result.likesCount });
  }
  return res.json(result);
});

app.post('/api/posts/:id/comment', (req, res) => {
  const { username, text } = req.body;
  const result = db.addPostComment(req.params.id, { username, text });
  if (result.success) {
    io.emit('post_new_comment', { postId: req.params.id, comment: result.comment });
  }
  return res.json(result);
});

app.get('/api/stories', (req, res) => {
  const stories = db.getActiveStories();
  return res.json({ stories });
});

app.post('/api/stories', (req, res) => {
  const { creator, mediaUrl } = req.body;
  if (!creator || !mediaUrl) return res.status(400).json({ error: 'البيانات غير مكتملة' });

  const story = db.createStory({ creator, mediaUrl });
  io.emit('new_story', story);
  return res.json({ success: true, story });
});

// -------------------------------------------------------------
// REELS API
// -------------------------------------------------------------

app.get('/api/reels', (req, res) => {
  const reels = db.getAllReels();
  return res.json({ reels });
});

app.post('/api/reels', (req, res) => {
  const { creator, videoUrl, caption } = req.body;
  if (!creator || !videoUrl) return res.status(400).json({ error: 'بيانات غير مكتملة' });

  const reel = db.createReel({ creator, videoUrl, caption });
  const all = db.getAllReels();
  const created = all.find(r => r.id === reel.id);

  io.emit('new_reel', created);
  return res.json({ success: true, reel: created });
});

app.delete('/api/reels/:id', (req, res) => {
  const { username } = req.query;
  const result = db.deleteReel(req.params.id, username);
  if (!result.success) return res.status(400).json({ error: result.error });

  io.emit('reel_deleted', { reelId: req.params.id });
  return res.json({ success: true });
});

app.post('/api/reels/:id/like', (req, res) => {
  const { username } = req.body;
  const result = db.toggleLikeReel(req.params.id, username);
  if (result.success) {
    io.emit('reel_liked', { reelId: req.params.id, likesCount: result.likesCount });
  }
  return res.json(result);
});

app.post('/api/reels/:id/comment', (req, res) => {
  const { username, text } = req.body;
  const result = db.addReelComment(req.params.id, { username, text });
  if (result.success) {
    io.emit('reel_new_comment', { reelId: req.params.id, comment: result.comment });
  }
  return res.json(result);
});

app.get('/api/reels/liked', (req, res) => {
  const { username } = req.query;
  const liked = db.getUserLikedReels(username);
  return res.json({ reels: liked });
});

// -------------------------------------------------------------
// MESSAGES & CONTACTS API
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
  if (!targetUser) return res.status(404).json({ error: 'لم يتم العثور على مستخدم بهذا المعرف أو الاسم' });

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
  db.removeContact(username, targetUsername);
  return res.json({ success: true });
});

app.post('/api/messages/delete-one', (req, res) => {
  const { messageId, username } = req.body;
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

app.post('/api/conversation/delete', (req, res) => {
  const { user1, user2 } = req.body;
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

app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  const messages = db.getConversation(user1, user2);
  return res.json({ messages });
});

// -------------------------------------------------------------
// REALTIME SOCKET.IO
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

  // Call Signaling
  socket.on('call_start', ({ recipient, isVideo, callerData }) => {
    if (!authenticatedUser || !recipient) return;
    io.to('user:' + recipient.toLowerCase()).emit('incoming_call', {
      caller: authenticatedUser,
      callerData,
      isVideo
    });
  });

  socket.on('call_answer', ({ caller, accepted }) => {
    if (!authenticatedUser || !caller) return;
    io.to('user:' + caller.toLowerCase()).emit('call_response', {
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
