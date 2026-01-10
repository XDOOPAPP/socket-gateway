const jwt = require('jsonwebtoken');
const env = require('../config/env');

class SocketHandler {
  constructor() {
    this.io = null;
  }

  init(io) {
    this.io = io;

    io.on('connection', (socket) => {
      try {
        // 1️⃣ Lấy token từ frontend
        const token = socket.handshake.auth?.token;
        if (!token) {
          throw new Error('Missing auth token');
        }

        // 2️⃣ Verify JWT
        const decoded = jwt.verify(token, env.jwtSecret);
        const { userId, role } = decoded;

        if (!userId) {
          throw new Error('Invalid token payload');
        }

        socket.user = { userId, role };

        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined room user:${userId}`);

        if (role === 'admin') {
          socket.join('admins');
          console.log(`🛡️ Admin joined room admins`);
        }

        console.log('✅ Socket connected:', socket.id);

        socket.on('disconnect', () => {
          console.log(`❌ Socket disconnected: ${socket.id} (user ${userId})`);
        });

      } catch (err) {
        console.error('❌ Socket authentication failed:', err.message);
        socket.disconnect(true);
      }
    });
  }

  // ===== Emit methods =====

  emitToUser(userId, payload) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('notification:new', payload);
  }

  emitToAdmins(payload) {
    if (!this.io) return;
    this.io.to('admins').emit('notification:new', payload);
  }

  emitToAll(payload) {
    if (!this.io) return;
    this.io.emit('notification:new', payload);
  }
}

module.exports = new SocketHandler();
