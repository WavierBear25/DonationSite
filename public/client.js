const socket = io();

// Room handling
const pathParts = window.location.pathname.split("/").filter(Boolean);
let roomId = null;
if (pathParts[0] === "game" && pathParts[1]) {
  roomId = pathParts[1];
} else {
  // Not on a game path, bounce to /new to get a link
  window.location.href = "/new";
}

const qs = new URLSearchParams(window.location.search);
const defaultName = localStorage.getItem("t3-name") || "";

// UI refs
const roomLinkEl = document.getElementById("roomLink");
const copyLinkBtn = document.getElementById("copyLink");
const nameInput = document.getElementById("nameInput");
const saveNameBtn = document.getElementById("saveName");
const youAre = document.getElementById("youAre");
const nameX = document.getElementById("nameX");
const nameO = document.getElementById("nameO");
const boardEl = document.getElementById("board");
const cells = [...document.querySelectorAll(".cell")];
const statusText = document.getElementById("statusText");
const playAgainBtn = document.getElementById("playAgain");
const scoresEl = document.getElementById("scores");

const gameUrl = `${location.origin}/game/${roomId}`;
roomLinkEl.textContent = gameUrl;
copyLinkBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(gameUrl);
    copyLinkBtn.textContent = "Copied!";
    setTimeout(() => (copyLinkBtn.textContent = "Copy link"), 1200);
  } catch (e) {
    alert("Couldn't copy. Copy this:\n" + gameUrl);
  }
});

nameInput.value = defaultName;
saveNameBtn.addEventListener("click", () => {
  const n = nameInput.value.trim().slice(0, 20);
  if (!n) return;
  localStorage.setItem("t3-name", n);
  socket.emit("setName", n);
});

// Join the room
socket.emit("join", { roomId, name: defaultName || null });

// State handling
let mySymbol = null; // set after first state when server knows
function renderState(s) {
  // Players
  nameX.textContent = s.players.X ? s.players.X.name : "—";
  nameO.textContent = s.players.O ? s.players.O.name : "—";

  // Determine my symbol by comparing localStorage name (best-effort)
  // The server doesn't expose socket ids to client, so infer by symbol presence and board turn decisions.
  // We'll just mark "you are X/O" once either name matches or your turn works.
  const myName = localStorage.getItem("t3-name");
  if (myName && s.players.X && s.players.X.name === myName) mySymbol = "X";
  else if (myName && s.players.O && s.players.O.name === myName) mySymbol = "O";
  youAre.textContent = mySymbol ? `(You are ${mySymbol})` : "";

  // Board
  s.board.forEach((v, i) => {
    cells[i].textContent = v || "";
    cells[i].disabled = !!v || s.status !== "playing" || (mySymbol && s.turn !== mySymbol);
  });

  // Status
  let text = "";
  if (s.status === "waiting") text = "Waiting for another player to join…";
  if (s.status === "playing") text = `Turn: ${s.turn}`;
  if (s.status === "finished") text = "Game over.";
  statusText.textContent = text;

  // Scoreboard
  scoresEl.innerHTML = "";
  const entries = Object.entries(s.scoreboard).sort((a,b)=>b[1]-a[1]);
  for (const [name, wins] of entries) {
    const li = document.createElement("li");
    const left = document.createElement("span");
    left.textContent = name;
    const right = document.createElement("strong");
    right.textContent = wins;
    li.appendChild(left);
    li.appendChild(right);
    scoresEl.appendChild(li);
  }
}

socket.on("state", (s) => {
  renderState(s);
});

// Moves
for (const cell of cells) {
  cell.addEventListener("click", () => {
    const i = Number(cell.dataset.i);
    socket.emit("makeMove", i);
  });
}

playAgainBtn.addEventListener("click", () => {
  socket.emit("playAgain");
});
