// client.js - connects to Socket.IO server and handles UI
// By default it connects to the same origin that serves this page.
// If your backend is hosted elsewhere, set BACKEND_URL to that origin, e.g. "https://my-backend.onrender.com"
const BACKEND_URL = window.location.origin; // change if needed

const socket = io(BACKEND_URL);

const el = id => document.getElementById(id);
const joinSection = el('joinSection');
const chatSection = el('chatSection');
const messagesDiv = el('messages');
const roomCodeDisplay = el('roomCodeDisplay');
const roomInput = el('roomInput');
const createBtn = el('createBtn');
const joinBtn = el('joinBtn');
const usernameInput = el('username');
const messageForm = el('messageForm');
const messageInput = el('messageInput');
const inviteBtn = el('inviteBtn');
const leaveBtn = el('leaveBtn');
const membersCount = el('membersCount');
const roomInfo = el('roomInfo');

let currentRoom = null;
let myName = null;

function showJoin(){ joinSection.classList.remove('hidden'); chatSection.classList.add('hidden'); roomInfo.textContent=''; messagesDiv.innerHTML=''; }
function showChat(){ joinSection.classList.add('hidden'); chatSection.classList.remove('hidden'); }

createBtn.addEventListener('click', () => {
  const name = (usernameInput.value||'').trim();
  if (!name) return alert('Enter your name first');
  myName = name;
  socket.emit('createRoom', {}, (res) => {
    if (res.ok) {
      joinRoom(res.room, name);
    } else {
      alert('Could not create room');
    }
  });
});

joinBtn.addEventListener('click', () => {
  const code = (roomInput.value||'').trim();
  const name = (usernameInput.value||'').trim();
  if (!name) return alert('Enter your name first');
  if (!code) return alert('Enter room code');
  myName = name;
  socket.emit('joinRoom', { room: code, name }, (res) => {
    if (res.ok) {
      joinRoom(code, name);
    } else {
      alert(res.error || 'Could not join room');
    }
  });
});

function joinRoom(code, name) {
  currentRoom = code;
  roomCodeDisplay.textContent = 'Room: ' + code.toUpperCase();
  roomInfo.textContent = 'Joined as: ' + name;
  showChat();
  messagesDiv.innerHTML = '';
  socket.emit('getHistory', { room: code }, (res) => {
    if (res.ok && res.history) {
      res.history.forEach(appendMessage);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  });
}

leaveBtn.addEventListener('click', () => {
  if (!currentRoom) return;
  socket.emit('leaveRoom', { room: currentRoom, name: myName });
  currentRoom = null;
  myName = null;
  showJoin();
});

socket.on('message', (m) => {
  appendMessage(m);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('members', (data) => {
  if (data && typeof data.count === 'number') {
    membersCount.textContent = ' • ' + data.count + ' member(s)';
  }
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = (messageInput.value||'').trim();
  if (!text || !currentRoom) return;
  const m = { room: currentRoom, name: myName, text };
  socket.emit('message', m, (ack) => {
    if (ack && ack.ok) {
      messageInput.value = '';
    } else {
      alert('Message failed to send');
    }
  });
});

inviteBtn.addEventListener('click', () => {
  if (!currentRoom) return alert('Join or create a room first');
  const room = currentRoom.toUpperCase();
  const site = BACKEND_URL; // backend or page URL
  const text = encodeURIComponent(`Join my chat room: ${room}\nOpen this link: ${site} and enter the code`);
  const waUrl = `https://wa.me/?text=${text}`;
  window.open(waUrl, '_blank');
});

function appendMessage(m){
  const wrap = document.createElement('div');
  wrap.className = 'message' + (m.name === myName ? ' you' : '');
  const who = document.createElement('div'); who.className='meta'; who.textContent = (m.name||'Unknown') + ' • ' + (new Date(m.time || Date.now())).toLocaleTimeString();
  const text = document.createElement('div'); text.className='text'; text.textContent = m.text;
  wrap.appendChild(who); wrap.appendChild(text);
  messagesDiv.appendChild(wrap);
}

// helper: allow pressing Enter to send when focused in messageInput
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    messageForm.requestSubmit();
  }
});
