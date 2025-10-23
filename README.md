# Socket Room Chat (Socket.IO + Node)

This project is a simple real-time chat application using **Socket.IO** and **Node.js**.
Users can create a room with a 6-character code, share the code or invite via WhatsApp, and chat in real time.

## Files
- `server.js` — Node + Express + Socket.IO server (serves `public/` if present)
- `public/index.html`, `public/style.css`, `public/client.js` — frontend files (in root for the ZIP)
- `package.json` — Node dependencies
- `README.md` — this file

## Run locally
1. Install Node.js (v16+ recommended).
2. Extract the project and run:
```bash
npm install
npm start
```
3. Open `http://localhost:3000` in your browser.

## Deploying (recommended hosts)

### Render (simple)
1. Create a new Web Service on Render and connect your GitHub repo.
2. Build command: `npm install`
3. Start command: `npm start`
4. Deploy. Render will provide a URL like `https://your-app.onrender.com`.
5. Open the URL — the frontend is served by the same server and the Socket.IO client will connect automatically.

### Railway
1. Create a new project → Deploy from GitHub or use quick deploy.
2. Set the Start command: `npm start`.
3. Railway assigns a domain; open it and test.

### Glitch (quick demo)
1. Create a new project and paste `server.js` and `package.json`.
2. Glitch runs automatically; copy the live URL.

## Notes & Next steps
- This demo uses an **in-memory store** for rooms and history. For production, use Redis/MongoDB/Postgres to persist rooms and scale across instances.
- Add authentication to prevent impersonation.
- Rate-limit messages and sanitize inputs to avoid abuse.

If you want, I can:
- Add a Dockerfile
- Add Redis-backed room storage and session affinity
- Add user avatars and message reactions
