import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import player from "./player.js";

player.setMaxListeners(20);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.WEB_PORT || 3000;

const getState = (guildId?: string) => {
  const queue = guildId
    ? player.queues.get(guildId)
    : player.queues.collection.first();

  if (!queue) {
    return { playing: false, song: null, queue: [], volume: 70 };
  }

  return {
    playing: queue.playing,
    volume: queue.volume,
    song: queue.songs[0]
      ? {
          name: queue.songs[0].name || queue.songs[0].url,
          duration: `${queue.formattedCurrentTime} / ${queue.songs[0].formattedDuration || "--:--"}`,
          thumbnail: (() => {
            if (queue.songs[0].thumbnail) return queue.songs[0].thumbnail;
            const match = (queue.songs[0].url || "").match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
          })(),
          url: queue.songs[0].url,
        }
      : null,
    queue: queue.songs.slice(1).map((s) => ({
      name: s.name || s.url || "",
      duration: s.formattedDuration || "--:--",
    })),
  };
};

player.on("playSong", () => io.emit("state", getState()));
player.on("addSong", () => io.emit("state", getState()));
player.on("finishSong", () => io.emit("state", getState()));
player.on("disconnect", () => io.emit("state", getState()));

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apollonia Bot</title>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f0f13;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
    }
    h1 { font-size: 2rem; margin-bottom: 2rem; color: #1db954; }
    .card {
      background: #1a1a2e;
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 600px;
      margin-bottom: 1.5rem;
    }
    .card h2 { font-size: 1rem; color: #888; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px; }
    .now-playing { display: flex; align-items: center; gap: 1rem; }
    .thumbnail { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; background: #333; display: none; }
    .song-info { flex: 1; }
    .song-title { font-size: 1.1rem; font-weight: bold; margin-bottom: 0.3rem; }
    .song-duration { font-size: 0.85rem; color: #888; }
    .controls { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; flex-wrap: wrap; }
    button {
      background: #1db954;
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 0.6rem 1.4rem;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #17a349; }
    button.danger { background: #e74c3c; }
    button.danger:hover { background: #c0392b; }
    button.secondary { background: #333; }
    button.secondary:hover { background: #444; }
    .volume-row { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
    .volume-row label { color: #888; min-width: 70px; }
    input[type=range] { flex: 1; accent-color: #1db954; }
    .volume-value { min-width: 40px; text-align: right; }
    .queue-list { list-style: none; }
    .queue-item {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.7rem 0;
      border-bottom: 1px solid #222;
    }
    .queue-item:last-child { border-bottom: none; }
    .queue-num { color: #555; min-width: 24px; text-align: center; }
    .queue-name { flex: 1; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .queue-dur { color: #888; font-size: 0.85rem; }
    .empty { color: #555; text-align: center; padding: 1rem 0; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #e74c3c; margin-right: 6px; }
    .status-dot.online { background: #1db954; }
  </style>
</head>
<body>
  <h1>🎵 Apollonia</h1>
  <div class="card">
    <h2><span class="status-dot" id="statusDot"></span>Sonando ahora</h2>
    <div class="now-playing">
      <img class="thumbnail" id="thumbnail" src="" alt="">
      <div class="song-info">
        <div class="song-title" id="songTitle">Nada sonando</div>
        <div class="song-duration" id="songDuration">--:-- / --:--</div>
      </div>
    </div>
    <div class="controls">
      <button class="secondary" onclick="emit('pause')">Pausa</button>
      <button class="secondary" onclick="emit('resume')">Reanudar</button>
      <button class="secondary" onclick="emit('skip')">Siguiente</button>
      <button class="danger" onclick="emit('stop')">Stop</button>
    </div>
    <div class="volume-row">
      <label>Volumen</label>
      <input type="range" min="0" max="100" value="70" id="volumeSlider" oninput="updateVolume(this.value)">
      <span class="volume-value" id="volumeValue">70</span>
    </div>
  </div>
  <div class="card">
    <h2>Cola (<span id="queueCount">0</span> canciones)</h2>
    <ul class="queue-list" id="queueList">
      <li class="empty">La cola esta vacia</li>
    </ul>
  </div>
  <script>
    const socket = io();
    let volumeTimeout = null;
    socket.on('state', (data) => {
      const dot = document.getElementById('statusDot');
      dot.className = 'status-dot ' + (data.playing ? 'online' : '');
      if (data.song) {
        document.getElementById('songTitle').textContent = data.song.name;
        document.getElementById('songDuration').textContent = data.song.duration;
        const thumb = document.getElementById('thumbnail');
        if (data.song.thumbnail) {
          thumb.src = data.song.thumbnail;
          thumb.style.display = 'block';
        } else {
          thumb.style.display = 'none';
        }
      } else {
        document.getElementById('songTitle').textContent = 'Nada sonando';
        document.getElementById('songDuration').textContent = '--:-- / --:--';
        const thumb = document.getElementById('thumbnail');
        thumb.src = '';
        thumb.style.display = 'none';
      }
      document.getElementById('volumeSlider').value = data.volume;
      document.getElementById('volumeValue').textContent = data.volume;
      const list = document.getElementById('queueList');
      document.getElementById('queueCount').textContent = data.queue.length;
      if (data.queue.length === 0) {
        list.innerHTML = '<li class="empty">La cola esta vacia</li>';
      } else {
        list.innerHTML = data.queue.map((s, i) =>
          '<li class="queue-item">' +
            '<span class="queue-num">' + (i + 1) + '</span>' +
            '<span class="queue-name">' + s.name + '</span>' +
            '<span class="queue-dur">' + s.duration + '</span>' +
          '</li>'
        ).join('');
      }
    });
    function emit(action) { socket.emit('action', { action }); }
    function updateVolume(val) {
      document.getElementById('volumeValue').textContent = val;
      clearTimeout(volumeTimeout);
      volumeTimeout = setTimeout(() => {
        socket.emit('action', { action: 'volume', value: Number(val) });
      }, 200);
    }
  </script>
</body>
</html>`;

app.get("/", (_, res) => res.send(html));

io.on("connection", (socket) => {
  socket.emit("state", getState());
  socket.on("action", async ({ action, value }) => {
    const queue = player.queues.collection.first();
    if (!queue) return;
    if (action === "pause") await queue.pause();
    if (action === "resume") await queue.resume();
    if (action === "skip") await queue.skip();
    if (action === "stop") await queue.stop();
    if (action === "volume") queue.setVolume(value);
    io.emit("state", getState());
  });
});

httpServer.listen(PORT, () => {
  console.log(`Panel web en http://localhost:${PORT}`);
});

export { io };