import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// Simple ID generator: 6-char base36
function makeId(len = 6) {
  let id = "";
  while (id.length < len) {
    id += Math.random().toString(36).slice(2);
  }
  return id.slice(0, len);
}

// Create a new game and redirect to it
app.get("/new", (req, res) => {
  const roomId = makeId(6);
  res.redirect(`/game/${roomId}`);
});

// Serve index.html for /game/:id (client router handles the rest)
app.get("/game/:roomId", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Data structure to hold room state (memory-only)
const rooms = new Map();
// rooms[roomId] = {
//   players: { X: { id, name }, O: { id, name } },
//   board: Array(9).fill(null), // 'X' | 'O' | null
//   turn: 'X',
//   status: 'waiting' | 'playing' | 'finished',
//   scoreboard: Map(name -> wins),
// }

function getRoom(roomId, createIfMissing = false) {
  if (!rooms.has(roomId) && createIfMissing) {
    rooms.set(roomId, {
      players: { X: null, O: null },
      board: Array(9).fill(null),
      turn: "X",
      status: "waiting",
      scoreboard: new Map()
    });
  }
  return rooms.get(roomId);
}

function roomPlayerCount(room) {
  return ["X", "O"].filter(p => room.players[p]).length;
}

function symbolForSocket(room, socketId) {
  for (const sym of ["X", "O"]) {
    if (room.players[sym]?.id === socketId) return sym;
  }
  return null;
}

function winnerOf(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a]; // 'X' or 'O'
    }
  }
  if (board.every(cell => cell)) return "draw";
  return null;
}

function emitState(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  const players = {
    X: room.players.X ? { name: room.players.X.name } : null,
    O: room.players.O ? { name: room.players.O.name } : null
  };
  const scoreboard = Object.fromEntries(room.scoreboard.entries());
  io.to(roomId).emit("state", {
    players,
    board: room.board,
    turn: room.turn,
    status: room.status,
    scoreboard
  });
}

io.on("connection", (socket) => {
  socket.on("join", ({ roomId, name }) => {
    const room = getRoom(roomId, true);

    // Assign symbol
    if (!room.players.X) {
      room.players.X = { id: socket.id, name: name?.trim() || "Player X" };
      socket.data.symbol = "X";
    } else if (!room.players.O) {
      room.players.O = { id: socket.id, name: name?.trim() || "Player O" };
      socket.data.symbol = "O";
    } else {
      // Spectator - allow join but no moves
      socket.data.symbol = null;
    }

    socket.data.roomId = roomId;
    socket.join(roomId);

    // Initialize scoreboard names if new
    for (const sym of ["X", "O"]) {
      const p = room.players[sym];
      if (p && !room.scoreboard.has(p.name)) room.scoreboard.set(p.name, 0);
    }

    // Start game when 2 players present
    if (roomPlayerCount(room) === 2 && room.status !== "playing") {
      room.board = Array(9).fill(null);
      room.turn = "X";
      room.status = "playing";
    }

    emitState(roomId);
  });

  socket.on("setName", (name) => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    if (!room) return;
    const sym = symbolForSocket(room, socket.id);
    if (!sym) return;
    const oldName = room.players[sym].name;
    const newName = name?.trim() || oldName;
    room.players[sym].name = newName;
    // migrate scoreboard key if needed
    if (oldName !== newName) {
      const oldWins = room.scoreboard.get(oldName) || 0;
      const newWins = room.scoreboard.get(newName) || 0;
      room.scoreboard.delete(oldName);
      room.scoreboard.set(newName, Math.max(oldWins, newWins));
    }
    emitState(roomId);
  });

  socket.on("makeMove", (index) => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    if (!room || room.status !== "playing") return;
    const sym = symbolForSocket(room, socket.id);
    if (!sym) return; // spectators can't play
    if (room.turn !== sym) return;
    if (typeof index !== "number" || index < 0 || index > 8) return;
    if (room.board[index]) return;

    room.board[index] = sym;
    const result = winnerOf(room.board);
    if (result === "X" || result === "O") {
      room.status = "finished";
      const winnerName = room.players[result]?.name || result;
      room.scoreboard.set(winnerName, (room.scoreboard.get(winnerName) || 0) + 1);
    } else if (result === "draw") {
      room.status = "finished";
    } else {
      room.turn = room.turn === "X" ? "O" : "X";
    }
    emitState(roomId);
  });

  socket.on("playAgain", () => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    if (!room) return;
    // Only start if at least one player is present
    if (roomPlayerCount(room) >= 1) {
      room.board = Array(9).fill(null);
      room.turn = "X";
      room.status = roomPlayerCount(room) === 2 ? "playing" : "waiting";
      emitState(roomId);
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room) return;
    for (const sym of ["X", "O"]) {
      if (room.players[sym]?.id === socket.id) {
        room.players[sym] = null;
      }
    }
    const remaining = roomPlayerCount(room);
    if (remaining === 0) {
      rooms.delete(roomId);
    } else {
      room.status = remaining === 2 ? "playing" : "waiting";
      emitState(roomId);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`➡️  Create a new game at http://localhost:${PORT}/new`);
});
