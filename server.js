// server.js - Express + Socket.IO chat server with room codes
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET","POST"]
  }
});

// Serve static frontend (if you deploy backend and frontend together)
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store (for demo). For production use a DB.
const rooms = {}; // roomCode -> { members: {socketId: name}, history: [{name,text,time}] }

function makeRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i=0;i<6;i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code.toLowerCase();
}

io.on('connection', (socket) => {
  console.log('conn', socket.id);

  socket.on('createRoom', (data, cb) => {
    let code;
    do { code = makeRoomCode(); } while (rooms[code]);
    rooms[code] = { members: {}, history: [] };
    cb && cb({ ok: true, room: code });
  });

  socket.on('joinRoom', (data, cb) => {
    const { room, name } = data || {};
    if (!room || !name) return cb && cb({ ok: false, error: 'Missing room or name' });
    const code = room.toLowerCase();
    const r = rooms[code];
    if (!r) return cb && cb({ ok: false, error: 'Room not found' });
    r.members[socket.id] = name;
    socket.join(code);
    io.to(code).emit('members', { count: Object.keys(r.members).length });
    io.to(code).emit('message', { name: 'System', text: `${name} joined the room`, time: Date.now() });
    cb && cb({ ok: true });
  });

  socket.on('leaveRoom', (data) => {
    const { room, name } = data || {};
    if (!room) return;
    const code = room.toLowerCase();
    const r = rooms[code];
    if (!r) return;
    delete r.members[socket.id];
    socket.leave(code);
    io.to(code).emit('members', { count: Object.keys(r.members).length });
    io.to(code).emit('message', { name: 'System', text: `${name || 'Someone'} left the room`, time: Date.now() });
  });

  socket.on('message', (m, cb) => {
    const { room, name, text } = m || {};
    if (!room || !name || !text) return cb && cb({ ok: false });
    const code = room.toLowerCase();
    const r = rooms[code];
    if (!r) return cb && cb({ ok: false });
    const msg = { name, text, time: Date.now() };
    r.history.push(msg);
    // optional: limit history size
    if (r.history.length > 200) r.history.shift();
    io.to(code).emit('message', msg);
    cb && cb({ ok: true });
  });

  socket.on('getHistory', (data, cb) => {
    const { room } = data || {};
    const r = rooms[(room||'').toLowerCase()];
    if (!r) return cb && cb({ ok: false });
    cb && cb({ ok: true, history: r.history });
  });

  socket.on('disconnect', () => {
    // remove from any rooms
    for (const code of Object.keys(rooms)) {
      const r = rooms[code];
      if (r.members[socket.id]) {
        const name = r.members[socket.id];
        delete r.members[socket.id];
        io.to(code).emit('members', { count: Object.keys(r.members).length });
        io.to(code).emit('message', { name: 'System', text: `${name} disconnected`, time: Date.now() });
      }
      // optionally cleanup empty rooms
      if (Object.keys(r.members).length === 0) {
        // keep room around for a while or delete immediately
        delete rooms[code];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server listening on', PORT));
